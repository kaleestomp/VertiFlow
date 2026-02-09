import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Page1 from './pages/Page1';
import Page2 from './pages/Page2';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Page1 />} />
            <Route path="/page2" element={<Page2 />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
