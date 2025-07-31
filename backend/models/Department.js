const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'departments'
});

// Create index for better query performance
departmentSchema.index({ name: 1 });

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department; 