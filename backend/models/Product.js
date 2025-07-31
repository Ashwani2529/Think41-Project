const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  cost: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true,
    index: true
  },
  retail_price: {
    type: Number,
    required: true
  },
  department: {
    type: String,
    required: true,
    index: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  distribution_center_id: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  collection: 'products'
});

// Create indexes for better query performance
productSchema.index({ category: 1, department: 1 });
productSchema.index({ brand: 1, category: 1 });
productSchema.index({ retail_price: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 