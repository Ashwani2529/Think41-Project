# Products Database - MongoDB Integration

This Node.js application loads product data from a CSV file into MongoDB and provides verification tools for your MERN stack application.

## 📋 Features

- **CSV Analysis**: Automatically analyzes CSV structure and data types
- **MongoDB Schema**: Well-structured Mongoose schema with appropriate indexes
- **Data Validation**: Validates data integrity before insertion
- **Batch Processing**: Efficient batch insertion for large datasets
- **Progress Tracking**: Real-time progress updates during import
- **Data Verification**: Comprehensive verification and statistics
- **Error Handling**: Robust error handling and reporting

## 🏗️ Database Schema

Based on the CSV analysis, the Product schema includes:

- `id` (Number, unique) - Product identifier
- `cost` (Number) - Product cost
- `category` (String, indexed) - Product category
- `name` (String) - Product name
- `brand` (String, indexed) - Brand name
- `retail_price` (Number) - Retail price
- `department` (String, indexed) - Department (Men/Women)
- `sku` (String, unique) - Stock Keeping Unit
- `distribution_center_id` (Number) - Distribution center ID
- `createdAt` & `updatedAt` - Timestamps

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Load CSV Data into MongoDB

```bash
npm start
# or
node loadProducts.js
```

This will:
- Connect to your MongoDB Atlas cluster
- Clear any existing product data
- Read and validate the CSV file
- Insert products in batches with progress updates
- Display import summary

### 3. Verify Data Loading

```bash
npm run verify
# or
node verifyData.js
```

This will show:
- Basic statistics (total count, price ranges, etc.)
- Category and department breakdowns
- Sample product records
- Test queries
- Data integrity checks

## 📊 Expected Output

### Loading Data
```
🚀 Starting product data import...
✅ Connected to MongoDB successfully
📖 Reading CSV file...
📊 Processed 5000 rows, 4998 valid products
📊 Processed 10000 rows, 9995 valid products
...
💾 Inserting products into database...
📦 Inserted batch: 1000/29120 products
...
✅ Product import completed successfully!

📊 Import Summary:
   Total CSV rows: 29120
   Valid products: 29115
   Inserted products: 29115
   Errors: 5
```

### Verification Results
```
📊 Basic Statistics:
==================
📦 Total products: 29,115
💰 Price Range: $5.94 - $299.99
💰 Average Retail Price: $55.22
🏷️ Unique categories: 15
🏢 Unique departments: 2
   Departments: Women, Men
🔖 Unique brands: 25
```

## 🔧 Configuration

The application uses these MongoDB settings:
- **Database**: `products_db`
- **Collection**: `products`
- **Connection**: MongoDB Atlas (configured in the scripts)

## 📁 File Structure

```
├── models/
│   └── Product.js          # Mongoose schema/model
├── archive/
│   └── products.csv        # Source CSV file
├── loadProducts.js         # Main import script
├── verifyData.js          # Verification script
├── package.json           # Node.js dependencies
└── README.md              # This file
```

## 🛠️ For Your MERN Stack App

### Using the Product Model

```javascript
const Product = require('./models/Product');

// Find products by category
const accessories = await Product.find({ category: 'Accessories' });

// Find products in price range
const affordableProducts = await Product.find({
  retail_price: { $gte: 10, $lte: 50 }
});

// Search products by name
const searchResults = await Product.find({
  name: { $regex: 'cap', $options: 'i' }
});

// Get products by department with pagination
const womenProducts = await Product.find({ department: 'Women' })
  .limit(20)
  .skip(page * 20)
  .sort({ retail_price: 1 });
```

### API Routes Example

```javascript
// GET /api/products
app.get('/api/products', async (req, res) => {
  const { category, department, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
  
  const query = {};
  if (category) query.category = category;
  if (department) query.department = department;
  if (minPrice || maxPrice) {
    query.retail_price = {};
    if (minPrice) query.retail_price.$gte = parseFloat(minPrice);
    if (maxPrice) query.retail_price.$lte = parseFloat(maxPrice);
  }
  
  const products = await Product.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });
    
  const total = await Product.countDocuments(query);
  
  res.json({
    products,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total
  });
});
```

## 🔍 Indexes

The schema includes these indexes for optimal query performance:
- `id` (unique)
- `sku` (unique)
- `category`
- `brand`
- `department`
- Compound indexes: `{category, department}`, `{brand, category}`
- `retail_price` for range queries

## ⚠️ Important Notes

1. **Data Validation**: The import script validates all data before insertion
2. **Batch Processing**: Large datasets are processed in batches of 1000 for efficiency
3. **Error Handling**: Invalid rows are logged but don't stop the import process
4. **Duplicate Handling**: Duplicate IDs and SKUs are prevented by unique indexes
5. **Memory Efficient**: Streams are used to handle large CSV files without loading everything into memory

## 🤝 Ready for MERN Stack

This setup provides:
- ✅ Clean, indexed MongoDB collection
- ✅ Mongoose model ready for your backend
- ✅ Verified data integrity
- ✅ Performance-optimized schema
- ✅ Sample queries for your API routes

Your products data is now ready to be used in your MERN stack application! 