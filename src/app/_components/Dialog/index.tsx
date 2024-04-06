import ModalContext from '@/context/ModalContext';
import React from 'react';

interface ModalProps {
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode; 
}

const CustomModal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };
  
  return (
    <ModalContext.Provider value={{ onClose }}>
      <div
        className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center"
        onClick={onClose}
      >
      <div
        className="bg-primary009 p-4 rounded-lg shadow-lg"
        onClick={handleModalClick} 
      >
        {children}
      </div>
    </div>
    </ModalContext.Provider>
  )
}

export default CustomModal