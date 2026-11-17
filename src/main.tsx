import React from 'react';
import ReactDOM from 'react-dom/client';
import MobileApp from './MobileApp';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<MobileApp />);
}
