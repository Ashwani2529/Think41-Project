import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI, departmentsAPI } from '../services/api';

const Home = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    categories: [],
    brands: [],
    departments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsResponse, categoriesResponse, brandsResponse, departmentsResponse] = await Promise.all([
          productsAPI.getProducts({ limit: 1 }),
          productsAPI.getCategories(),
          productsAPI.getBrands(),
          departmentsAPI.getDepartments()
        ]);

        setStats({
          totalProducts: productsResponse.pagination?.totalCount || 0,
          categories: categoriesResponse.data || [],
          brands: brandsResponse.data || [],
          departments: departmentsResponse.data || []
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">
            <i className="fas fa-store me-3"></i>
            Welcome to Products Catalog
          </h1>
          <p className="hero-subtitle">
            Discover thousands of products from top brands across various categories
          </p>
          <Link to="/products" className="btn btn-light btn-lg px-5 py-3">
            <i className="fas fa-search me-2"></i>
            Browse Products
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      {!loading && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">
              <i className="fas fa-box text-primary me-2"></i>
              {stats.totalProducts.toLocaleString()}
            </div>
            <div className="stat-label">Total Products</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">
              <i className="fas fa-tags text-success me-2"></i>
              {stats.categories.length}
            </div>
            <div className="stat-label">Categories</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">
              <i className="fas fa-copyright text-info me-2"></i>
              {stats.brands.length}
            </div>
            <div className="stat-label">Brands</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">
              <i className="fas fa-building text-warning me-2"></i>
              {stats.departments.length}
            </div>
            <div className="stat-label">Departments</div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <section className="row py-5">
        <div className="col-lg-4 mb-4">
          <div className="card h-100 shadow-hover">
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="fas fa-search fa-3x text-primary"></i>
              </div>
              <h5 className="card-title">Easy Browse</h5>
              <p className="card-text text-muted">
                Browse by departments or find products with our powerful search and filtering
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4 mb-4">
          <div className="card h-100 shadow-hover">
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="fas fa-mobile-alt fa-3x text-success"></i>
              </div>
              <h5 className="card-title">Mobile Friendly</h5>
              <p className="card-text text-muted">
                Responsive design that works perfectly on all devices
              </p>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4 mb-4">
          <div className="card h-100 shadow-hover">
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="fas fa-bolt fa-3x text-warning"></i>
              </div>
              <h5 className="card-title">Fast Performance</h5>
              <p className="card-text text-muted">
                Lightning-fast loading with optimized API calls
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-5">
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <h2 className="mb-4">Ready to Start Shopping?</h2>
            <p className="lead text-muted mb-4">
              Browse our extensive collection of products from various categories and brands
            </p>
            <div className="d-flex justify-content-center gap-3 flex-wrap">
              <Link to="/products" className="btn btn-primary btn-lg px-4">
                <i className="fas fa-th-large me-2"></i>
                View All Products
              </Link>
              <Link to="/departments" className="btn btn-outline-primary btn-lg px-4">
                <i className="fas fa-building me-2"></i>
                Shop by Department
              </Link>
              <Link to="/products?category=Accessories" className="btn btn-outline-secondary btn-lg px-4">
                <i className="fas fa-star me-2"></i>
                Popular Category
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 