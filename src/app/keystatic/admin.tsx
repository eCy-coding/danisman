import React from 'react';
import ReactDOM from 'react-dom/client';

import KeystaticPage from './page';
import '../../../index.css'; // Shared styles - Relative path corrected

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <KeystaticPage />
  </React.StrictMode>,
);
