const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { fetchStockData } = require('../utils/alphaVantage');

const syncSingleAsset = async (req, res) => {
  try {
    const { symbol } = req.body;
    const data = await fetchStockData(symbol);
    
    if (data) {
      return res.json({ message: 'Success', data });
    }
    
    res.status(400).json({ message: 'Failed to fetch from API' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { syncSingleAsset };