import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Login from './box/login';
import Mg from './box/mg';
import Wk from './box/wk';
import reportWebVitals from './reportWebVitals';
import Reg from './box/reg';
import AlgorithmUpload from './box/algorithm';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <Router>
      <Routes>
        {/* <Route path="/" element={<Box />} /> */}
        <Route path="/" element={<Login />} />
        <Route path="/MG" element={<Mg />} />
        <Route path="/WK" element={<Wk />} />
        <Route path="/REG" element={<Reg />} />
        <Route path="/alg" element={<AlgorithmUpload />} />
      </Routes>
    </Router>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();


// ISSUE: Two coordinate systems: MOST IMPORTANT
// only disable strictmode can solve the problemss