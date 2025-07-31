const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://ashwani2749:12345@cluster0.rkbeh5k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
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

// API Routes

// GET /api/products - List all products with pagination
app.get('/api/products', async (req, res) => {
  try {
    // Extract query parameters
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

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100'
      });
    }

    // Build query object
    const query = {};
    if (category) query.category = { $regex: category, $options: 'i' };
    if (department) query.department = { $regex: department, $options: 'i' };
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

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder;

    // Calculate skip value
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

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      },
      filters: {
        category,
        department,
        brand,
        minPrice,
        maxPrice,
        search,
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc'
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching products'
    });
  }
});

// GET /api/products/:id - Get a specific product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    // Validate ID format (should be a number)
    if (!/^\d+$/.test(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format. ID must be a number'
      });
    }

    const id = parseInt(productId);

    // Find product by ID
    const product = await Product.findOne({ id }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        error: `Product with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching product'
    });
  }
});

// GET /api/products/search/:term - Search products by name
app.get('/api/products/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;
    const limit = parseInt(req.query.limit) || 10;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search term must be at least 2 characters long'
      });
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { category: { $regex: searchTerm, $options: 'i' } },
        { brand: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .limit(limit)
    .lean();

    res.json({
      success: true,
      data: products,
      count: products.length,
      searchTerm
    });

  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while searching products'
    });
  }
});

// GET /api/categories - Get all unique categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json({
      success: true,
      data: categories.sort(),
      count: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching categories'
    });
  }
});

// GET /api/brands - Get all unique brands
app.get('/api/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand');
    res.json({
      success: true,
      data: brands.sort(),
      count: brands.length
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching brands'
    });
  }
});

// GET /api/stats - Get database statistics
app.get('/api/stats', async (req, res) => {
  try {
    const [
      totalProducts,
      categories,
      departments,
      brands,
      priceStats
    ] = await Promise.all([
      Product.countDocuments(),
      Product.distinct('category'),
      Product.distinct('department'),
      Product.distinct('brand'),
      Product.aggregate([
        {
          $group: {
            _id: null,
            avgPrice: { $avg: '$retail_price' },
            minPrice: { $min: '$retail_price' },
            maxPrice: { $max: '$retail_price' },
            avgCost: { $avg: '$cost' },
            minCost: { $min: '$cost' },
            maxCost: { $max: '$cost' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        uniqueCategories: categories.length,
        uniqueDepartments: departments.length,
        uniqueBrands: brands.length,
        priceRange: {
          min: priceStats[0]?.minPrice || 0,
          max: priceStats[0]?.maxPrice || 0,
          average: Math.round((priceStats[0]?.avgPrice || 0) * 100) / 100
        },
        costRange: {
          min: priceStats[0]?.minCost || 0,
          max: priceStats[0]?.maxCost || 0,
          average: Math.round((priceStats[0]?.avgCost || 0) * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching statistics'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Products API is running!',
    version: '1.0.0',
    endpoints: {
      'GET /api/products': 'List all products with pagination and filters',
      'GET /api/products/:id': 'Get specific product by ID',
      'GET /api/products/search/:term': 'Search products by name/category/brand',
      'GET /api/categories': 'Get all unique categories',
      'GET /api/brands': 'Get all unique brands',
      'GET /api/stats': 'Get database statistics'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation:`);
      console.log(`   GET  /api/products        - List products (with pagination)`);
      console.log(`   GET  /api/products/:id    - Get product by ID`);
      console.log(`   GET  /api/products/search/:term - Search products`);
      console.log(`   GET  /api/categories      - Get all categories`);
      console.log(`   GET  /api/brands          - Get all brands`);
      console.log(`   GET  /api/stats           - Get database stats`);
      console.log(`\n💡 Example URLs:`);
      console.log(`   http://localhost:${PORT}/api/products?page=1&limit=10`);
      console.log(`   http://localhost:${PORT}/api/products/123`);
      console.log(`   http://localhost:${PORT}/api/products?category=Accessories&department=Women`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app; 