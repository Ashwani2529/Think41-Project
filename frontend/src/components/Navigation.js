import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow">
      <div className="container">
        <Link className="navbar-brand fw-bold fs-3" to="/">
          <i className="fas fa-store me-2"></i>
          Products Catalog
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} 
                to="/"
              >
                <i className="fas fa-home me-1"></i>
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`} 
                to="/products"
              >
                <i className="fas fa-box me-1"></i>
                Products
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname.startsWith('/departments') ? 'active' : ''}`} 
                to="/departments"
              >
                <i className="fas fa-building me-1"></i>
                Departments
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 