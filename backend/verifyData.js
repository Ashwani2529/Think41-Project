const mongoose = require('mongoose');
const Product = require('./models/Product');

// MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://ashwani2749:12345@cluster0.rkbeh5k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = 'products_db';

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: DATABASE_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

async function getBasicStats() {
  console.log('\n📊 Basic Statistics:');
  console.log('==================');
  
  // Total count
  const totalCount = await Product.countDocuments();
  console.log(`📦 Total products: ${totalCount.toLocaleString()}`);
  
  if (totalCount === 0) {
    console.log('❌ No products found in database!');
    return;
  }
  
  // Price statistics
  const priceStats = await Product.aggregate([
    {
      $group: {
        _id: null,
        avgRetailPrice: { $avg: '$retail_price' },
        minRetailPrice: { $min: '$retail_price' },
        maxRetailPrice: { $max: '$retail_price' },
        avgCost: { $avg: '$cost' },
        minCost: { $min: '$cost' },
        maxCost: { $max: '$cost' }
      }
    }
  ]);
  
  if (priceStats.length > 0) {
    const stats = priceStats[0];
    console.log(`💰 Price Range: $${stats.minRetailPrice.toFixed(2)} - $${stats.maxRetailPrice.toFixed(2)}`);
    console.log(`💰 Average Retail Price: $${stats.avgRetailPrice.toFixed(2)}`);
    console.log(`💸 Cost Range: $${stats.minCost.toFixed(2)} - $${stats.maxCost.toFixed(2)}`);
    console.log(`💸 Average Cost: $${stats.avgCost.toFixed(2)}`);
  }
  
  // Categories
  const categories = await Product.distinct('category');
  console.log(`🏷️ Unique categories: ${categories.length}`);
  console.log(`   Categories: ${categories.slice(0, 5).join(', ')}${categories.length > 5 ? '...' : ''}`);
  
  // Departments
  const departments = await Product.distinct('department');
  console.log(`🏢 Unique departments: ${departments.length}`);
  console.log(`   Departments: ${departments.join(', ')}`);
  
  // Brands
  const brands = await Product.distinct('brand');
  console.log(`🔖 Unique brands: ${brands.length}`);
  console.log(`   Brands: ${brands.slice(0, 5).join(', ')}${brands.length > 5 ? '...' : ''}`);
  
  // Distribution centers
  const distributionCenters = await Product.distinct('distribution_center_id');
  console.log(`🏭 Distribution centers: ${distributionCenters.length}`);
  console.log(`   Centers: ${distributionCenters.join(', ')}`);
}

async function getCategoryBreakdown() {
  console.log('\n📈 Category Breakdown:');
  console.log('=====================');
  
  const categoryBreakdown = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$retail_price' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);
  
  categoryBreakdown.forEach((cat, index) => {
    console.log(`${index + 1}. ${cat._id}: ${cat.count.toLocaleString()} products (avg: $${cat.avgPrice.toFixed(2)})`);
  });
}

