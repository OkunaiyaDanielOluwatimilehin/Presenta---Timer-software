import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import Root from './Root.tsx';
import './index.css';

// Local Font Imports for Offline Support
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/poppins/900.css";

import "@fontsource/montserrat/300.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/montserrat/900.css";

import "@fontsource/orbitron/400.css";
import "@fontsource/orbitron/700.css";
import "@fontsource/orbitron/900.css";

import "@fontsource/libre-baskerville/400.css";
import "@fontsource/libre-baskerville/700.css";
import "@fontsource/libre-baskerville/400-italic.css";

import "@fontsource/jetbrains-mono/300.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/700.css";

import "@fontsource/bebas-neue";
import "@fontsource/righteous";
import "@fontsource/anton";

import "@fontsource/outfit/300.css";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/900.css";

import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/400-italic.css";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
