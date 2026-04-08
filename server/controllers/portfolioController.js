const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getPortfolio = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const portfolio = await prisma.portfolio.findMany({
      where: { 
        userId: parseInt(userId),
        quantity: { gt: 0 }
      },
      include: { 
        asset: true 
      }
    });

    const transactions = await prisma.transaction.findMany({
      where: { 
        userId: parseInt(userId),
        type: 'BUY'
      }
    });

    const enrichedPortfolio = portfolio.map(item => {
      const assetTransactions = transactions.filter(t => t.assetId === item.assetId);
      
      let totalCost = 0;
      let totalQuantity = 0;

      assetTransactions.forEach(t => {
        totalCost += t.priceAtPurchase * t.quantity;
        totalQuantity += t.quantity;
      });

      const avgBuyPrice = totalQuantity > 0 ? totalCost / totalQuantity : item.asset.currentPrice;
      const currentValue = item.quantity * item.asset.currentPrice;
      const investedValue = item.quantity * avgBuyPrice;
      const profitLoss = currentValue - investedValue;
      const profitLossPercentage = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

      return {
        ...item,
        avgBuyPrice,
        currentValue,
        profitLoss,
        profitLossPercentage
      };
    });

    res.json(enrichedPortfolio);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching portfolio' });
  }
};

const getBalanceHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const history = await prisma.balanceHistory.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { date: 'asc' }
    });

    if (history.length === 0) {
      const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
      return res.json([{ 
        name: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
        value: user.balance 
      }]);
    }

    const formattedHistory = history.map(record => ({
      name: new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: parseFloat(record.balance.toFixed(2))
    }));

    res.json(formattedHistory);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching balance history' });
  }
};

module.exports = { getPortfolio, getBalanceHistory };