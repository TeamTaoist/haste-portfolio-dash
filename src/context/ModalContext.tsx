import React from 'react';

const ModalContext = React.createContext({
  onClose: () => {}
});

export default ModalContext;