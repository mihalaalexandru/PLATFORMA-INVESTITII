const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const depositFunds = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const updatedUser = await prisma.$transaction(async (prisma) => {
      const user = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { balance: { increment: parseFloat(amount) } }
      });
      
      await prisma.balanceHistory.create({
        data: { userId: user.id, balance: user.balance }
      });
      
      return user;
    });

    res.json({ message: 'Deposit successful', newBalance: updatedUser.balance });
  } catch (error) {
    res.status(500).json({ message: 'Error depositing funds' });
  }
};

const buyAsset = async (req, res) => {
  try {
    const { userId, assetId, quantity } = req.body;
    
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    const asset = await prisma.asset.findUnique({ where: { id: parseInt(assetId) } });

    const totalCost = asset.currentPrice * parseFloat(quantity);

    if (user.balance < totalCost) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const newBalance = user.balance - totalCost;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: newBalance }
      }),
      prisma.portfolio.upsert({
        where: { userId_assetId: { userId: user.id, assetId: asset.id } },
        update: { quantity: { increment: parseFloat(quantity) } },
        create: { userId: user.id, assetId: asset.id, quantity: parseFloat(quantity) }
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          assetId: asset.id,
          type: 'BUY',
          quantity: parseFloat(quantity),
          priceAtPurchase: asset.currentPrice
        }
      }),
      prisma.balanceHistory.create({
        data: { userId: user.id, balance: newBalance }
      })
    ]);

    res.json({ message: 'Purchase successful', newBalance });
  } catch (error) {
    res.status(500).json({ message: 'Transaction failed' });
  }
};

const sellAsset = async (req, res) => {
  try {
    const { userId, assetId, quantity } = req.body;
    const sellQty = parseFloat(quantity);

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    const asset = await prisma.asset.findUnique({ where: { id: parseInt(assetId) } });
    const portfolioItem = await prisma.portfolio.findUnique({
      where: { userId_assetId: { userId: user.id, assetId: asset.id } }
    });

    if (!portfolioItem || portfolioItem.quantity < sellQty) {
      return res.status(400).json({ message: 'Insufficient asset quantity to sell' });
    }

    const totalRevenue = asset.currentPrice * sellQty;
    const newBalance = user.balance + totalRevenue;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { balance: newBalance }
      }),
      prisma.portfolio.update({
        where: { id: portfolioItem.id },
        data: { quantity: { decrement: sellQty } }
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          assetId: asset.id,
          type: 'SELL',
          quantity: sellQty,
          priceAtPurchase: asset.currentPrice
        }
      }),
      prisma.balanceHistory.create({
        data: { userId: user.id, balance: newBalance }
      })
    ]);

    res.json({ message: 'Sale successful', newBalance });
  } catch (error) {
    res.status(500).json({ message: 'Transaction failed' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await prisma.transaction.findMany({
      where: { userId: parseInt(userId) },
      include: { asset: true },
      orderBy: { date: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

module.exports = { depositFunds, buyAsset, sellAsset, getTransactions };