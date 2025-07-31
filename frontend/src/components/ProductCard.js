import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const getDepartmentColor = (department) => {
    // Handle both string (old format) and object (new format)
    const departmentName = typeof department === 'string' ? department : department?.name;
    switch (departmentName?.toLowerCase()) {
      case 'women':
        return 'bg-pink text-white';
      case 'men':
        return 'bg-primary text-white';
      default:
        return 'bg-secondary text-white';
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const calculateDiscount = (cost, retailPrice) => {
    if (cost && retailPrice && retailPrice > cost) {
      const discount = ((retailPrice - cost) / retailPrice * 100);
      return Math.round(discount);
    }
    return 0;
  };

  const discount = calculateDiscount(product.cost, product.retail_price);

  return (
    <div className="product-card h-100 position-relative">
      {/* Department Badge */}
      <div className={`position-absolute top-0 end-0 m-2 px-2 py-1 rounded-pill small ${getDepartmentColor(product.department)}`}>
        {typeof product.department === 'string' ? product.department : product.department?.name || 'Unknown'}
      </div>

      {/* Discount Badge */}
      {discount > 0 && (
        <div className="position-absolute top-0 start-0 m-2 bg-danger text-white px-2 py-1 rounded-pill small fw-bold">
          -{discount}% OFF
        </div>
      )}

      <div className="product-card-body">
        {/* Category */}
        <div className="d-flex align-items-center mb-2">
          <i className={`${getCategoryIcon(product.category)} text-muted me-2`}></i>
          <span className="product-category">{product.category}</span>
        </div>

        {/* Product Name */}
        <h5 className="product-title mb-2">
          {product.name}
        </h5>

        {/* Brand */}
        <p className="product-brand mb-3">
          <i className="fas fa-copyright me-1"></i>
          {product.brand}
        </p>

        {/* Pricing */}
        <div className="mb-3">
          <div className="product-price">
            {formatPrice(product.retail_price)}
          </div>
          {product.cost && product.cost !== product.retail_price && (
            <div className="product-cost">
              Cost: {formatPrice(product.cost)}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="small text-muted mb-3">
          <div className="d-flex justify-content-between mb-1">
            <span>SKU:</span>
            <span className="font-monospace">{product.sku.substring(0, 12)}...</span>
          </div>
          <div className="d-flex justify-content-between">
            <span>Distribution Center:</span>
            <span>#{product.distribution_center_id}</span>
          </div>
        </div>

        {/* View Details Button */}
        <Link 
          to={`/products/${product.id}`} 
          className="btn btn-primary w-100"
        >
          <i className="fas fa-eye me-2"></i>
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard; 