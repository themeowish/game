import React from 'react';
import Home from './components/Home';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FlyingChess from './components/Feixing'; // 假设飞行棋的组件名为 FlyingChess
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flying-chess" element={<FlyingChess />} />
      </Routes>
    </Router>
  );
};

export default App;