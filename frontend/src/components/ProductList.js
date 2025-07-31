import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import ProductCard from './ProductCard';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get filter values from URL parameters
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const currentLimit = parseInt(searchParams.get('limit')) || 12;
  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentDepartment = searchParams.get('department') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentSortBy = searchParams.get('sortBy') || 'id';
  const currentSortOrder = searchParams.get('sortOrder') || 'asc';

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [categoriesResponse, brandsResponse] = await Promise.all([
          productsAPI.getCategories(),
          productsAPI.getBrands()
        ]);
        setCategories(categoriesResponse.data || []);
        setBrands(brandsResponse.data || []);
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  // Load products based on current filters
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: currentPage,
        limit: currentLimit,
        sortBy: currentSortBy,
        sortOrder: currentSortOrder
      };

      if (currentCategory) params.category = currentCategory;
      if (currentBrand) params.brand = currentBrand;
      if (currentDepartment) params.department = currentDepartment;
      if (currentSearch) params.search = currentSearch;
      if (currentMinPrice) params.minPrice = parseFloat(currentMinPrice);
      if (currentMaxPrice) params.maxPrice = parseFloat(currentMaxPrice);

      const response = await productsAPI.getProducts(params);
      console.log(response.data);
      setProducts(response.data || []);
      setPagination(response.pagination || {});
    } catch (error) {
      setError(error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentLimit, currentCategory, currentBrand, currentDepartment, 
      currentSearch, currentMinPrice, currentMaxPrice, currentSortBy, currentSortOrder]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Update URL parameters
  const updateFilters = (newFilters) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    // Reset to page 1 when filters change (except for page changes)
    if (!newFilters.hasOwnProperty('page')) {
      newParams.set('page', '1');
    }

    setSearchParams(newParams);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    updateFilters({ [filterType]: value });
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const searchTerm = formData.get('search');
    updateFilters({ search: searchTerm });
  };

  // Handle pagination
  const handlePageChange = (page) => {
    updateFilters({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all filters
  const clearFilters = () => {
    navigate('/products');
  };

  // Render pagination
  const renderPagination = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;

    const pages = [];
    const currentPageNum = pagination.currentPage;
    const totalPages = pagination.totalPages;
    
    // Calculate page range to show
    const startPage = Math.max(1, currentPageNum - 2);
    const endPage = Math.min(totalPages, currentPageNum + 2);

    // Previous button
    if (pagination.hasPrevPage) {
      pages.push(
        <li key="prev" className="page-item">
          <button 
            className="page-link" 
            onClick={() => handlePageChange(currentPageNum - 1)}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
        </li>
      );
    }

    // First page and ellipsis
    if (startPage > 1) {
      pages.push(
        <li key={1} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
        </li>
      );
      if (startPage > 2) {
        pages.push(<li key="ellipsis1" className="page-item disabled"><span className="page-link">...</span></li>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPageNum ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>{i}</button>
        </li>
      );
    }

    // Last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<li key="ellipsis2" className="page-item disabled"><span className="page-link">...</span></li>);
      }
      pages.push(
        <li key={totalPages} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
        </li>
      );
    }

    // Next button
    if (pagination.hasNextPage) {
      pages.push(
        <li key="next" className="page-item">
          <button 
            className="page-link" 
            onClick={() => handlePageChange(currentPageNum + 1)}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </li>
      );
    }

    return (
      <nav aria-label="Products pagination">
        <ul className="pagination">
          {pages}
        </ul>
      </nav>
    );
  };

  return (
    <div className="container">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-2">
            <i className="fas fa-box me-2"></i>
            Products Catalog
          </h1>
          {pagination.totalCount && (
            <p className="text-muted mb-0">
              Showing {((currentPage - 1) * currentLimit) + 1} - {Math.min(currentPage * currentLimit, pagination.totalCount)} of {pagination.totalCount.toLocaleString()} products
            </p>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="row g-3">
          {/* Search */}
          <div className="col-md-4">
            <form onSubmit={handleSearch}>
              <div className="search-container">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  className="form-control search-input"
                  placeholder="Search products..."
                  name="search"
                  defaultValue={currentSearch}
                />
              </div>
            </form>
          </div>

          {/* Category Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={currentCategory}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={currentBrand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
            >
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={currentDepartment}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Women">Women</option>
              <option value="Men">Men</option>
            </select>
          </div>

          {/* Sort */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={`${currentSortBy}-${currentSortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                updateFilters({ sortBy, sortOrder });
              }}
            >
              <option value="id-asc">ID (A-Z)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="retail_price-asc">Price (Low-High)</option>
              <option value="retail_price-desc">Price (High-Low)</option>
              <option value="brand-asc">Brand (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Price Range */}
        <div className="row g-3 mt-2">
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Min Price"
              value={currentMinPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Max Price"
              value={currentMaxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <button 
              type="button" 
              className="btn btn-outline-secondary"
              onClick={clearFilters}
            >
              <i className="fas fa-times me-1"></i>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner-border loading-spinner text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-container">
          <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
          <h4>Oops! Something went wrong</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadProducts}>
            <i className="fas fa-redo me-2"></i>
            Try Again
          </button>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <>
          {products.length > 0 ? (
            <>
              <div className="product-grid">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              {/* Pagination */}
              <div className="d-flex justify-content-center mt-4">
                {renderPagination()}
              </div>
            </>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-search fa-3x text-muted mb-3"></i>
              <h4>No products found</h4>
              <p className="text-muted">Try adjusting your filters or search terms</p>
              <button className="btn btn-primary" onClick={clearFilters}>
                <i className="fas fa-redo me-2"></i>
                Clear Filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList; 