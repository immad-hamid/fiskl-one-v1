const axios = require('axios');

class FbrService {
  constructor() {
    this.baseURL = process.env.THIRD_PARTY_API_URL;
    this.token = process.env.THIRD_PARTY_API_KEY;
    this.timeout = 15000;
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async makeRequest(endpoint, params = {}) {
    if (!this.baseURL || !this.token) {
      throw new Error('FBR API configuration missing');
    }

    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: this.getHeaders(),
        params,
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      console.error(`FBR API error for ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Get provinces
  async getProvinces() {
    const data = await this.makeRequest('/fbr/provinces');
    return data.map(item => ({
      code: item.code,
      description: item.description
    }));
  }

  // Get transaction types
  async getTransactionTypes() {
    const data = await this.makeRequest('/fbr/transtypes');
    return data.map(item => ({
      id: item.id,
      description: item.description
    }));
  }

  // Get HS codes / item descriptions
  async getHsCodes() {
    const data = await this.makeRequest('/fbr/itemdescs');
    return data.map(item => ({
      hsCode: item.hsCode,
      description: item.description
    }));
  }

  // Get units of measure
  async getUoms() {
    const data = await this.makeRequest('/fbr/uoms');
    return data.map(item => ({
      id: item.id,
      name: item.description
    }));
  }

  // Get sale type to rate
  async getSaleTypeToRate(transTypeId, originationSupplier, date) {
    const params = {
      transTypeId: String(transTypeId),
      originationSupplier: String(originationSupplier)
    };
    if (date) params.date = date;

    return await this.makeRequest('/fbr/saletype-rate', params);
  }

  // Get SRO schedule
  async getSroSchedule(rateId, originationSupplierCsv, date) {
    const params = {
      rate_id: String(rateId),
      origination_supplier_csv: String(originationSupplierCsv)
    };
    if (date) params.date = date;

    return await this.makeRequest('/fbr/sro-schedule', params);
  }

  // Get SRO items
  async getSroItems(sroId, date) {
    const params = {
      sro_id: String(sroId)
    };
    if (date) params.date = date;

    return await this.makeRequest('/fbr/sro-item', params);
  }
}

module.exports = new FbrService();