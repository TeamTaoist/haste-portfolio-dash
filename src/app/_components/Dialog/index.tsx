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
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      {/* 弹窗内容 */}
      <div
        className="bg-primary009 p-4 rounded-lg shadow-lg"
        onClick={handleModalClick} // 阻止点击事件穿透
      >
        {children}
      </div>
    </div>
  )
}

export default CustomModal