import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { departmentsAPI } from '../services/api';

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await departmentsAPI.getDepartments();
        setDepartments(response.data || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const getDepartmentIcon = (departmentName) => {
    switch (departmentName?.toLowerCase()) {
      case 'women':
        return 'fas fa-female';
      case 'men':
        return 'fas fa-male';
      case 'electronics':
        return 'fas fa-laptop';
      case 'home':
        return 'fas fa-home';
      case 'sports':
        return 'fas fa-running';
      default:
        return 'fas fa-shopping-bag';
    }
  };

  const getDepartmentColor = (departmentName) => {
    switch (departmentName?.toLowerCase()) {
      case 'women':
        return 'bg-pink';
      case 'men':
        return 'bg-primary';
      case 'electronics':
        return 'bg-info';
      case 'home':
        return 'bg-success';
      case 'sports':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner-border loading-spinner text-primary" role="status">
            <span className="visually-hidden">Loading departments...</span>
          </div>
          <p className="mt-3 text-muted">Loading departments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
          <h4>Failed to Load Departments</h4>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            <i className="fas fa-redo me-2"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">
            <i className="fas fa-building me-2"></i>
            Shop by Department
          </h1>
          <p className="text-muted mb-0">
            Browse products organized by department
          </p>
        </div>
        <Link to="/products" className="btn btn-outline-primary">
          <i className="fas fa-th-large me-2"></i>
          View All Products
        </Link>
      </div>

      {/* Departments Grid */}
      {departments.length > 0 ? (
        <>
          <div className="row g-4 mb-5">
            {departments.map(department => (
              <div key={department.id} className="col-lg-6 col-xl-4">
                <Link 
                  to={`/departments/${department.id}`} 
                  className="text-decoration-none"
                >
                  <div className="card h-100 shadow-hover border-0">
                    <div className="card-body p-4 text-center">
                      {/* Department Icon */}
                      <div className={`rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center ${getDepartmentColor(department.name)} bg-opacity-10`} 
                           style={{ width: '80px', height: '80px' }}>
                        <i className={`${getDepartmentIcon(department.name)} fa-2x ${getDepartmentColor(department.name)} bg-opacity-100`}></i>
                      </div>
                      
                      {/* Department Name */}
                      <h4 className="card-title mb-2">{department.name}</h4>
                      
                      {/* Department Description */}
                      {department.description && (
                        <p className="text-muted mb-3">{department.description}</p>
                      )}
                      
                      {/* Product Count */}
                      {department.productCount !== undefined && (
                        <div className="badge bg-light text-dark fs-6 mb-3">
                          <i className="fas fa-box me-1"></i>
                          {department.productCount?.toLocaleString() || 0} Products
                        </div>
                      )}
                      
                      {/* Browse Button */}
                      <div className="mt-3">
                        <span className="btn btn-primary">
                          <i className="fas fa-arrow-right me-2"></i>
                          Browse {department.name}
                        </span>
                      </div>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="card-footer bg-transparent border-0 text-center">
                      <small className="text-muted">
                        <i className="fas fa-mouse-pointer me-1"></i>
                        Click to explore
                      </small>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          
          {/* Quick Stats */}
          <div className="row mb-4">
            <div className="col-md-12">
              <div className="card bg-light border-0">
                <div className="card-body text-center py-4">
                  <div className="row">
                    <div className="col-md-4">
                      <h3 className="text-primary mb-1">{departments.length}</h3>
                      <p className="text-muted mb-0">Departments</p>
                    </div>
                    <div className="col-md-4">
                      <h3 className="text-success mb-1">
                        {departments.reduce((sum, dept) => sum + (dept.productCount || 0), 0).toLocaleString()}
                      </h3>
                      <p className="text-muted mb-0">Total Products</p>
                    </div>
                    <div className="col-md-4">
                      <h3 className="text-info mb-1">24/7</h3>
                      <p className="text-muted mb-0">Available</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-5">
          <i className="fas fa-building fa-3x text-muted mb-3"></i>
          <h4>No Departments Available</h4>
          <p className="text-muted">There are currently no departments to display.</p>
          <Link to="/products" className="btn btn-primary">
            <i className="fas fa-box me-2"></i>
            View All Products
          </Link>
        </div>
      )}
    </div>
  );
};

export default DepartmentList; 