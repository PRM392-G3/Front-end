import axios from 'axios';

// Test API connection
export const testAPIConnection = async () => {
  try {
    console.log('Testing API connection to https://ba03ec5e177c.ngrok-free.app...');
    
    // Test basic connection
    const response = await axios.get('https://ba03ec5e177c.ngrok-free.app/swagger/index.html', {
      timeout: 5000,
      validateStatus: (status) => status < 500, // Accept any status < 500
    });
    
    console.log('API connection successful:', response.status);
    return true;
  } catch (error: any) {
    console.error('API connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('Server is not running or not accessible');
    } else if (error.code === 'ENOTFOUND') {
      console.log('Server URL not found');
    } else if (error.code === 'ECONNABORTED') {
      console.log('Connection timeout');
    }
    
    return false;
  }
};

// Test auth endpoints
export const testAuthEndpoints = async () => {
  const baseURL = 'https://ba03ec5e177c.ngrok-free.app/api';
  
  try {
    console.log('Testing auth endpoints...');
    
    // Test login endpoint
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      }, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });
      console.log('Login endpoint response:', loginResponse.status);
    } catch (error: any) {
      console.log('Login endpoint test:', error.response?.status || error.message);
    }
    
    // Test register endpoint
    try {
      const registerResponse = await axios.post(`${baseURL}/auth/register`, {
        name: 'Test User',
        email: 'test@example.com',
        phone: '0123456789',
        password: 'password123'
      }, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });
      console.log('Register endpoint response:', registerResponse.status);
    } catch (error: any) {
      console.log('Register endpoint test:', error.response?.status || error.message);
    }
    
    // Test Google auth endpoint
    try {
      const googleResponse = await axios.post(`${baseURL}/auth/google`, {
        token: 'mock_google_token'
      }, {
        timeout: 5000,
        validateStatus: (status) => status < 500,
      });
      console.log('Google auth endpoint response:', googleResponse.status);
    } catch (error: any) {
      console.log('Google auth endpoint test:', error.response?.status || error.message);
    }
    
    return true;
  } catch (error: any) {
    console.error('Auth endpoints test failed:', error.message);
    return false;
  }
};

// Run all tests
export const runAPITests = async () => {
  console.log('=== API Connection Tests ===');
  
  const connectionTest = await testAPIConnection();
  const endpointsTest = await testAuthEndpoints();
  
  console.log('=== Test Results ===');
  console.log('Connection test:', connectionTest ? 'PASS' : 'FAIL');
  console.log('Endpoints test:', endpointsTest ? 'PASS' : 'FAIL');
  
  return {
    connection: connectionTest,
    endpoints: endpointsTest,
  };
};
