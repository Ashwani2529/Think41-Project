const axios = require('axios');

const API_BASE = 'https://think41-project.onrender.com';

async function testEndpoint(method, url, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`   ${method} ${url}`);
    
    const response = await axios({ method, url: `${API_BASE}${url}` });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📄 Response type: ${typeof response.data}`);
    
    if (response.data.success) {
      console.log(`   ✅ Success: true`);
      
      if (response.data.data) {
        if (Array.isArray(response.data.data)) {
          console.log(`   📊 Data: Array with ${response.data.data.length} items`);
          if (response.data.data.length > 0) {
            console.log(`   🔍 Sample item keys: ${Object.keys(response.data.data[0]).join(', ')}`);
          }
        } else {
          console.log(`   📊 Data: Object`);
          console.log(`   🔍 Object keys: ${Object.keys(response.data.data).join(', ')}`);
        }
      }
      
      if (response.data.pagination) {
        const { currentPage, totalPages, totalCount, limit } = response.data.pagination;
        console.log(`   📄 Pagination: Page ${currentPage}/${totalPages}, Total: ${totalCount}, Limit: ${limit}`);
      }
      
      if (response.data.department) {
        console.log(`   🏢 Department: ${response.data.department.name} (ID: ${response.data.department.id})`);
      }
    } else {
      console.log(`   ❌ Success: false`);
      console.log(`   ❌ Error: ${response.data.error}`);
    }
    
    return response.data;
  } catch (error) {
    console.log(`   ❌ Error: ${error.response?.status || 'Network'} - ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Department API Tests');
  console.log('=================================');
  
  // Test 1: Get all departments
  const departments = await testEndpoint('GET', '/api/departments', 'Get all departments');
  
  if (!departments || !departments.data || departments.data.length === 0) {
    console.log('\n❌ No departments found! Cannot continue with department-specific tests.');
    return;
  }
  
  const firstDepartment = departments.data[0];
  const departmentId = firstDepartment.id;
  
  // Test 2: Get specific department
  await testEndpoint('GET', `/api/departments/${departmentId}`, `Get department by ID (${departmentId})`);
  
  // Test 3: Get products in department
  await testEndpoint('GET', `/api/departments/${departmentId}/products`, `Get products in department ${departmentId}`);
  
  // Test 4: Get products in department with pagination
  await testEndpoint('GET', `/api/departments/${departmentId}/products?limit=5&page=1`, `Get products in department ${departmentId} (paginated)`);
  
  // Test 5: Get products in department with filters
  await testEndpoint('GET', `/api/departments/${departmentId}/products?category=Accessories&limit=3`, `Get accessories in department ${departmentId}`);
  
  // Test 6: Invalid department ID
  await testEndpoint('GET', '/api/departments/999', 'Get non-existent department (should return 404)');
  
  // Test 7: Invalid department ID format
  await testEndpoint('GET', '/api/departments/invalid', 'Get department with invalid ID format (should return 400)');
  
  // Test 8: Get products for non-existent department
  await testEndpoint('GET', '/api/departments/999/products', 'Get products for non-existent department (should return 404)');
  
  console.log('\n🎉 Department API Tests Completed!');
}

// Wait a moment for server to start, then run tests
setTimeout(() => {
  runTests().catch(console.error);
}, 5000); 