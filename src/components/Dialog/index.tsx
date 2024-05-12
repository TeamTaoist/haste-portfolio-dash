
import ModalContext from '../../context/ModalContext';
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
        className="fixed inset-0 bg-white backdrop-blur bg-opacity-30 z-50 flex justify-center items-center"
        onClick={onClose}
      >
      <div
        className="bg-gray-100 rounded-lg shadow-lg relative"
        onClick={handleModalClick}
      >
        {children}
      </div>
    </div>
    </ModalContext.Provider>
  )
}

export default CustomModal
