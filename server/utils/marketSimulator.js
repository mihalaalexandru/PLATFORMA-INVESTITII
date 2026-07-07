const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// pretul de deschidere al zilei pentru fiecare asset, tinut in memorie (RAM)
// se reseteaza automat la miezul noptii ca sa avem un change24h corect
const dailyOpenPrices = {};
let lastResetDay = new Date().getDate();

// intervalele de timp suportate pentru grafic, exprimate in secunde
const TIMEFRAMES = {
  '20s': 20,
  '1m':  60,
  '5m':  300,
  '15m': 900,
  '1h':  3600,
  '4h':  14400,
  '1d':  86400,
};
const MAX_CANDLES = 500; // numarul maxim de lumanari pastrate per asset/timeframe

// stocarea in memorie a lumanarilor (candles) pentru fiecare asset si timeframe
const candleStore = {};

// functie de broadcast setata din exterior (ex: websocket) pentru a trimite update-uri live
let _broadcastFn = null;
const setBroadcastFn = (fn) => { _broadcastFn = fn; };

// rotunjeste un timestamp la inceputul intervalului (bucket) corespunzator
const getCandleTime = (unixSec, intervalSec) =>
  Math.floor(unixSec / intervalSec) * intervalSec;

// creeaza sau actualizeaza lumanarea curenta pentru un asset si un timeframe
const updateCandle = (symbol, tfKey, price) => {
  const intervalSec = TIMEFRAMES[tfKey];
  const now = Math.floor(Date.now() / 1000);
  const candleTime = getCandleTime(now, intervalSec);

  if (!candleStore[symbol]) candleStore[symbol] = {};
  if (!candleStore[symbol][tfKey]) candleStore[symbol][tfKey] = [];

  const arr = candleStore[symbol][tfKey];
  const volume = Math.round(100 + Math.random() * 900);

  // daca nu exista inca o lumanare pentru acest interval, o cream pe cea noua
  if (arr.length === 0 || arr[arr.length - 1].time !== candleTime) {
    const prevClose = arr.length > 0 ? arr[arr.length - 1].close : price;
    arr.push({ time: candleTime, open: prevClose, high: price, low: price, close: price, volume });
    if (arr.length > MAX_CANDLES) arr.shift(); // limitam istoricul la MAX_CANDLES
  } else {
    // altfel actualizam lumanarea existenta (close, high, low, volume)
    const c = arr[arr.length - 1];
    c.close = price;
    c.high = Math.max(c.high, price);
    c.low  = Math.min(c.low,  price);
    c.volume += volume;
  }

  // trimitem update live catre clienti daca exista o functie de broadcast setata
  if (_broadcastFn) {
    _broadcastFn(symbol, tfKey, arr[arr.length - 1]);
  }
};

// functia principala care simuleaza miscarea preturilor, rulata periodic
const simulateMarket = async () => {
  try {
    // reset zilnic al preturilor de deschidere, la miezul noptii
    const today = new Date().getDate();
    if (today !== lastResetDay) {
      Object.keys(dailyOpenPrices).forEach(k => delete dailyOpenPrices[k]);
      lastResetDay = today;
    }

    const assets = await prisma.asset.findMany();

    for (const asset of assets) {
      // initializam pretul de deschidere al zilei pentru acest asset, daca nu exista deja
      if (!dailyOpenPrices[asset.id]) {
        dailyOpenPrices[asset.id] = asset.currentPrice;
      }

      // generam o miscare aleatorie de pret; criptomonedele au volatilitate mai mare
      const volatility = asset.type === 'CRYPTO' ? 0.0015 : 0.0005;
      const randomMove = asset.currentPrice * (Math.random() * (volatility * 2) - volatility);
      let newPrice = asset.currentPrice + randomMove;
      if (newPrice <= 0) newPrice = asset.currentPrice; // preturile nu pot fi negative sau zero

      // change24h = variatia procentuala fata de pretul de deschidere al zilei
      const openPrice = dailyOpenPrices[asset.id];
      const newChange24h = ((newPrice - openPrice) / openPrice) * 100;

      // salvam noul pret si variatia in baza de date
      await prisma.asset.update({
        where: { id: asset.id },
        data: { 
          currentPrice: newPrice, 
          change24h: newChange24h }
      });

      // actualizam lumanarile pentru toate timeframe-urile acestui asset
      for (const tfKey of Object.keys(TIMEFRAMES)) {
        updateCandle(asset.symbol, tfKey, newPrice);
      }
    }
  } catch (error) {
    console.error('Eroare in simularea live:', error.message);
  }
};

// returneaza lumanarile stocate pentru un asset si un timeframe date
const getCandles = (symbol, timeframe) => {
  return (candleStore[symbol] && candleStore[symbol][timeframe]) || [];
};

// porneste simulatorul de piata, rulandu-l la fiecare 3 secunde
const startSimulator = async () => {
  console.log(' Simulatorul de piata a pornit ');
  setInterval(simulateMarket, 3000);
};

module.exports = { startSimulator, getCandles, setBroadcastFn, TIMEFRAMES };
