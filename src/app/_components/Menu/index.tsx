import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store'; // 确保路径正确
import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon, Component1Icon, FileTextIcon, GridIcon, PaperPlaneIcon, ThickArrowLeftIcon } from '@radix-ui/react-icons';
import { initializeWallets } from '@/store/wallet/walletSlice';

const ResponsiveSidebar: React.FC = () => {
  const [isColleapse, setIsColleapse] = useState<boolean>(true);
  const [activeTab, isActiveTab] = useState<string>('dashboard')
  const deviceType = useSelector((state: RootState) => state.device.type);

  const toggleSidebar = () => {
    setIsColleapse(!isColleapse);
  };

  const dispatch = useDispatch();
  useEffect(() => {
    const storedWallets = localStorage.getItem('wallets');
    if (storedWallets) {
      dispatch(initializeWallets(JSON.parse(storedWallets)));
    }
  }, [dispatch]);

  return (
    <div className='h-full'>
      {deviceType === 'desktop' ? (
        <div className={`pt-8
            ${isColleapse ? 'left-0 w-48' : 'w-14'} 
            h-full bg-primary011 text-white transition-width duration-300`}>
          <div className='h-12 relative flex items-center justify-center group'>
            <div className=' font-Montserrat text-hd2mb'>
              {isColleapse ? 'caboroca' : 'ca'}
            </div>
            <div 
              className='cursor-pointer absolute right-[-10px] w-6 h-6 flex justify-center items-center rounded-full border-2 border-white001 opacity-0 group-hover:opacity-100 transition-opacity duration-200'
              onClick={toggleSidebar}
            >
            {
              isColleapse ? <CaretLeftIcon color='white' /> : <CaretRightIcon color='white' />
            }
          </div>
          </div>
          <div className='flex flex-col mt-8'>
            <div className='flex items-center px-4 gap-4 py-4'>
              <Component1Icon color="#8C92BA" className='w-6 h-6'/>
              {
                isColleapse && <p className={`font-SourceSanPro text-body1mb ${activeTab === 'dashboard' ? 'font-semibold': ''}`}>Dashboard</p>
              }
            </div>
          </div>
          <div className='flex flex-col'>
            <div className='flex items-center px-4 gap-4 py-4'>
              <FileTextIcon color="#8C92BA" className='w-6 h-6'/>
              {
                isColleapse && <p className={`font-SourceSanPro text-body1mb ${activeTab === 'transaction' ? 'font-semibold': ''}`}>Transaction</p>
              }
            </div>
          </div>
          <div className='flex flex-col'>
            <div className='flex items-center px-4 gap-4 py-4'>
              <PaperPlaneIcon color="#8C92BA" className='w-6 h-6'/>
              {
                isColleapse && <p className={`font-SourceSanPro text-body1mb ${activeTab === 'send' ? 'font-semibold': ''}`}>Send & Receive</p>
              }
            </div>
          </div>  
        </div>
      ) : (
        // 移动视图
        <div className="fixed top-0 left-0 w-full h-12 bg-gray-800 text-white flex items-center">
          <button onClick={toggleSidebar} className="m-2 p-2 bg-gray-700 rounded">
            Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default ResponsiveSidebar;
