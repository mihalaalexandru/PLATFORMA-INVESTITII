const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addFundamentals() {
  console.log('⏳ Generam date fundamentale pentru activele din baza de date...');
  const assets = await prisma.asset.findMany();
  let count = 0;

  for (const asset of assets) {
    const price = asset.currentPrice || 10;
    const isCrypto = asset.type === 'CRYPTO';

    const high52w = price * (1 + (Math.random() * 0.4 + 0.1));
    const low52w = price * (1 - (Math.random() * 0.3 + 0.1));
    const marketCap = price * (Math.random() * 50000000 + 10000000);
    const peRatio = isCrypto ? null : (Math.random() * 20 + 10);
    const dividendYield = isCrypto ? null : (Math.random() * 3 + 0.5);

    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        marketCap: marketCap,
        peRatio: peRatio,
        dividendYield: dividendYield,
        high52w: high52w,
        low52w: low52w
      }
    });
    count++;
  }
  
  console.log(`✅ Date fundamentale adaugate cu succes pentru ${count} active!`);
}

addFundamentals()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());