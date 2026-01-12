import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App.tsx';
import { BrowserRouter } from 'react-router-dom';

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}