async function getDepartmentBreakdown() {
  console.log('\n🏢 Department Breakdown:');
  console.log('=======================');
  
  const departmentBreakdown = await Product.aggregate([
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
        avgPrice: { $avg: '$retail_price' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  departmentBreakdown.forEach((dept, index) => {
    console.log(`${index + 1}. ${dept._id}: ${dept.count.toLocaleString()} products (avg: $${dept.avgPrice.toFixed(2)})`);
  });
}

async function showSampleProducts() {
  console.log('\n🔍 Sample Products:');
  console.log('==================');
  
  const sampleProducts = await Product.find()
    .limit(5)
    .select('id name category brand retail_price department sku');
  
  sampleProducts.forEach((product, index) => {
    console.log(`${index + 1}. ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   Category: ${product.category} | Department: ${product.department}`);
    console.log(`   Brand: ${product.brand} | Price: $${product.retail_price}`);
    console.log(`   SKU: ${product.sku}`);
    console.log('');
  });
}

async function testQueries() {
  console.log('\n🔍 Test Queries:');
  console.log('================');
  
  // Test query 1: Find products by category
  const accessoriesCount = await Product.countDocuments({ category: 'Accessories' });
  console.log(`🔍 Accessories products: ${accessoriesCount.toLocaleString()}`);
  
  // Test query 2: Find expensive products
  const expensiveProducts = await Product.countDocuments({ retail_price: { $gt: 100 } });
  console.log(`💎 Products over $100: ${expensiveProducts.toLocaleString()}`);
  
  // Test query 3: Find products by department
  const womenProducts = await Product.countDocuments({ department: 'Women' });
  const menProducts = await Product.countDocuments({ department: 'Men' });
  console.log(`👩 Women's products: ${womenProducts.toLocaleString()}`);
  console.log(`👨 Men's products: ${menProducts.toLocaleString()}`);
  
  // Test query 4: Find products by brand
  const topBrands = await Product.aggregate([
    {
      $group: {
        _id: '$brand',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 3
    }
  ]);
  
  console.log('🏆 Top 3 brands by product count:');
  topBrands.forEach((brand, index) => {
    console.log(`   ${index + 1}. ${brand._id}: ${brand.count.toLocaleString()} products`);
  });
}

async function validateDataIntegrity() {
  console.log('\n✅ Data Integrity Checks:');
  console.log('=========================');
  
  // Check for duplicate IDs
  const duplicateIds = await Product.aggregate([
    {
      $group: {
        _id: '$id',
        count: { $sum: 1 }
      }
    },
    {
      $match: { count: { $gt: 1 } }
    }
  ]);
  
  if (duplicateIds.length > 0) {
    console.log(`❌ Found ${duplicateIds.length} duplicate product IDs`);
  } else {
    console.log('✅ No duplicate product IDs found');
  }
  
  // Check for duplicate SKUs
  const duplicateSkus = await Product.aggregate([
    {
      $group: {
        _id: '$sku',
        count: { $sum: 1 }
      }
    },
    {
      $match: { count: { $gt: 1 } }
    }
  ]);
  
  if (duplicateSkus.length > 0) {
    console.log(`❌ Found ${duplicateSkus.length} duplicate SKUs`);
  } else {
    console.log('✅ No duplicate SKUs found');
  }
  
  // Check for missing required fields
  const missingFields = await Product.countDocuments({
    $or: [
      { name: { $in: [null, ''] } },
      { category: { $in: [null, ''] } },
      { brand: { $in: [null, ''] } },
      { department: { $in: [null, ''] } },
      { sku: { $in: [null, ''] } }
    ]
  });
  
  if (missingFields > 0) {
    console.log(`❌ Found ${missingFields} products with missing required fields`);
  } else {
    console.log('✅ All products have required fields');
  }
  
  // Check for invalid prices
  const invalidPrices = await Product.countDocuments({
    $or: [
      { retail_price: { $lt: 0 } },
      { cost: { $lt: 0 } }
    ]
  });
  
  if (invalidPrices > 0) {
    console.log(`❌ Found ${invalidPrices} products with invalid prices`);
  } else {
    console.log('✅ All products have valid prices');
  }
}


async function main() {
  try {
    console.log('🔍 Starting data verification...');
    
    // Connect to database
    await connectToDatabase();
    
    // Run all verification checks
    await getBasicStats();
    await getCategoryBreakdown();
    await getDepartmentBreakdown();
    await showSampleProducts();
    await testQueries();
    await validateDataIntegrity();
    
    console.log('\n✅ Data verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the verification
if (require.main === module) {
  main();
}

module.exports = { 
  getBasicStats, 
  getCategoryBreakdown, 
  getDepartmentBreakdown, 
  showSampleProducts, 
  testQueries, 
  validateDataIntegrity 
}; 