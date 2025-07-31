const mongoose = require('mongoose');
const Product = require('./models/Product');

// MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://ashwani2749:12345@cluster0.rkbeh5k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = 'products_db';

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

async function cleanupDepartmentFields() {
  try {
    console.log('🧹 Starting cleanup of old department fields...');
    
    // Remove the old department field from all products
    const result = await Product.updateMany(
      { department: { $exists: true } },
      { $unset: { department: 1 } }
    );
    
    console.log(`✅ Removed old department field from ${result.modifiedCount} products`);
    
    // Verify cleanup
    const productsWithOldDepartment = await Product.countDocuments({ department: { $exists: true } });
    const productsWithNewDepartment = await Product.countDocuments({ department_id: { $exists: true } });
    
    console.log(`📊 Verification:`);
    console.log(`   Products with old department field: ${productsWithOldDepartment}`);
    console.log(`   Products with new department_id field: ${productsWithNewDepartment}`);
    
    if (productsWithOldDepartment === 0) {
      console.log('✅ Cleanup completed successfully!');
    } else {
      console.log('⚠️ Some products still have the old department field');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    await cleanupDepartmentFields();
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run cleanup
if (require.main === module) {
  main();
}

module.exports = { cleanupDepartmentFields }; 