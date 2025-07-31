import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import DepartmentList from './components/DepartmentList';
import DepartmentPage from './components/DepartmentPage';
import Home from './components/Home';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navigation />
      <main className="container-fluid py-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/departments" element={<DepartmentList />} />
          <Route path="/departments/:id" element={<DepartmentPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
