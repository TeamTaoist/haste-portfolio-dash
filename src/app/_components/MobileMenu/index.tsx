"use client"

import { RootState } from '@/store/store';
import { setCurrentWalletAddress, WalletItem } from '@/store/wallet/walletSlice';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';
import { formatString } from '@/utils/common';

const DropdownSelect: React.FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const wallets = useSelector((state: RootState) => state.wallet.wallets);
    const currentAddress: string | undefined = useSelector((state: RootState) => state.wallet.currentWalletAddress);
    const [currentWallet, setCurrentWallet] = useState<WalletItem>();
    const dispatch = useDispatch();

    const toggleDropdown = () => setIsOpen(!isOpen);

    useEffect(() => {
      const current = wallets.find(wallet => wallet.address === currentAddress);
      setCurrentWallet(current!!)
    }, [currentAddress])

    return (
        <div className="relative">
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
                <div className="absolute top-full w-full bg-primary008 mt-1 border border-primary002 rounded-md">
                    {wallets.map((wallet, index) => (
                        <div key={index}
                        className={`
                          ${wallet.address === currentAddress ? 'bg-primary009 rounded-md': ''}
                          flex items-center text-black justify-between p-2 hover:bg-primary011`
                        }
                        onClick={() => {
                          dispatch(setCurrentWalletAddress(wallet.address))
                          setIsOpen(false)
                        }}>
                            <Image
                              src={`/img/${wallet.chain}.png`}
                              width={24}
                              height={24}
                              className='rounded-full'
                              alt={'icon'}
                            />
                            <div className=' font-SourceSanPro flex justify-center items-end flex-col'>
                              <span>{formatString(wallet.address, 5)}</span>
                              <span className=' font-semibold'>{wallet.balance}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DropdownSelect;
