import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productsAPI } from '../services/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await productsAPI.getProduct(id);
        setProduct(response.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDepartmentColor = (department) => {
    // Handle both string (old format) and object (new format)
    const departmentName = typeof department === 'string' ? department : department?.name;
    switch (departmentName?.toLowerCase()) {
      case 'women':
        return 'text-pink';
      case 'men':
        return 'text-primary';
      default:
        return 'text-secondary';
    }
  };

  const getCategoryIcon = (category) => {
    const categoryLower = category?.toLowerCase() || '';
    if (categoryLower.includes('accessories')) return 'fas fa-hat-cowboy';
    if (categoryLower.includes('tops') || categoryLower.includes('tees')) return 'fas fa-tshirt';
    if (categoryLower.includes('pants') || categoryLower.includes('jeans')) return 'fas fa-vest';
    if (categoryLower.includes('shoes')) return 'fas fa-shoe-prints';
    if (categoryLower.includes('bags')) return 'fas fa-shopping-bag';
    return 'fas fa-box';
  };

  const calculateDiscount = (cost, retailPrice) => {
    if (cost && retailPrice && retailPrice > cost) {
      const discount = ((retailPrice - cost) / retailPrice * 100);
      return Math.round(discount);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner-border loading-spinner text-primary" role="status">
            <span className="visually-hidden">Loading product...</span>
          </div>
          <p className="mt-3 text-muted">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle fa-3x mb-3"></i>
          <h4>Product Not Found</h4>
          <p>{error}</p>
          <div className="d-flex gap-3 justify-content-center">
            <button className="btn btn-primary" onClick={() => navigate('/products')}>
              <i className="fas fa-arrow-left me-2"></i>
              Back to Products
            </button>
            <button className="btn btn-outline-primary" onClick={() => window.location.reload()}>
              <i className="fas fa-redo me-2"></i>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const discount = calculateDiscount(product.cost, product.retail_price);

  return (
    <div className="container">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/" className="text-decoration-none">
              <i className="fas fa-home"></i> Home
            </Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/products" className="text-decoration-none">Products</Link>
          </li>
          <li className="breadcrumb-item">
            <Link 
              to={`/products?category=${encodeURIComponent(product.category)}`} 
              className="text-decoration-none"
            >
              {product.category}
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Product #{product.id}
          </li>
        </ol>
      </nav>

      {/* Product Detail Card */}
      <div className="product-detail">
        {/* Header Section */}
        <div className="product-detail-header">
          <div className="row align-items-start">
            <div className="col-lg-8">
              <div className="d-flex align-items-center mb-3">
                <i className={`${getCategoryIcon(product.category)} text-muted me-2 fa-lg`}></i>
                <span className="badge bg-light text-dark me-3">{product.category}</span>
                <span className={`badge ${getDepartmentColor(product.department)} bg-opacity-10 border`}>
                  {typeof product.department === 'string' ? product.department : product.department?.name || 'Unknown'}
                </span>
              </div>
              
              <h1 className="product-detail-title">
                {product.name}
              </h1>
              
              <div className="product-detail-brand">
                <i className="fas fa-copyright me-2"></i>
                <span className="fw-bold">{product.brand}</span>
              </div>
            </div>
            
            <div className="col-lg-4 text-lg-end">
              <div className="d-flex align-items-center justify-content-lg-end gap-3 mb-3">
                {discount > 0 && (
                  <span className="badge bg-danger fs-6 px-3 py-2">
                    <i className="fas fa-percentage me-1"></i>
                    {discount}% OFF
                  </span>
                )}
                <span className="text-muted">ID: #{product.id}</span>
              </div>
              
              <div className="product-detail-price mb-2">
                {formatPrice(product.retail_price)}
              </div>
              
              {product.cost && product.cost !== product.retail_price && (
                <div className="text-muted">
                  <span className="text-decoration-line-through">
                    Cost: {formatPrice(product.cost)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Information Grid */}
        <div className="product-detail-info">
          <div className="info-card">
            <h6>
              <i className="fas fa-barcode me-2"></i>
              Product Code
            </h6>
            <p className="font-monospace">{product.sku}</p>
          </div>

          <div className="info-card">
            <h6>
              <i className="fas fa-warehouse me-2"></i>
              Distribution Center
            </h6>
            <p>Center #{product.distribution_center_id}</p>
          </div>

          <div className="info-card">
            <h6>
              <i className="fas fa-tags me-2"></i>
              Category
            </h6>
            <p>{product.category}</p>
          </div>

          <div className="info-card">
            <h6>
              <i className="fas fa-building me-2"></i>
              Department
            </h6>
            <p>{typeof product.department === 'string' ? product.department : product.department?.name || 'Unknown'}</p>
          </div>

          <div className="info-card">
            <h6>
              <i className="fas fa-calendar-plus me-2"></i>
              Added Date
            </h6>
            <p>{product.createdAt ? formatDate(product.createdAt) : 'N/A'}</p>
          </div>

          <div className="info-card">
            <h6>
              <i className="fas fa-edit me-2"></i>
              Last Updated
            </h6>
            <p>{product.updatedAt ? formatDate(product.updatedAt) : 'N/A'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-3 justify-content-center mt-4 pt-4 border-top">
          <button 
            className="btn btn-outline-primary btn-lg"
            onClick={() => navigate('/products')}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Products
          </button>
          
          <Link 
            to={`/products?category=${encodeURIComponent(product.category)}`}
            className="btn btn-primary btn-lg"
          >
            <i className="fas fa-layer-group me-2"></i>
            Similar Products
          </Link>
          
          <Link 
            to={`/products?brand=${encodeURIComponent(product.brand)}`}
            className="btn btn-outline-success btn-lg"
          >
            <i className="fas fa-copyright me-2"></i>
            More from {product.brand}
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card text-center h-100">
            <div className="card-body">
              <i className="fas fa-share-alt fa-2x text-primary mb-3"></i>
              <h5>Share Product</h5>
              <p className="text-muted small">Share this product with friends</p>
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: product.name,
                      text: `Check out this product: ${product.name}`,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Product link copied to clipboard!');
                  }
                }}
              >
                <i className="fas fa-share me-1"></i>
                Share
              </button>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card text-center h-100">
            <div className="card-body">
              <i className="fas fa-heart fa-2x text-danger mb-3"></i>
              <h5>Add to Favorites</h5>
              <p className="text-muted small">Save for later viewing</p>
              <button className="btn btn-outline-danger btn-sm">
                <i className="fas fa-heart me-1"></i>
                Favorite
              </button>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card text-center h-100">
            <div className="card-body">
              <i className="fas fa-print fa-2x text-secondary mb-3"></i>
              <h5>Print Details</h5>
              <p className="text-muted small">Print product information</p>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => window.print()}
              >
                <i className="fas fa-print me-1"></i>
                Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail; 