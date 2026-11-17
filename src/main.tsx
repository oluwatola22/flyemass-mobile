import React from 'react';
import ReactDOM from 'react-dom/client';
import MobileApp from './MobileApp';
import './index.css';

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<MobileApp />);
}
