import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon, Component1Icon, FileTextIcon, GridIcon, PaperPlaneIcon, ThickArrowLeftIcon } from '@radix-ui/react-icons';
import { initializeWallets } from '@/store/wallet/walletSlice';
import { AlignJustify, ChevronsLeft, ChevronsRight, LayoutDashboard, NotebookText, SendToBack } from 'lucide-react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import DropdownSelect from '../MobileMenu';

const ResponsiveSidebar: React.FC = () => {
  const [isColleapse, setIsColleapse] = useState<boolean>(true);
  const deviceType = useSelector((state: RootState) => state.device.type);
  const activeTab = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMobile = () => {
    setIsOpen(!isOpen)
  }

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
            ${isColleapse ? 'left-0 w-46' : 'w-14'} 
            h-full bg-white text-black transition-width duration-300`}>
          <div className='h-12 relative flex items-center justify-center group'>
            <div className=' font-Montserrat text-hd2mb capitalize logo flex gap-4 pl-4 pb-5'>

              {
                isColleapse && <>
                    <img src="/img/logo.png" alt=""/>
                    <span>Haste</span>
                  </>
              }
              {
                  !isColleapse && <img src="/img/logo.png" alt=""/>
              }
            </div>
            <div
              className='cursor-pointer absolute right-[-10px] w-6 h-6 flex justify-center items-center rounded-full border-2 border-white001 opacity-50 group-hover:opacity-100 transition-opacity duration-200 text-black bg-white'
              onClick={toggleSidebar}
            >
            {
              isColleapse ? <ChevronsLeft/> : <ChevronsRight />
            }
          </div>
          </div>
          <Link className={activeTab === '/' ? 'flex flex-col mt-8 border-l-primary011 border-l-4 rounded-l': 'flex flex-col mt-8 border-l-white border-l-4'} href="/">
            <div className='flex items-center px-4 gap-4 py-1 cursor-pointer'>
              <LayoutDashboard className={activeTab === '/' ? 'text-primary011': ''}/>
              {
                isColleapse && <p className={`font-SourceSanPro text-body1mb ${activeTab === '/' ? 'font-semibold text-primary011': ''}`}>Dashboard</p>
              }
            </div>
          </Link>
          <Link  className={activeTab === '/transaction' ? 'flex flex-col mt-8 border-l-primary011 border-l-4 rounded-l': 'flex flex-col mt-8 border-l-white border-l-4'} href="transaction">
            <div className='flex items-center px-4 gap-4 py-1 cursor-pointer'>
              <NotebookText className={activeTab === '/transaction' ? 'text-primary011': ''} />
              {
                isColleapse && <p className={`font-SourceSanPro text-body1mb ${activeTab === '/transaction' ? 'font-semibold text-primary011': ''}`}>Transaction</p>
              }
            </div>
          </Link>
          <Link className={activeTab === '/send' ? 'flex flex-col mt-8 border-l-primary011 border-l-4 rounded-l': 'flex flex-col mt-8 border-l-white border-l-4' } href="send">
            <div className='flex items-center px-4 gap-4 py-1 cursor-pointer'>
              <SendToBack className={activeTab === '/send' ? 'text-primary011': ''} />
              {
                isColleapse && <p className={`font-SourceSanPro text-body1mb ${activeTab === '/send' ? 'font-semibold text-primary011': ''}`}>Send & Receive</p>
              }
            </div>
          </Link>
        </div>
      ) : (
        // 移动视图
          <>
            <div className="fixed top-0 px-4 left-0 w-full h-16 bg-gray-100 text-black flex justify-between items-center z-50">
                {
                  isOpen ? <AlignJustify className='rotate-90' onClick={toggleMobile}/> : <AlignJustify onClick={toggleMobile}/>
                }
                <DropdownSelect />
            </div>
            <div className={`fixed top-0 left-0 bg-white w-full text-black h-full z-40 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}>
                <button onClick={toggleMobile} className="text-black p-4">Close</button>
                <div>
                  <Link className='flex flex-col' href="/">
                    <div className='flex items-center px-4 gap-4 py-4 cursor-pointer'>
                      <LayoutDashboard className={` ${activeTab === '/' ? ' text-primary011': ''}`} />
                      {
                        isColleapse && <p className={` text-body1mb ${activeTab === '/' ? 'font-Montserrat text-primary011': ''}`}>Dashboard</p>
                      }
                    </div>
                  </Link>
                  <Link className='flex flex-col' href="transaction">
                    <div className='flex items-center px-4 gap-4 py-4 cursor-pointer'>
                      <NotebookText className={` ${activeTab === '/transaction' ? ' text-primary011': ''}`} />
                      {
                        isColleapse && <p className={`text-body1mb ${activeTab === '/transaction' ? 'font-Montserrat text-primary011': ''}`}>Transaction</p>
                      }
                    </div>
                  </Link>
                  <Link className='flex flex-col' href="send">
                    <div className='flex items-center px-4 gap-4 py-4 cursor-pointer'>
                      <SendToBack className={` ${activeTab === '/send' ? ' text-primary011': ''}`}  />
                      {
                        isColleapse && <p className={`text-body1mb ${activeTab === '/send' ? 'font-Montserrat text-primary011': ''}`}>Send & Receive</p>
                      }
                    </div>
                  </Link>
                </div>
            </div>
          </>
      )}
    </div>
  );
};

export default ResponsiveSidebar;
