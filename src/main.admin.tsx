import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<AdminApp />);
}
