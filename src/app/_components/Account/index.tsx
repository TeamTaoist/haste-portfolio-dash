import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store'; // 确保路径正确
import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon, Component1Icon, FileTextIcon, GearIcon, GridIcon, PaperPlaneIcon, PlusIcon, ThickArrowLeftIcon } from '@radix-ui/react-icons';
import Image from 'next/image';
import { formatString } from '@/utils/common';
import CustomModal from '../Dialog';
import WalletModalContent from '../Dialog/WalletDialog';

const AccountSidebar: React.FC = () => {
  const [isColleapse, setIsColleapse] = useState<boolean>(true);
  const [isOpenWalletModal, setIsOpenWalletModal] = useState<boolean>(true)

  const deviceType = useSelector((state: RootState) => state.device.type);

  const toggleSidebar = () => {
    setIsColleapse(!isColleapse);
  };

  return (
    <div className='h-full'>
      <CustomModal isOpen={isOpenWalletModal} 
        onClose={() => {
          setIsOpenWalletModal(false)
        }}
        
      >
        <WalletModalContent></WalletModalContent>
      </CustomModal>
      {deviceType === 'desktop' ? (
        <div className={`pt-8
            ${isColleapse ? 'left-0 w-72' : 'w-14'} 
            h-full bg-primary010 text-white transition-width duration-300`}>
          <div className='h-12 relative flex items-center justify-center'>
            <div className={`w-full font-Montserrat text-hd2mb ${isColleapse ? '': 'flex justify-center'}`}>
              {isColleapse && <>
                <div className='w-full flex justify-between px-6'>
                  <p>Account</p>
                  <div className='flex items-center gap-2'>
                    <div className='border-2 rounded-full w-6 h-6 flex justify-center items-center'>
                      <PlusIcon className='w-4 h-4' />
                    </div>
                    <div className='w-6 h-6 flex justify-center items-center'>
                      <GearIcon className='w-6 h-6' />
                    </div>
                  </div>
                </div>
              </>}
              {!isColleapse && <>
                <div className='border-2 rounded-full w-6 h-6 flex justify-center items-center'>
                  <PlusIcon className='w-4 h-4' />
                </div>
              </>}
            </div>
            <div 
              className='cursor-pointer absolute right-[-10px] w-6 h-6 flex justify-center items-center rounded-full border-2 border-white001'
              onClick={toggleSidebar}
            >
            {
              isColleapse ? <CaretLeftIcon color='white' /> : <CaretRightIcon color='white' />
            }
          </div>
          </div>
          <div className='flex flex-col mt-8'>
            <div className='flex items-center bg-primary008 py-2 border-b'>
              <div className='py-4 px-4'>
                <Image className='border rounded-full overflow-hidden' src={`/img/btc.png`} width={40} height={40} alt={'btc'}></Image>
              </div>
              {
                isColleapse && 
                <div className='w-full px-2'>
                  <div className='w-full flex justify-between'>
                    <div className=' font-SourceSanPro font-semibold text-primary003'>{formatString('0xasdafasf13faafh183fn8anf1', 5)}</div>
                    <div className=' font-SourceSanPro font-semibold text-primary003'>$ 888</div>
                  </div>
                  <div className='flex'>
                    <div className=' font-SourceSanPro text-primary003'>BTC</div>
                  </div>
                </div>
              }
            </div>
            <div className='flex items-center bg-primary008 py-2 border-b'>
              <div className='py-4 px-4'>
                <Image className='border rounded-full overflow-hidden' src={`/img/btc.png`} width={40} height={40} alt={'btc'}></Image>
              </div>
              {
                isColleapse && 
                <div className='w-full px-2'>
                  <div className='w-full flex justify-between'>
                    <div className=' font-SourceSanPro font-semibold text-primary003'>{formatString('0xasdafasf13faafh183fn8anf1', 5)}</div>
                    <div className=' font-SourceSanPro font-semibold text-primary003'>$ 888</div>
                  </div>
                  <div className='flex'>
                    <div className=' font-SourceSanPro text-primary003'>BTC</div>
                  </div>
                </div>
              }
            </div>
            <div className='flex items-center bg-primary008 py-2 border-b'>
              <div className='py-4 px-4'>
                <Image className='border rounded-full overflow-hidden' src={`/img/ckb.png`} width={40} height={40} alt={'btc'}></Image>
              </div>
              {
                isColleapse && 
                <div className='w-full px-2'>
                  <div className='w-full flex justify-between'>
                    <div className=' font-SourceSanPro font-semibold text-primary003'>{formatString('0xasdafasf13faafh183fn8anf1', 5)}</div>
                    <div className=' font-SourceSanPro font-semibold text-primary003'>$ 888</div>
                  </div>
                  <div className='flex'>
                    <div className=' font-SourceSanPro text-primary003'>BTC</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      ) : (
        // Mobile View
        <div className="fixed top-0 left-0 w-full h-12 bg-gray-800 text-white flex items-center">
          <button onClick={toggleSidebar} className="m-2 p-2 bg-gray-700 rounded">
            Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountSidebar;
