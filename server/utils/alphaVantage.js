const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';

const fetchStockData = async (symbol) => {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    const response = await axios.get(ALPHA_VANTAGE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: apiKey
      }
    });

    const data = response.data['Global Quote'];
    
    if (!data || !data['05. price']) {
      return null;
    }

    const price = parseFloat(data['05. price']);
    const changePercent = parseFloat(data['10. change percent'].replace('%', ''));

    await prisma.asset.update({
      where: { symbol: symbol },
      data: {
        currentPrice: price,
        change24h: changePercent,
        updatedAt: new Date()
      }
    });

    return { price, changePercent };
  } catch (error) {
    return null;
  }
};

module.exports = { fetchStockData };