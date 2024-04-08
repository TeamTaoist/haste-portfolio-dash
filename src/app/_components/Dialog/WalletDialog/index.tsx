import ModalContext from '@/context/ModalContext';
import { getBTC } from '@/query/btc/memepool';
import { getBTCAsset } from '@/query/btc/tools';
import { RootState } from '@/store/store';
import { addWalletItem } from '@/store/wallet/walletSlice';
import { JoyIDBTCconnect, JoyIDCKBConnect, OKXConnect, UnisatConnect } from '@/utils/connect';
import Image from 'next/image';
import { enqueueSnackbar } from 'notistack';
import React, { useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { AccountData } from '../../../../types/BTC';
import { getCKBCapacity } from '@/query/ckb/tools';

interface walletModalProps {
  onClose: () => void
}

const WalletModalContent: React.FC<walletModalProps> = () => {
  const { onClose } = useContext(ModalContext);
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const dispatch = useDispatch()

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
      if(props.chain === 'btc') {
        let accountData = await _getBTCBalance(props.address);
        balance = accountData?.chain_stats.funded_txo_sum;
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
    }
    
  };
  const connectOKXWallet = async () => {
    let rlt = await OKXConnect();

    checkWalletByAddress({
      address: rlt.address,
      chain: 'btc',
      walletName: 'okx',
      pubKey: rlt.publicKey
    })
  }

  const connectUnisatWallet = async () => {
    let rlt = await UnisatConnect();
    checkWalletByAddress({
      address: rlt.accounts[0],
      chain: 'btc',
      walletName: 'unisat',
      pubKey: rlt.pubkey
    })
  }

  const connectJoyIDBTCWallet = async () => {
    let rlt = await JoyIDBTCconnect();
    checkWalletByAddress({
      address: rlt.address,
      chain: 'btc',
      walletName: 'joyidbtc',
      pubKey: rlt.publicKey!!
    })
  }

  const connectJoyIDCKBWallet = async () => {
    let rlt = await JoyIDCKBConnect();
    checkWalletByAddress({
      address: rlt.address,
      chain: 'ckb',
      walletName: 'joyidckb',
      pubKey: rlt.publickKey
    })
  }



  useEffect(() => {console.log(wallets)}, [wallets])
  
  return (
    <div
      className="w-96 flex flex-col gap-4" 
    >
      <div className="font-Montserrat text-primary001">Connect a Wallet</div>
      <div className="flex items-center justify-center">
        <div className="w-10 border-t border-gray-400"></div>
        <span className="mx-4 text-white001 font-SourceSanPro">BTC</span>
        <div className="flex-grow border-t border-gray-400"></div>
      </div>
      <div className="flex flex-col gap-4">
        <div className='flex items-center gap-4 border rounded-2xl py-2 px-2 bg-primary008 relative cursor-pointer' onClick={connectOKXWallet}>
          <Image className='rounded-full' src={'/img/okx.png'} width={40} height={40} alt={'btc-okx'}/>
          <p className='text-white001 font-Montserrat'>OKX</p>
          {/* <div className='w-9 h-9 bg-success-function rounded-full flex items-center justify-center absolute right-4'>
            <CheckIcon className='w-7 h-7' color='#ffffff'/>
          </div> */}
        </div>
        <div className='flex items-center gap-4 border rounded-2xl py-2 px-2 bg-primary008 cursor-pointer' onClick={connectUnisatWallet}>
          <Image className='rounded-full' src={'/img/unisat.png'} width={40} height={40} alt={'btc-okx'}/>
          <p className='text-white001 font-Montserrat'>Unisat</p>
        </div>
        <div className='flex items-center gap-4 border rounded-2xl py-2 px-2 bg-primary008 cursor-pointer' onClick={connectJoyIDBTCWallet}>
          <Image className='rounded-full' src={'/img/joyid.png'} width={40} height={40} alt={'btc-okx'}/>
          <p className='text-white001 font-Montserrat'>JoyID</p>
        </div>  
      </div>
      <div className="flex items-center justify-center">
        <div className="w-10 border-t border-gray-400"></div>
        <span className="mx-4 text-white001 font-SourceSanPro">CKB</span>
        <div className="flex-grow border-t border-gray-400"></div>
      </div>
      <div className='flex items-center gap-4 border rounded-2xl py-2 px-2 bg-primary008 cursor-pointer' onClick={connectJoyIDCKBWallet}>
        <Image className='rounded-full' src={'/img/okx.png'} width={40} height={40} alt={'btc-okx'}/>
        <p className='text-white001 font-Montserrat'>OKX</p>
      </div> 
      <div className='flex justify-between'>
        <div 
          className='w-[48%] text-primary001 border rounded-lg py-2 font-Montserrat text-center cursor-pointer'
          onClick={onClose}
        >
          cancel
        </div>
        <div 
          className='w-[48%] bg-primary011 text-primary001 rounded-lg py-2 font-Montserrat text-center cursor-pointer'
          onClick={onClose}
        >
          Confirm
        </div>
      </div>
    </div>
  )
}

export default WalletModalContent