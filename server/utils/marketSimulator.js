const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Memorie RAM pentru a stoca istoricul graficelor FĂRĂ să blocăm baza de date
const liveHistory = {};
const MAX_HISTORY_POINTS = 1000; // Va ține pe ecran ultimele 1000 de fluctuații (~50 minute de istoric vizual continuu)

const simulateMarket = async () => {
  try {
    const assets = await prisma.asset.findMany();

    for (const asset of assets) {
      // 1. RANDOM WALK: Generăm o mișcare naturală, de ordinul cenților (volatilitate foarte mică)
      const volatility = asset.type === 'CRYPTO' ? 0.0015 : 0.0005; // 0.15% pentru crypto, 0.05% pentru actiuni
      const randomMove = asset.currentPrice * (Math.random() * (volatility * 2) - volatility);
      
      let newPrice = asset.currentPrice + randomMove;
      if (newPrice <= 0) newPrice = asset.currentPrice; // Prevenim prețurile negative
      
      const priceDiff = newPrice - asset.currentPrice;
      const newChange24h = asset.change24h + (priceDiff / asset.currentPrice) * 100;

      // 2. UPDATE BAZA DE DATE: Actualizăm doar prețul curent pentru afișarea în portofoliu
      await prisma.asset.update({
        where: { id: asset.id },
        data: {
          currentPrice: newPrice,
          change24h: newChange24h
        }
      });

      // 3. ISTORIC IN RAM (Fără Prisma Create!): Salvăm punctul doar în memoria serverului pentru grafic
      if (!liveHistory[asset.symbol]) {
        liveHistory[asset.symbol] = [];
      }

      const now = Math.floor(Date.now() / 1000); // Timpul în secunde (Unix timestamp)
      
      liveHistory[asset.symbol].push({
        time: now,
        price: newPrice
      });

      // Bandă de rulare: Când ajungem la 1000 de puncte, îl ștergem pe cel mai vechi
      if (liveHistory[asset.symbol].length > MAX_HISTORY_POINTS) {
        liveHistory[asset.symbol].shift();
      }
    }
  } catch (error) {
    console.error("Eroare in timpul simularii live:", error.message);
  }
};

// Această funcție ne va ajuta să trimitem datele direct din RAM către frontend
const getChartDataFromRAM = (symbol) => {
  return liveHistory[symbol] || [];
};

const startSimulator = async () => {
  console.log("📈 Simulatorul de piață a pornit (Mod RAM activat - 0 stres pe baza de date)");
  
  // Rulăm simularea o dată la 5 secunde
  setInterval(simulateMarket, 5000); 
};

module.exports = { startSimulator, getChartDataFromRAM };