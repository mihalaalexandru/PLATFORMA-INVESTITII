const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getWatchlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const watchlist = await prisma.watchlist.findMany({
      where: { userId: parseInt(userId) },
      include: { asset: true }
    });
    res.json(watchlist);
  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
};

const toggleWatchlist = async (req, res) => {
  try {
    const { userId, assetId } = req.body;
    const existing = await prisma.watchlist.findUnique({
      where: { userId_assetId: { userId: parseInt(userId), assetId: parseInt(assetId) } }
    });

    if (existing) {
      await prisma.watchlist.delete({ where: { id: existing.id } });
      return res.json({ added: false });
    } else {
      await prisma.watchlist.create({
        data: { userId: parseInt(userId), assetId: parseInt(assetId) }
      });
      return res.json({ added: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
};

module.exports = { getWatchlist, toggleWatchlist };