const express = require('express');
const router = express.Router();
const fbrService = require('../services/fbrService');

// Get provinces
router.get('/provinces', async (req, res) => {
  try {
    const provinces = await fbrService.getProvinces();
    res.json(provinces);
  } catch (error) {
    console.error('Error fetching provinces:', error.message);
    res.status(500).json({ error: 'Failed to fetch provinces' });
  }
});

// Get transaction types
router.get('/transtypes', async (req, res) => {
  try {
    const transTypes = await fbrService.getTransactionTypes();
    res.json(transTypes);
  } catch (error) {
    console.error('Error fetching transaction types:', error.message);
    res.status(500).json({ error: 'Failed to fetch transaction types' });
  }
});

// Get HS codes / item descriptions
router.get('/itemdescs', async (req, res) => {
  try {
    const hsCodes = await fbrService.getHsCodes();
    res.json(hsCodes);
  } catch (error) {
    console.error('Error fetching HS codes:', error.message);
    res.status(500).json({ error: 'Failed to fetch HS codes' });
  }
});

// Get units of measure
router.get('/uoms', async (req, res) => {
  try {
    const uoms = await fbrService.getUoms();
    res.json(uoms);
  } catch (error) {
    console.error('Error fetching UOMs:', error.message);
    res.status(500).json({ error: 'Failed to fetch units of measure' });
  }
});

// Get sale type to rate
router.get('/saletype-rate', async (req, res) => {
  try {
    const { transTypeId, originationSupplier, date } = req.query;
    
    if (!transTypeId || !originationSupplier) {
      return res.status(400).json({ 
        error: 'transTypeId and originationSupplier are required' 
      });
    }

    const rates = await fbrService.getSaleTypeToRate(transTypeId, originationSupplier, date);
    res.json(rates);
  } catch (error) {
    console.error('Error fetching sale type rates:', error.message);
    res.status(500).json({ error: 'Failed to fetch sale type rates' });
  }
});

// Get SRO schedule
router.get('/sro-schedule', async (req, res) => {
  try {
    const { rate_id, origination_supplier_csv, date } = req.query;
    
    if (!rate_id || !origination_supplier_csv) {
      return res.status(400).json({ 
        error: 'rate_id and origination_supplier_csv are required' 
      });
    }

    const schedule = await fbrService.getSroSchedule(rate_id, origination_supplier_csv, date);
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching SRO schedule:', error.message);
    res.status(500).json({ error: 'Failed to fetch SRO schedule' });
  }
});

// Get SRO items
router.get('/sro-item', async (req, res) => {
  try {
    const { sro_id, date } = req.query;
    
    if (!sro_id) {
      return res.status(400).json({ error: 'sro_id is required' });
    }

    const items = await fbrService.getSroItems(sro_id, date);
    res.json(items);
  } catch (error) {
    console.error('Error fetching SRO items:', error.message);
    res.status(500).json({ error: 'Failed to fetch SRO items' });
  }
});

module.exports = router;