import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Box from './box/box';
import Back from './box/back';
import Two from './box/two';
import Thr from './box/thr';
import Fou from './box/for';
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
        <Route path="/two" element={<Two />} />
        <Route path="/thr" element={<Thr />} />
        <Route path="/fou" element={<Fou />} />

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