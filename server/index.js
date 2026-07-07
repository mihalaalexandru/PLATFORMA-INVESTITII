require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const authRoutes = require('./routes/authRoutes');
const assetRoutes = require('./routes/assetRoutes');
const { startSimulator, setBroadcastFn } = require('./utils/marketSimulator');
const tradeRoutes = require('./routes/tradeRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const adminRoutes = require('./routes/adminRoutes');
const app = express();
const alertRoutes = require('./routes/alertRoutes');
const startPriceTracker = require('./services/priceTracker');
const autoOrderRoutes = require('./routes/autoOrderRoutes');

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// inregistram toate rutele API ale aplicatiei
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/auto-orders', autoOrderRoutes);

// server HTTP + server WebSocket pentru actualizari live de preturi
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// tinem evidenta abonamentelor: Map<conexiune_ws, { symbol, timeframe }>
const subscriptions = new Map();

wss.on('connection', (ws) => {
  // clientul trimite un mesaj de abonare cu simbolul si timeframe-ul dorit
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'subscribe' && msg.symbol && msg.timeframe) {
        subscriptions.set(ws, { symbol: msg.symbol.toUpperCase(), timeframe: msg.timeframe });
      }
    } catch (_) {}
  });
  // curatam abonamentul cand conexiunea se inchide sau apare o eroare
  ws.on('close', () => subscriptions.delete(ws));
  ws.on('error', () => subscriptions.delete(ws));
});

// functie apelata de marketSimulator la fiecare update de lumanare (candle)
// trimite datele doar clientilor abonati la simbolul/timeframe-ul respectiv
setBroadcastFn((symbol, timeframe, candle) => {
  const payload = JSON.stringify({ type: 'candle', symbol, timeframe, candle });
  for (const [ws, sub] of subscriptions) {
    if (ws.readyState === 1 && sub.symbol === symbol && sub.timeframe === timeframe) {
      ws.send(payload);
    }
  }
});

// pornim job-ul care verifica alertele de pret si comenzile automate
startPriceTracker();
// pornim simulatorul care actualizeaza preturile activelor periodic
startSimulator();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});