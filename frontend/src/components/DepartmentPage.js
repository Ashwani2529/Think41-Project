import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { departmentsAPI, productsAPI } from '../services/api';
import ProductCard from './ProductCard';

const DepartmentPage = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [department, setDepartment] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Get filter values from URL parameters
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const currentLimit = parseInt(searchParams.get('limit')) || 12;
  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentSortBy = searchParams.get('sortBy') || 'id';
  const currentSortOrder = searchParams.get('sortOrder') || 'asc';

  // Load department info and filter options
  useEffect(() => {
    const loadDepartmentInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        const [departmentResponse, categoriesResponse, brandsResponse] = await Promise.all([
          departmentsAPI.getDepartment(id),
          productsAPI.getCategories(),
          productsAPI.getBrands()
        ]);

        setDepartment(departmentResponse.data);
        setCategories(categoriesResponse.data || []);
        setBrands(brandsResponse.data || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadDepartmentInfo();
    }
  }, [id]);

  // Load products based on current filters
  const loadProducts = useCallback(async () => {
    if (!id) return;

    setProductsLoading(true);
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
      if (currentSearch) params.search = currentSearch;
      if (currentMinPrice) params.minPrice = parseFloat(currentMinPrice);
      if (currentMaxPrice) params.maxPrice = parseFloat(currentMaxPrice);

      const response = await departmentsAPI.getDepartmentProducts(id, params);
      setProducts(response.data || []);
      setPagination(response.pagination || {});
      
      // Update department info if included in response
      if (response.department) {
        setDepartment(prev => ({ ...prev, ...response.department }));
      }
    } catch (error) {
      setError(error.message);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [id, currentPage, currentLimit, currentCategory, currentBrand, 
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
    navigate(`/departments/${id}`);
  };

  // Get department icon and color
  const getDepartmentIcon = (departmentName) => {
    switch (departmentName?.toLowerCase()) {
      case 'women': return 'fas fa-female';
      case 'men': return 'fas fa-male';
      case 'electronics': return 'fas fa-laptop';
      case 'home': return 'fas fa-home';
      case 'sports': return 'fas fa-running';
      default: return 'fas fa-shopping-bag';
    }
  };

  const getDepartmentColor = (departmentName) => {
    switch (departmentName?.toLowerCase()) {
      case 'women': return 'text-pink';
      case 'men': return 'text-primary';
      case 'electronics': return 'text-info';
      case 'home': return 'text-success';
      case 'sports': return 'text-warning';
      default: return 'text-secondary';
    }
  };

  // Render pagination
  const renderPagination = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;

    const pages = [];
    const currentPageNum = pagination.currentPage;
    const totalPages = pagination.totalPages;
    
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

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPageNum ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>{i}</button>
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

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner-border loading-spinner text-primary" role="status">
            <span className="visually-hidden">Loading department...</span>
          </div>
          <p className="mt-3 text-muted">Loading department information...</p>
        </div>
      </div>
    );
  }

  if (error && !department) {
    return (
      <div className="container">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
          <h4>Department Not Found</h4>
          <p>{error}</p>
          <div className="d-flex gap-3 justify-content-center">
            <Link to="/departments" className="btn btn-primary">
              <i className="fas fa-arrow-left me-2"></i>
              Back to Departments
            </Link>
            <button className="btn btn-outline-primary" onClick={() => window.location.reload()}>
              <i className="fas fa-redo me-2"></i>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <Link to="/departments" className="text-decoration-none">Departments</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {department?.name}
          </li>
        </ol>
      </nav>

      {/* Department Header */}
      {department && (
        <div className="row align-items-center mb-4">
          <div className="col-md-8">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <i className={`${getDepartmentIcon(department.name)} fa-3x ${getDepartmentColor(department.name)}`}></i>
              </div>
              <div>
                <h1 className="h2 mb-2">{department.name} Department</h1>
                <p className="text-muted mb-0">
                  {department.description || `Discover amazing ${department.name.toLowerCase()} products`}
                </p>
                {pagination.totalCount && (
                  <p className="text-muted mb-0">
                    <i className="fas fa-box me-1"></i>
                    {pagination.totalCount.toLocaleString()} products available
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-4 text-md-end">
            <Link to="/departments" className="btn btn-outline-primary me-2">
              <i className="fas fa-building me-2"></i>
              All Departments
            </Link>
            <Link to="/products" className="btn btn-outline-secondary">
              <i className="fas fa-th-large me-2"></i>
              All Products
            </Link>
          </div>
        </div>
      )}

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
                  placeholder={`Search in ${department?.name || 'department'}...`}
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

          {/* Clear Filters */}
          <div className="col-md-2">
            <button 
              type="button" 
              className="btn btn-outline-secondary w-100"
              onClick={clearFilters}
            >
              <i className="fas fa-times me-1"></i>
              Clear
            </button>
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
        </div>
      </div>

      {/* Products Display */}
      {productsLoading && (
        <div className="loading-container">
          <div className="spinner-border loading-spinner text-primary" role="status">
            <span className="visually-hidden">Loading products...</span>
          </div>
        </div>
      )}

      {error && !productsLoading && (
        <div className="error-container">
          <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
          <h4>Failed to Load Products</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadProducts}>
            <i className="fas fa-redo me-2"></i>
            Try Again
          </button>
        </div>
      )}

      {!productsLoading && !error && (
        <>
          {products.length > 0 ? (
            <>
              {/* Results Summary */}
              {pagination.totalCount && (
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <p className="text-muted mb-0">
                    Showing {((currentPage - 1) * currentLimit) + 1} - {Math.min(currentPage * currentLimit, pagination.totalCount)} of {pagination.totalCount.toLocaleString()} products
                  </p>
                </div>
              )}
              
              {/* Products Grid */}
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
              <h4>No Products Found</h4>
              <p className="text-muted">
                No products found in {department?.name} department with current filters
              </p>
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

export default DepartmentPage; 