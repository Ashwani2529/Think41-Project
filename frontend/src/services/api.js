import axios from 'axios';

const API_BASE_URL = 'https://think41-project.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 100000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const productsAPI = {
  // Get all products with pagination and filters
  getProducts: async (params = {}) => {
    try {
      const response = await api.get('/api/products', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch products');
    }
  },

  // Get a single product by ID
  getProduct: async (id) => {
    try {
      const response = await api.get(`/api/products/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Product not found');
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch product');
    }
  },

  // Get all categories
  getCategories: async () => {
    try {
      const response = await api.get('/api/categories');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch categories');
    }
  },

  // Get all brands
  getBrands: async () => {
    try {
      const response = await api.get('/api/brands');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch brands');
    }
  },

  // Search products
  searchProducts: async (searchTerm, limit = 10) => {
    try {
      const response = await api.get(`/api/products/search/${encodeURIComponent(searchTerm)}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to search products');
    }
  },
};

export const departmentsAPI = {
  // Get all departments
  getDepartments: async () => {
    try {
      const response = await api.get('/api/departments');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch departments');
    }
  },

  // Get a single department by ID
  getDepartment: async (id) => {
    try {
      const response = await api.get(`/api/departments/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Department not found');
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch department');
    }
  },

  // Get products in a department with pagination and filters
  getDepartmentProducts: async (departmentId, params = {}) => {
    try {
      const response = await api.get(`/api/departments/${departmentId}/products`, { params });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Department not found');
      }
      throw new Error(error.response?.data?.error || 'Failed to fetch department products');
    }
  },
};

export default api; 