import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import App from './App';
import Borrow from './Borrow';
import Lend from './Lend';
import Repay from './Repay';

const rootElement = document.getElementById('root');


const Wrapper = () => {
  const lightTheme = createTheme({ palette: { mode: 'light' } });

  return (
    <ThemeProvider theme={lightTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/borrow" element={<Borrow />}/>
          <Route path="lend/:loanId" element={<Lend />} />
          <Route path="repay/:loanId" element={<Repay />} />
          <Route path="*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
   
  );
};

ReactDOM.render(<Wrapper />, rootElement);