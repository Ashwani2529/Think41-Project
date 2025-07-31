const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
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

async function clearExistingData() {
  try {
    const count = await Product.countDocuments();
    if (count > 0) {
      console.log(`🗑️ Clearing ${count} existing products...`);
      await Product.deleteMany({});
      console.log('✅ Existing data cleared');
    }
  } catch (error) {
    console.error('❌ Error clearing existing data:', error.message);
    throw error;
  }
}

function parseCSVRow(row) {
  return {
    id: parseInt(row.id),
    cost: parseFloat(row.cost),
    category: row.category?.trim() || '',
    name: row.name?.trim() || '',
    brand: row.brand?.trim() || '',
    retail_price: parseFloat(row.retail_price),
    department: row.department?.trim() || '',
    sku: row.sku?.trim() || '',
    distribution_center_id: parseInt(row.distribution_center_id)
  };
}

function validateProduct(product) {
  const errors = [];
  
  if (!product.id || isNaN(product.id)) errors.push('Invalid id');
  if (!product.cost || isNaN(product.cost)) errors.push('Invalid cost');
  if (!product.category) errors.push('Missing category');
  if (!product.name) errors.push('Missing name');
  if (!product.brand) errors.push('Missing brand');
  if (!product.retail_price || isNaN(product.retail_price)) errors.push('Invalid retail_price');
  if (!product.department) errors.push('Missing department');
  if (!product.sku) errors.push('Missing sku');
  if (!product.distribution_center_id || isNaN(product.distribution_center_id)) errors.push('Invalid distribution_center_id');
  
  return errors;
}

async function loadProductsFromCSV() {
  return new Promise((resolve, reject) => {
    const products = [];
    const errors = [];
    let rowCount = 0;
    const BATCH_SIZE = 1000;

    console.log('📖 Reading CSV file...');

    fs.createReadStream('archive/products.csv')
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        
        try {
          const product = parseCSVRow(row);
          const validationErrors = validateProduct(product);
          
          if (validationErrors.length > 0) {
            errors.push({
              row: rowCount,
              errors: validationErrors,
              data: row
            });
          } else {
            products.push(product);
          }
          
          // Show progress every 5000 rows
          if (rowCount % 5000 === 0) {
            console.log(`📊 Processed ${rowCount} rows, ${products.length} valid products`);
          }
        } catch (error) {
          errors.push({
            row: rowCount,
            errors: [error.message],
            data: row
          });
        }
      })
      .on('end', async () => {
        console.log(`✅ CSV reading complete. Processed ${rowCount} rows`);
        console.log(`📈 Valid products: ${products.length}`);
        console.log(`❌ Invalid rows: ${errors.length}`);
        
        if (errors.length > 0 && errors.length < 10) {
          console.log('Sample errors:');
          errors.slice(0, 5).forEach(error => {
            console.log(`  Row ${error.row}: ${error.errors.join(', ')}`);
          });
        }

        try {
          // Insert products in batches
          console.log('💾 Inserting products into database...');
          let insertedCount = 0;
          
          for (let i = 0; i < products.length; i += BATCH_SIZE) {
            const batch = products.slice(i, i + BATCH_SIZE);
            await Product.insertMany(batch, { ordered: false });
            insertedCount += batch.length;
            console.log(`📦 Inserted batch: ${insertedCount}/${products.length} products`);
          }
          
          resolve({ 
            totalRows: rowCount, 
            validProducts: products.length, 
            insertedProducts: insertedCount,
            errors: errors.length 
          });
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function main() {
  try {
    console.log('🚀 Starting product data import...');
    
    // Connect to database
    await connectToDatabase();
    
    // Clear existing data
    await clearExistingData();
    
    // Load products from CSV
    const result = await loadProductsFromCSV();
    
    console.log('\n📊 Import Summary:');
    console.log(`   Total CSV rows: ${result.totalRows}`);
    console.log(`   Valid products: ${result.validProducts}`);
    console.log(`   Inserted products: ${result.insertedProducts}`);
    console.log(`   Errors: ${result.errors}`);
    
    console.log('\n✅ Product import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the import
if (require.main === module) {
  main();
}

module.exports = { loadProductsFromCSV, connectToDatabase }; 