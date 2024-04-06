import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/store'; // 确保路径正确

interface ReduxProviderProps {
  children: React.ReactNode;
}

const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};

export default ReduxProvider;
