"use client"

import { RootState } from '@/store/store';
import { setCurrentWalletAddress, WalletItem } from '@/store/wallet/walletSlice';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import { formatString } from '@/utils/common';
import CustomModal from "@/app/_components/Dialog";
import WalletModalContent from "@/app/_components/Dialog/WalletDialog";

import {
SquarePlus
} from "lucide-react";
import {getBTCAsset} from "@/query/btc/tools";
import {getCKBCapacity} from "@/query/ckb/tools";
import BigNumber from "bignumber.js";
import {BitcoinUnit} from "bitcoin-units";

const DropdownSelect: React.FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const wallets = useSelector((state: RootState) => state.wallet.wallets);
    const currentAddress: string | undefined = useSelector((state: RootState) => state.wallet.currentWalletAddress);
    const [currentWallet, setCurrentWallet] = useState<WalletItem>();
    const dispatch = useDispatch();
    const [isOpenWalletModal, setIsOpenWalletModal] = useState<boolean>(false)

    const [list,setList] = useState<WalletItem[]>([])
    const toggleDropdown = () => setIsOpen(!isOpen);

    useEffect(() => {
      const current = wallets.find(wallet => wallet.address === currentAddress);
      setCurrentWallet(current!!)
    }, [currentAddress])


    useEffect(() => {

        if(!wallets?.length)return;
        setList(wallets)

        getListBalance()

    }, [wallets]);

    const getListBalance = async() =>{

        let arr:WalletItem[] =[];

        for (let key in  wallets){
            let wallet = wallets[key]
            let balance = await getBalance(wallet)  ?? 0
            arr.push({
                ...wallet,
                balance:balance.toString()
            })
        }

        setList([...arr])
    }


    const _getBTCBalance = async (address: string) => {
        const rlt = await getBTCAsset(address);

        return rlt
    }

    const _getCKBCapacity = async (address: string) => {
        const rlt = await getCKBCapacity(address);
        return rlt
    }

    const getBalance = async(wallet:any) =>{
        let balance;
        if(wallet.chain === 'btc') {
            let accountData = await _getBTCBalance(wallet.address);
            // balance = formatUnit(accountData?.chain_stats.funded_txo_sum!!, 'ckb');

            const { chain_stats, mempool_stats } = accountData as any;
            const inputSum = new BigNumber(chain_stats.funded_txo_sum).plus(mempool_stats.funded_txo_sum)
            const outputSum = new BigNumber(chain_stats.spent_txo_sum).plus(mempool_stats.spent_txo_sum)
            const result = inputSum.minus(outputSum);
            let rt = result.toNumber();

            balance =   new BitcoinUnit(rt, 'sats').to('BTC').getValue();

        } else if (wallet.chain === 'ckb') {
            balance = await _getCKBCapacity(wallet.address);
            balance = (balance.toNumber() / (10 ** 8)).toFixed(2);
        }

        return balance;
    }

    return (
        <div className="relative">

            <CustomModal isOpen={isOpenWalletModal}
                         onClose={() => {
                             setIsOpenWalletModal(false)
                         }}
            >
                <WalletModalContent onClose={() => setIsOpenWalletModal(false)}></WalletModalContent>
            </CustomModal>
            <div
              className={`
                flex items-center justify-between border rounded-md bg-primary011 text-white px-4 py-2 gap-4 cursor-pointer
              `}
              onClick={toggleDropdown}>
                <Image
                  src={`/img/${currentWallet?.chain}.png`}
                  width={24}
                  height={24}
                  className='rounded-full border border-gray-200'
                  alt={'icon'}
                />
                <div className=' font-SourceSanPro flex justify-center items-end flex-col'>
                  <span>{currentWallet && formatString(currentWallet?.address, 5)}</span>
                </div>
            </div>
            {isOpen && (
                <div className="absolute top-full w-full bg-white mt-1  rounded-md">
                    {list.map((wallet, index) => (
                        <div key={index}
                        className={`
                          ${wallet.address === currentAddress ? 'bg-gray-200': ''}
                          flex items-center text-black justify-between p-2 border-b border-gray-200 hover:bg-primary011  `
                        }
                        onClick={() => {
                          dispatch(setCurrentWalletAddress(wallet.address))
                          setIsOpen(false)
                        }}>
                            <Image
                              src={`/img/${wallet.chain}.png`}
                              width={24}
                              height={24}
                              className='rounded-full border border-gray-300'
                              alt={'icon'}
                            />
                            <div className=' font-SourceSanPro flex justify-center items-end flex-col'>
                              <span>{formatString(wallet.address, 5)}</span>
                              <span className='uppercase text-sm text-gray-400'>{wallet.chain} {wallet.balance}</span>
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center text-black  gap-8 p-2 hover:bg-primary011" onClick={()=>setIsOpenWalletModal(true)}>
                        <SquarePlus />
                        <div className=' font-SourceSanPro flex justify-center flex-col'>
                            <span>Add Account</span>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default DropdownSelect;
