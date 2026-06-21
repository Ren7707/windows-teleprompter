import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { FloatingPrompt } from './FloatingPrompt';
import './styles.css';

const params = new URLSearchParams(location.search);
const windowKind = params.get('window') === 'floating' ? 'floating' : 'main';
document.documentElement.classList.add('dark');
document.documentElement.dataset.window = windowKind;
document.body.dataset.window = windowKind;
const Root = windowKind === 'floating' ? FloatingPrompt : App;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
