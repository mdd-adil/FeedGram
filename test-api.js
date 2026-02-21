// API Test Script
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

let authToken = '';

const apiTests = {
  // Test user registration
  testRegister: async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, {
        username: 'testuser' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        password: 'testpassword123'
      });
      console.log('✅ Register API: Working');
      return true;
    } catch (error) {
      console.log('❌ Register API: Failed -', error.message);
      return false;
    }
  },

  // Test user login
  testLogin: async () => {
    try {
      // First register a user
      const username = 'testuser' + Date.now();
      const email = 'test' + Date.now() + '@example.com';
      const password = 'testpassword123';
      
      await axios.post(`${API_BASE_URL}/register`, {
        username, email, password
      });

      // Then login
      const loginResponse = await axios.post(`${API_BASE_URL}/login`, {
        email, password
      });

      if (loginResponse.data.token) {
        authToken = loginResponse.data.token;
        console.log('✅ Login API: Working');
        return true;
      } else {
        console.log('❌ Login API: No token returned');
        return false;
      }
    } catch (error) {
      console.log('❌ Login API: Failed -', error.message);
      return false;
    }
  },

  // Test protected routes
  testProtectedRoutes: async () => {
    if (!authToken) {
      console.log('❌ Protected Routes: No auth token available');
      return false;
    }

    const headers = { Authorization: `Bearer ${authToken}` };
    let allPassed = true;

    // Test profile endpoint
    try {
      await axios.get(`${API_BASE_URL}/profile`, { headers });
      console.log('✅ Profile API: Working');
    } catch (error) {
      console.log('❌ Profile API: Failed -', error.message);
      allPassed = false;
    }

    // Test home endpoint
    try {
      await axios.get(`${API_BASE_URL}/home`, { headers });
      console.log('✅ Home API: Working');
    } catch (error) {
      console.log('❌ Home API: Failed -', error.message);
      allPassed = false;
    }

    // Test chat users endpoint
    try {
      await axios.get(`${API_BASE_URL}/chat/users`, { headers });
      console.log('✅ Chat Users API: Working');
    } catch (error) {
      console.log('❌ Chat Users API: Failed -', error.message);
      allPassed = false;
    }

    return allPassed;
  },

  // Test server health
  testServerHealth: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/`);
      if (response.data === 'API is running....') {
        console.log('✅ Server Health: Working');
        return true;
      } else {
        console.log('❌ Server Health: Unexpected response');
        return false;
      }
    } catch (error) {
      console.log('❌ Server Health: Failed -', error.message);
      return false;
    }
  }
};

// Run all tests
async function runAllTests() {
  console.log('🔄 Starting API Tests...\n');
  
  const results = {
    serverHealth: await apiTests.testServerHealth(),
    register: await apiTests.testRegister(),
    login: await apiTests.testLogin(),
    protectedRoutes: await apiTests.testProtectedRoutes()
  };

  console.log('\n📊 Test Results:');
  console.log('================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n📈 Summary: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the backend server and database connection.');
  }
}

// Export for manual testing
module.exports = { apiTests, runAllTests };

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}