import * as React from 'react';
// import { render } from 'react-dom';
import App from './App';

import './index.css'
import 'semantic-ui-css/semantic.min.css'
import 'intro.js/introjs.css';

import { createRoot } from 'react-dom/client';

const container = document.getElementById('app');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<App />);
