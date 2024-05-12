import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/store';
// import { styled } from '@mui/material';
import { MaterialDesignContent, SnackbarProvider } from 'notistack';

interface ReduxProviderProps {
  children: React.ReactNode;
}

// const StyledMaterialDesignContent = styled(MaterialDesignContent)(() => ({
//   '&.notistack-MuiContent-success': {
//     backgroundColor: '#1CB562',
//
//   },
//   '&.notistack-MuiContent-error': {
//     backgroundColor: '#E11717',
//   },
// }));

const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {

  return (
    <Provider store={store}>
       <SnackbarProvider
        autoHideDuration={3000}
        Components={{
          success: MaterialDesignContent,
          error: MaterialDesignContent
        }}>
        {children}
      </SnackbarProvider>
    </Provider>);
};

export default ReduxProvider;
