import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Options from './Options';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <Options />
    </StrictMode>
  );
}
