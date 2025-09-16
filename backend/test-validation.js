// Quick test script to verify error handling
const axios = require('axios');

async function testValidation() {
  try {
    // Test the new validation endpoint
    const response = await axios.post('http://localhost:3000/api/invoices/1/validate-invoice');
    console.log('Validation success:', response.status);
  } catch (error) {
    console.log('Validation error status:', error.response?.status);
    console.log('Validation error data:', error.response?.data);
  }
}

testValidation();