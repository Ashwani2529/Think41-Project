const mongoose = require('mongoose');
const Product = require('./models/Product');
const Department = require('./models/Department');
const dotenv= require('dotenv')
dotenv.config()
// MongoDB connection URI
const MONGODB_URI = process.env.MONGO_URI;
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

async function migrateDepartments() {
  try {
    console.log('🚀 Starting department migration...');
    
    // Step 1: Extract unique department names from products
    console.log('📊 Extracting unique departments from products...');
    const uniqueDepartments = await Product.distinct('department');
    console.log(`Found ${uniqueDepartments.length} unique departments:`, uniqueDepartments);

    // Step 2: Check if departments already exist
    const existingDepartments = await Department.find({});
    if (existingDepartments.length > 0) {
      console.log(`⚠️ Found ${existingDepartments.length} existing departments. Skipping department creation.`);
    } else {
      // Step 3: Create department records
      console.log('🏗️ Creating department records...');
      const departmentRecords = uniqueDepartments.map((name, index) => ({
        id: index + 1,
        name: name,
        description: `${name} department products`,
        isActive: true
      }));

      await Department.insertMany(departmentRecords);
      console.log(`✅ Created ${departmentRecords.length} department records`);
    }

    // Step 4: Create department name to ID mapping
    const departments = await Department.find({});
    const departmentMap = {};
    departments.forEach(dept => {
      departmentMap[dept.name] = dept.id;
    });
    console.log('📋 Department mapping:', departmentMap);

    // Step 5: Update products to use department_id instead of department name
    console.log('🔄 Updating products to use department_id...');
    
    let updatedCount = 0;
    const batchSize = 1000;
    
    for (const [departmentName, departmentId] of Object.entries(departmentMap)) {
      const result = await Product.updateMany(
        { department: departmentName },
        { 
          $set: { department_id: departmentId },
          $unset: { department: 1 } // Remove old field
        }
      );
      updatedCount += result.modifiedCount;
      console.log(`Updated ${result.modifiedCount} products for department: ${departmentName}`);
    }

    console.log(`✅ Migration completed! Updated ${updatedCount} products`);

    // Step 6: Verify the migration
    console.log('🔍 Verifying migration...');
    const productsWithoutDepartmentId = await Product.countDocuments({ department_id: { $exists: false } });
    const productsWithOldDepartment = await Product.countDocuments({ department: { $exists: true } });
    
    console.log(`Products without department_id: ${productsWithoutDepartmentId}`);
    console.log(`Products with old department field: ${productsWithOldDepartment}`);
    
    if (productsWithoutDepartmentId === 0 && productsWithOldDepartment === 0) {
      console.log('✅ Migration verification successful!');
    } else {
      console.log('⚠️ Migration verification found issues');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

async function rollbackMigration() {
  try {
    console.log('🔄 Rolling back department migration...');
    
    // Get departments mapping
    const departments = await Department.find({});
    const departmentMap = {};
    departments.forEach(dept => {
      departmentMap[dept.id] = dept.name;
    });

    // Update products back to use department names
    for (const [departmentId, departmentName] of Object.entries(departmentMap)) {
      const result = await Product.updateMany(
        { department_id: parseInt(departmentId) },
        { 
          $set: { department: departmentName },
          $unset: { department_id: 1 }
        }
      );
      console.log(`Restored ${result.modifiedCount} products for department: ${departmentName}`);
    }

    console.log('✅ Rollback completed!');
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await connectDB();
    
    const command = process.argv[2];
    
    if (command === 'rollback') {
      await rollbackMigration();
    } else {
      await migrateDepartments();
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
if (require.main === module) {
  main();
}

module.exports = { migrateDepartments, rollbackMigration }; 