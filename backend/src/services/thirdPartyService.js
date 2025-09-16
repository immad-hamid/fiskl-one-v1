const axios = require('axios');

class ThirdPartyService {
  static async sendInvoiceData(invoiceData) {
    const apiUrl = process.env.THIRD_PARTY_API_URL;
    const apiKey = process.env.THIRD_PARTY_API_KEY;
    console.log('API Key:', apiKey);

    if (!apiUrl || !apiKey) {
      console.warn('Third-party API configuration missing');
      return;
    }

    try {
      const response = await axios.post(apiUrl, {
        invoice: invoiceData,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      console.log('Third-party API response:', response.status);
      return response.data;
    } catch (error) {
      console.error('Third-party API error:', error.message);
      throw error;
    }
  }

  static async validateInvoice(invoiceData) {
    const apiUrl = process.env.THIRD_PARTY_API_URL;
    const apiKey = process.env.THIRD_PARTY_API_KEY;
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!apiUrl || !apiKey) {
      throw new Error('Third-party API configuration missing');
    }

    // Determine endpoint based on MOCK_THIRD_PARTY_API setting
    const endpoint = process.env.MOCK_THIRD_PARTY_API === 'true' 
      ? '/fbr/validate-invoice-sb' 
      : '/fbr/validate-invoice';
    console.log('Using endpoint:', endpoint);

    try {
      const payload = this.formatInvoicePayload(invoiceData);console.log(payload);
      const response = await axios.post(`${apiUrl}${endpoint}`, payload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log('<--------------------------- RESPONSE ------------------------->>' + response);

      return this.validateResponse(response.data);
    } catch (error) {
      // Handle FBR API validation errors (when API returns 401 but with validation details)
      if (error.response?.status === 401 && error.response?.data?.validationResponse) {
        const validationError = error.response.data.validationResponse;
        const fbrError = new Error(validationError.error || 'FBR validation failed');
        fbrError.statusCode = 400; // Convert 401 to 400 for validation errors
        fbrError.fbrErrorCode = validationError.errorCode;
        fbrError.fbrStatus = validationError.status;
        throw fbrError;
      }
      
      // If we get a 404 in development, suggest using mock mode
      if (isDevelopment && error.response?.status === 404) {
        throw new Error('External API endpoint not found. Consider setting MOCK_THIRD_PARTY_API=true for development testing.');
      }
      
      throw error;
    }
  }

  static async postInvoice(invoiceData) {
    const apiUrl = process.env.THIRD_PARTY_API_URL;
    const apiKey = process.env.THIRD_PARTY_API_KEY;
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!apiUrl || !apiKey) {
      throw new Error('Third-party API configuration missing');
    }

    // Determine endpoint based on MOCK_THIRD_PARTY_API setting
    const endpoint = process.env.MOCK_THIRD_PARTY_API === 'true' 
      ? '/fbr/post-invoice-sb' 
      : '/fbr/post-invoice';

    try {
      const payload = this.formatInvoicePayload(invoiceData);
      
      const response = await axios.post(`${apiUrl}${endpoint}`, payload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return this.validateResponse(response.data);
    } catch (error) {
      console.error('Invoice posting error:', error.message);
      
      // Handle FBR API validation errors (when API returns 401 but with validation details)
      if (error.response?.status === 401 && error.response?.data?.validationResponse) {
        const validationError = error.response.data.validationResponse;
        const fbrError = new Error(validationError.error || 'FBR posting failed');
        fbrError.statusCode = 400; // Convert 401 to 400 for validation errors
        fbrError.fbrErrorCode = validationError.errorCode;
        fbrError.fbrStatus = validationError.status;
        throw fbrError;
      }
      
      // If we get a 404 in development, suggest using mock mode
      if (isDevelopment && error.response?.status === 404) {
        throw new Error('External API endpoint not found. Consider setting MOCK_THIRD_PARTY_API=true for development testing.');
      }
      
      throw error;
    }
  }

  static formatInvoicePayload(invoiceData) {
    // Format date properly - handle both Date objects and strings
    let formattedDate;
    if (invoiceData.invoiceDate instanceof Date) {
      formattedDate = invoiceData.invoiceDate.toISOString().split('T')[0];
    } else if (typeof invoiceData.invoiceDate === 'string') {
      formattedDate = invoiceData.invoiceDate.split('T')[0];
    } else {
      formattedDate = new Date(invoiceData.invoiceDate).toISOString().split('T')[0];
    }

    return {
      invoiceType: invoiceData.invoiceType,
      invoiceDate: formattedDate, // Format as YYYY-MM-DD
      sellerNTNCNIC: invoiceData.sellerNTNCNIC,
      sellerBusinessName: invoiceData.sellerBusinessName,
      sellerProvince: invoiceData.sellerProvince,
      sellerAddress: invoiceData.sellerAddress,
      buyerNTNCNIC: invoiceData.buyerNTNCNIC,
      buyerBusinessName: invoiceData.buyerBusinessName,
      buyerProvince: invoiceData.buyerProvince,
      buyerAddress: invoiceData.buyerAddress,
      buyerRegistrationType: invoiceData.buyerRegistrationType,
      invoiceRefNo: invoiceData.invoiceRefNo || '',
      scenarioId: invoiceData.scenarioId,
      items: invoiceData.items.map(item => ({
        hsCode: item.hsCode,
        productDescription: item.productDescription,
        rate: item.rate,
        uoM: item.uoM,
        quantity: parseFloat(item.quantity),
        totalValues: parseFloat(item.totalValues),
        valueSalesExcludingST: parseFloat(item.valueSalesExcludingST),
        fixedNotifiedValueOrRetailPrice: parseFloat(item.fixedNotifiedValueOrRetailPrice),
        salesTaxApplicable: parseFloat(item.salesTaxApplicable),
        salesTaxWithheldAtSource: parseFloat(item.salesTaxWithheldAtSource),
        extraTax: item.extraTax || '',
        furtherTax: parseFloat(item.furtherTax),
        sroScheduleNo: item.sroScheduleNo || '',
        fedPayable: parseFloat(item.fedPayable),
        discount: parseFloat(item.discount),
        saleType: item.saleType,
        sroItemSerialNo: item.sroItemSerialNo || ''
      }))
    };
  }

  static validateResponse(responseData) {
    console.log('=== VALIDATE RESPONSE DEBUG ===');
    console.log('responseData:', JSON.stringify(responseData, null, 2));

    // Check main validation response
    if (!responseData.validationResponse || responseData.validationResponse.status !== 'Valid') {
      console.log('Main validation status is not Valid');

      // Check if there are item-level validation errors first
      if (responseData.validationResponse?.invoiceStatuses) {
        console.log('Checking item-level validation errors...');
        for (const status of responseData.validationResponse.invoiceStatuses) {
          if (status.status !== 'Valid' && status.error) {
            console.log('Found item-level error:', status);
            const fbrError = new Error(status.error);
            fbrError.statusCode = 400;
            fbrError.fbrErrorCode = status.errorCode;
            fbrError.fbrStatus = status.status;
            fbrError.itemSNo = status.itemSNo;
            console.log('Created fbrError with statusCode:', fbrError.statusCode);
            throw fbrError;
          }
        }
      }

      // Fallback to main validation error if no item errors found
      console.log('Using main validation error as fallback');
      const error = responseData.validationResponse?.error || 'Unknown validation error';
      const fbrError = new Error(error);
      fbrError.statusCode = 400;
      fbrError.fbrErrorCode = responseData.validationResponse?.errorCode;
      fbrError.fbrStatus = responseData.validationResponse?.status;
      console.log('Created fallback fbrError with statusCode:', fbrError.statusCode);
      throw fbrError;
    }

    // Check individual item statuses for valid responses
    if (responseData.validationResponse.invoiceStatuses) {
      for (const status of responseData.validationResponse.invoiceStatuses) {
        if (status.status !== 'Valid') {
          const error = status.error || `Item ${status.itemSNo} validation failed`;
          const fbrError = new Error(error);
          fbrError.statusCode = 400;
          fbrError.fbrErrorCode = status.errorCode;
          fbrError.fbrStatus = status.status;
          fbrError.itemSNo = status.itemSNo;
          throw fbrError;
        }
      }
    }

    return responseData;
  }
}

module.exports = ThirdPartyService;