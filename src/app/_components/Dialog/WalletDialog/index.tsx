"use client"

import ModalContext from '@/context/ModalContext';
import { getBTC } from '@/query/btc/memepool';
import { getBTCAsset } from '@/query/btc/tools';
import { RootState } from '@/store/store';
import { addWalletItem } from '@/store/wallet/walletSlice';
import { JoyIDBTCconnect, JoyIDCKBConnect, OKXConnect, UnisatConnect } from '@/utils/connect';
import Image from 'next/image';
import { enqueueSnackbar } from 'notistack';
import React, { useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { AccountData } from '../../../../types/BTC';
import { getCKBCapacity } from '@/query/ckb/tools';
import { BI } from '@ckb-lumos/lumos';
import { formatUnit } from '@ckb-lumos/bi';

interface walletModalProps {
  onClose: () => void
}

const WalletModalContent: React.FC<walletModalProps> = () => {
  const { onClose } = useContext(ModalContext);
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const _getBTCBalance = async (address: string) => {
    const rlt = await getBTCAsset(address);
    return rlt
  }

  const _getCKBCapacity = async (address: string) => {
    const rlt = await getCKBCapacity(address);
    return rlt
  }

  const checkWalletByAddress = async (props: {
    address: string,
    chain: string,
    walletName: string,
    pubKey: string
  }) => {
    if(wallets.some(wallet => wallet.address === props.address)) {
      enqueueSnackbar("Account Already Connected", {variant: "error"})
    } else {
      let balance;
      onClose();
      console.log('here close')
      if(props.chain === 'btc') {
        let accountData = await _getBTCBalance(props.address);
        balance = formatUnit(accountData?.chain_stats.funded_txo_sum!!, 'ckb');
      } else if (props.chain === 'ckb') {
        balance = await _getCKBCapacity(props.address);
        balance = (balance.toNumber() / (10 ** 8)).toFixed(2);
      }
      dispatch(addWalletItem({
        address: props.address,
        chain: props.chain,
        walletName: props.walletName,
        pubKey: props.pubKey,
        balance: balance ? balance.toString() : '',
      }))
      setIsLoading(false);
    }
  };
  const connectOKXWallet = async () => {
    setIsLoading(true);
    try {
      let rlt = await OKXConnect();
      enqueueSnackbar("Connect OKX Wallet Successful", {variant: 'success'});
      checkWalletByAddress({
        address: rlt.address,
        chain: 'btc',
        walletName: 'okx',
        pubKey: rlt.publicKey
      })
    } catch {
      enqueueSnackbar("Connect Failed", {variant: 'error'});
    }
  }

  const connectUnisatWallet = async () => {
    setIsLoading(true);
    try {
      let rlt = await UnisatConnect();
      enqueueSnackbar("Connect Unisat Wallet Successful", {variant: 'success'});
      checkWalletByAddress({
        address: rlt.accounts[0],
        chain: 'btc',
        walletName: 'unisat',
        pubKey: rlt.pubkey
      })
    } catch {
      enqueueSnackbar("Connect Failed", {variant: 'error'});
    }
  }

  const connectJoyIDBTCWallet = async () => {
    setIsLoading(true);
    try {
      let rlt = await JoyIDBTCconnect();
      enqueueSnackbar("Connect JoyID BTC Wallet Successful", {variant: 'success'});
      checkWalletByAddress({
        address: rlt.address,
        chain: 'btc',
        walletName: 'joyidbtc',
        pubKey: rlt.publicKey!!
      })
    } catch {
      enqueueSnackbar("Connect Failed", {variant: 'error'});
    }
  }

  const connectJoyIDCKBWallet = async () => {
    setIsLoading(true);
    try {
      let rlt = await JoyIDCKBConnect();
      checkWalletByAddress({
        address: rlt.address,
        chain: 'ckb',
        walletName: 'joyidckb',
        pubKey: rlt.publickKey
      });
      enqueueSnackbar("Connect JoyID BTC Wallet Successful", {variant: 'success'});
    } catch {
      enqueueSnackbar("Connect Failed", {variant: 'error'});
    }
  }

  return (
    <>
      {
        isLoading &&
        <div className='absolute w-full h-full z-10  bg-opacity-80 rounded-lg bg-black flex flex-col justify-center items-center gap-4 pb-5'>
          <Image
            src={'/img/joker.png'}
            width={128}
            height={128}
            alt='joker loading'
          />
          <p className='text-black font-Montserrat'>Your Wallet is Connecting……</p>
        </div>
      }
      <div
      className="w-96 p-4  flex flex-col gap-4 relative"
    >
      <div className="font-Montserrat text-black">Connect a Wallet</div>
      <div className="flex items-center justify-center">
        <div className="w-10 border-t border-gray-400"></div>
        <span className="mx-4 text-black font-SourceSanPro">BTC</span>
        <div className="flex-grow border-t border-gray-400"></div>
      </div>
      <div className="flex flex-col gap-4">
        <div className='flex items-center gap-4 rounded py-2 px-2 bg-white relative cursor-pointer' onClick={connectOKXWallet}>
          <Image className='rounded-full' src={'/img/okx.png'} width={40} height={40} alt={'btc-okx'}/>
          <p className='text-black font-Montserrat'>OKX</p>
          {/* <div className='w-9 h-9 bg-success-function rounded-full flex items-center justify-center absolute right-4'>
            <CheckIcon className='w-7 h-7' color='#ffffff'/>
          </div> */}
        </div>
        <div className='flex items-center gap-4 rounded py-2 px-2 bg-white cursor-pointer' onClick={connectUnisatWallet}>
          <Image className='rounded-full' src={'/img/unisat.png'} width={40} height={40} alt={'btc-unisat'}/>
          <p className='text-black font-Montserrat'>Unisat</p>
        </div>
        <div className='flex items-center gap-4 rounded py-2 px-2 bg-white cursor-pointer' onClick={connectJoyIDBTCWallet}>
          <Image className='rounded-full' src={'/img/joyid.png'} width={40} height={40} alt={'btc-joyid'}/>
          <p className='text-black font-Montserrat'>JoyID</p>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <div className="w-10 border-t border-gray-400"></div>
        <span className="mx-4 text-black font-SourceSanPro">CKB</span>
        <div className="flex-grow border-t border-gray-400"></div>
      </div>
      <div className='flex items-center gap-4 rounded py-2 px-2 bg-white cursor-pointer' onClick={connectJoyIDCKBWallet}>
        <Image className='rounded-full' src={'/img/joyid.png'} width={40} height={40} alt={'ckb-joyid'}/>
        <p className='text-black font-Montserrat'>JoyID</p>
      </div>
    </div>
    </>

  )
}

export default WalletModalContent
