const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

// Importăm funcția de citire din RAM din noul nostru simulator
const { getChartDataFromRAM } = require('../utils/marketSimulator');

const getAssets = async (req, res) => {
  try {
    const assets = await prisma.asset.findMany();
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: 'Error la preluarea activelor' });
  }
};

const getAssetHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Găsim simbolul activului pentru că memoria RAM le ține organizate pe simbol (ex: 'BTC')
    const asset = await prisma.asset.findUnique({
      where: { id: parseInt(id) },
      select: { symbol: true }
    });

    if (!asset) {
      return res.status(404).json({ message: 'Activul nu a fost găsit' });
    }

    // Cerem istoricul direct din memoria RAM a serverului (fără interogări grele pe baza de date)
    const rawHistory = getChartDataFromRAM(asset.symbol);

    // Formatăm istoricul exact cum se așteaptă frontend-ul
    const formattedHistory = rawHistory.map(record => ({
      // Transformăm Unix timestamp (secunde) înapoi într-o dată citibilă
      time: new Date(record.time * 1000).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
      price: Number(record.price)
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error("Eroare la preluarea istoricului:", error);
    res.status(500).json({ message: 'Error la preluarea istoricului' });
  }
};

const getMarketNews = async (req, res) => {
  try {
    const response = await axios.get('https://api.rss2json.com/v1/api.json?rss_url=https://finance.yahoo.com/news/rssindex');
    res.json(response.data.items);
  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
};

module.exports = { getAssets, getAssetHistory, getMarketNews };