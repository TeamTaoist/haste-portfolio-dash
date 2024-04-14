import { WalletInfo } from '@/lib/interface';
import { RootState } from '@/store/store';
import { WalletItem } from '@/store/wallet/walletSlice';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Image from 'next/image';
import { formatString } from '@/utils/common';

interface Account {
    icon: string;
    address: string;
    balance: string;
}

const accounts: Account[] = [
    { icon: "👤", address: "0x123...4567", balance: "1.00 ETH" },
    { icon: "👤", address: "0x890...1234", balance: "0.50 ETH" },
    { icon: "👤", address: "0xABC...7890", balance: "0.75 ETH" }
];

const DropdownSelect: React.FC = () => {
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [selected, setSelected] = useState<Account>(accounts[0]);
    const wallets = useSelector((state: RootState) => state.wallet.wallets);
    const currentAddress: string | undefined = useSelector((state: RootState) => state.wallet.currentWalletAddress);
    const [currentWallet, setCurrentWallet] = useState<WalletItem>();

    const toggleDropdown = () => setIsOpen(!isOpen);
    
    const handleSelect = (account: Account) => {
        setSelected(account);
        setIsOpen(false);
    };

    useEffect(() => {
      const current = wallets.find(wallet => wallet.address === currentAddress);
      setCurrentWallet(current!!)
    }, [currentAddress])

    return (
        <div className="relative">
            <div className="flex items-center justify-between border rounded-md bg-primary008 text-white px-4 py-2 gap-4 cursor-pointer" onClick={toggleDropdown}>
                <Image
                  src={`/img/${currentWallet?.chain}.png`}
                  width={24}
                  height={24}
                  className='rounded-full'
                  alt={'icon'}
                />
                <div className=' font-SourceSanPro flex justify-center items-end flex-col'>
                  <span>{currentWallet && formatString(currentWallet?.address, 5)}</span>
                </div>
            </div>
            {isOpen && (
                <div className="absolute top-full w-full bg-primary008 mt-1 border border-primary002 rounded-md">
                    {wallets.map((wallet, index) => (
                        <div key={index} className="flex items-center justify-between text-white p-2 hover:bg-gray-600" onClick={() => handleSelect(account)}>
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
