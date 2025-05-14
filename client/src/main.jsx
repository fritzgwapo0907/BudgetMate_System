import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './global.css'
import Todo from './pages/dashboard.jsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'


createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App/>} />
        <Route path="/dashboard" element={<Todo />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
  
);
