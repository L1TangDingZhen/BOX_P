import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import Box from './box/box';
import Back from './box/back';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <Router>
      <Routes>
        {/* 根路径，加载 Box 组件 */}
        <Route path="/" element={<Box />} />
        {/* /back 路径，加载 Back 组件 */}
        <Route path="/back" element={<Back />} />
      </Routes>
    </Router>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();


// ISSUE: Two coordinate systems: MOST IMPORTANT
// only disable strictmode can solve the problem