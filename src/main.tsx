import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import NewApp from './NewApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NewApp />
  </StrictMode>
);
