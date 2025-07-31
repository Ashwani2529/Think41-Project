const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://ashwani2749:12345@cluster0.rkbeh5k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = 'products_db';

async function verifyMigration() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: DATABASE_NAME });
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('products');
    
    const withOldField = await collection.countDocuments({ department: { $exists: true } });
    const withNewField = await collection.countDocuments({ department_id: { $exists: true } });
    const total = await collection.countDocuments();
    
    const sample = await collection.findOne();
    
    console.log('\n📊 Migration Status:');
    console.log(`   Total products: ${total}`);
    console.log(`   With old 'department' field: ${withOldField}`);
    console.log(`   With new 'department_id' field: ${withNewField}`);
    
    console.log('\n🔍 Sample product fields:');
    console.log('   Fields:', Object.keys(sample).join(', '));
    
    if (withOldField === 0 && withNewField === total) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️ Migration incomplete');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
}

verifyMigration(); 