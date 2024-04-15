"use client"

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store'; 
import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon, Component1Icon, FileTextIcon, GearIcon, GridIcon, PaperPlaneIcon, PlusIcon, ThickArrowLeftIcon } from '@radix-ui/react-icons';
import Image from 'next/image';
import { formatString } from '@/utils/common';
import CustomModal from '../Dialog';
import WalletModalContent from '../Dialog/WalletDialog';
import { useDispatch } from 'react-redux';
import { removeWalletItem, setCurrentWalletAddress } from '@/store/wallet/walletSlice';
import { ChevronsLeft, ChevronsRight, Unplug } from 'lucide-react';

const AccountSidebar: React.FC = () => {
  const [isColleapse, setIsColleapse] = useState<boolean>(true);
  const [isOpenWalletModal, setIsOpenWalletModal] = useState<boolean>(false)
  const wallets = useSelector((state: RootState) => state.wallet.wallets);
  const currentWallet: string | undefined = useSelector((state: RootState) => state.wallet.currentWalletAddress);
  const deviceType = useSelector((state: RootState) => state.device.type);

  const dispatch = useDispatch();

  const toggleSidebar = () => {
    setIsColleapse(!isColleapse);
  };

  useEffect(() => {
    let walletData;
    
    if (wallets.length) {
      walletData = wallets
      console.log(walletData);
    } else {
      const walletsStr = localStorage ? localStorage.getItem('wallets') : ''
      try {
        walletData = JSON.parse(walletsStr!!);
      } catch {
        walletData = null
      }
    }

    if (!walletData || !walletData.length) {
      setIsOpenWalletModal(true);
    }
  }, [wallets]);

  return (
    <div className='h-full'>
      <CustomModal isOpen={isOpenWalletModal}
        onClose={() => {
          setIsOpenWalletModal(false)
        }}
      >
        <WalletModalContent onClose={() => setIsOpenWalletModal(false)}></WalletModalContent>
      </CustomModal>
      {deviceType === 'desktop' ? (
        <div className={`pt-8
            ${isColleapse ? 'left-0 w-72' : 'w-14'} 
            h-full bg-gray-100 transition-width duration-300 border-r border-gray-300`}>
          <div className='h-12 relative flex items-center justify-center group'>
            <div className={`w-full font-Montserrat text-hd2mb ${isColleapse ? '': 'flex justify-center'}`}>
              {isColleapse && <>
                <div className='w-full flex justify-between px-8'>
                  <p>Account</p>
                  <div className='flex items-center gap-2'>
                    <div className='border-1 rounded-full bg-white w-6 h-6 flex justify-center items-center cursor-pointer' onClick={() => {
                      setIsOpenWalletModal(true)
                    }}>
                      <PlusIcon className='w-4 h-4 ' />
                    </div>
                    {/*<div className='w-6 h-6 flex justify-center items-center'>*/}
                    {/*  <GearIcon className='w-6 h-6' />*/}
                    {/*</div>*/}
                  </div>
                </div>
              </>}
              {!isColleapse && <>
                <div className='border-2 rounded-full w-6 h-6 flex justify-center items-center bg-white'>
                  <PlusIcon className='w-4 h-4' />
                </div>
              </>}
            </div>
            <div
              className='cursor-pointer absolute right-[-10px] w-6 h-6 flex justify-center items-center rounded-full border-2 border-white001  bg-white transition-opacity duration-200'
              onClick={toggleSidebar}
            >
            {
              isColleapse ? <ChevronsLeft className="opacity-10 group-hover:opacity-100 "/> : <ChevronsRight className="opacity-10 group-hover:opacity-100 " />
            }
          </div>
          </div>
          <div className='flex flex-col mt-8 border-t border-gray-200'>
            {wallets.map(wallet => (
              <div key={wallet.address} className={` 
                flex items-center py-2 border-b border-gray-200 ba cursor-pointer firstLi
                ${wallet.address === currentWallet ? 'bg-white': 'bg-gray-100'}
              `}
                onClick={() => {
                  dispatch(setCurrentWalletAddress(wallet.address))
                }}
              >
              <div className='py-4 px-4'>
                <Image className='border rounded-full overflow-hidden' src={`/img/${wallet.chain}.png`} width={40} height={40} alt={wallet.chain}></Image>
              </div>
              {
                isColleapse &&
                <>
                  <div className='w-full px-2 '>
                    <div className='w-full flex justify-between'>
                      <div className=' font-SourceSanPro '>{formatString(wallet.address, 5)}</div>
                      {/* <div className=' font-SourceSanPro font-semibold text-primary003'> ${wallet}</div> */}
                    </div>
                    <div className='flex'>
                      <div className='font-SourceSanPro text-black opacity-30 uppercase'>{wallet.chain} {wallet.balance}</div>
                    </div>
                  </div>
                  <div
                    className='pr-4 opacity-20 hover:opacity-100 transition-opacity duration-200 text-primary011 '
                    onClick={() => {
                      dispatch(removeWalletItem(wallet.address));
                    }}
                  >
                    <Unplug />
                  </div>
                </>
              }
            </div>
            ) )}
          </div>
        </div>
      ) : (
        // Mobile View
        <div className="fixed top-0 left-0 w-full h-12 bg-gray-800 flex items-center">
          <button onClick={toggleSidebar} className="m-2 p-2 bg-gray-700 rounded">
            Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountSidebar;
