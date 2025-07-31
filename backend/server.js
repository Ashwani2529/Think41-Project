const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Product = require('./models/Product');
const Department = require('./models/Department');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection URI
const MONGODB_URI = process.env.MONGO_URI;
const DATABASE_NAME = 'products_db';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: DATABASE_NAME,
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

// Helper function to get department by name or ID
async function findDepartmentId(departmentQuery) {
  if (!departmentQuery) return null;
  
  // If it's a number, assume it's an ID
  if (!isNaN(departmentQuery)) {
    return parseInt(departmentQuery);
  }
  
  // If it's a string, find by name
  const department = await Department.findOne({ name: { $regex: departmentQuery, $options: 'i' } });
  return department ? department.id : null;
}

// API Routes

// GET /api/products - List all products with pagination
app.get('/api/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;
    const department = req.query.department;
    const brand = req.query.brand;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters'
      });
    }

    // Build query
    const query = {};
    if (category) query.category = { $regex: category, $options: 'i' };
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    if (minPrice || maxPrice) {
      query.retail_price = {};
      if (minPrice) query.retail_price.$gte = minPrice;
      if (maxPrice) query.retail_price.$lte = maxPrice;
    }
    
    // Handle department filtering
    if (department) {
      const departmentId = await findDepartmentId(department);
      if (departmentId) {
        query.department_id = departmentId;
      }
    }

    const sort = {};
    sort[sortBy] = sortOrder;
    const skip = (page - 1) * limit;

    // Execute queries with department population
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);

    // Populate department information
    const departmentIds = [...new Set(products.map(p => p.department_id))];
    const departments = await Department.find({ id: { $in: departmentIds } }).lean();
    const departmentMap = {};
    departments.forEach(dept => {
      departmentMap[dept.id] = dept;
    });

    // Add department info to products
    const productsWithDepartments = products.map(product => ({
      ...product,
      department: departmentMap[product.department_id] || null
    }));

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: productsWithDepartments,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/products/:id - Get a specific product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    if (!/^\d+$/.test(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    const id = parseInt(productId);
    const product = await Product.findOne({ id }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        error: `Product with ID ${id} not found`
      });
    }

    // Get department information
    const department = await Department.findOne({ id: product.department_id }).lean();

    const productWithDepartment = {
      ...product,
      department: department || null
    };

    res.json({
      success: true,
      data: productWithDepartment
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/departments - Get all departments
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 }).lean();
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// GET /api/departments/:id - Get specific department
app.get('/api/departments/:id', async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);
    if (isNaN(departmentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid department ID'
      });
    }

    const department = await Department.findOne({ id: departmentId }).lean();
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    // Get product count for this department
    const productCount = await Product.countDocuments({ department_id: departmentId });

    res.json({
      success: true,
      data: {
        ...department,
        productCount
      }
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// GET /api/departments/:id/products - Get all products in a department
app.get('/api/departments/:id/products', async (req, res) => {
  try {
    const departmentId = parseInt(req.params.id);
    if (isNaN(departmentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid department ID'
      });
    }

    // Check if department exists
    const department = await Department.findOne({ id: departmentId }).lean();
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;
    const brand = req.query.brand;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters'
      });
    }

    // Build query for products in this department
    const query = { department_id: departmentId };
    
    if (category) query.category = { $regex: category, $options: 'i' };
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    if (minPrice || maxPrice) {
      query.retail_price = {};
      if (minPrice) query.retail_price.$gte = minPrice;
      if (maxPrice) query.retail_price.$lte = maxPrice;
    }

    const sort = {};
    sort[sortBy] = sortOrder;
    const skip = (page - 1) * limit;

    // Execute queries
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);

    // Add department info to products
    const productsWithDepartment = products.map(product => ({
      ...product,
      department: department
    }));

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: productsWithDepartment,
      department: department,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        category,
        brand,
        minPrice,
        maxPrice,
        search,
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc'
      }
    });

  } catch (error) {
    console.error('Error fetching department products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/categories - Get all unique categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({
      success: true,
      data: categories.sort()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/brands - Get all unique brands
app.get('/api/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand');
    res.json({
      success: true,
      data: brands.sort()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Products API is running!',
    endpoints: {
      'GET /api/products': 'List products with pagination',
      'GET /api/products/:id': 'Get product by ID',
      'GET /api/departments': 'Get all departments',
      'GET /api/departments/:id': 'Get department by ID',
      'GET /api/departments/:id/products': 'Get all products in a department',
      'GET /api/categories': 'Get all categories',
      'GET /api/brands': 'Get all brands'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found`
  });
});

// Start server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Endpoints available:`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app; 