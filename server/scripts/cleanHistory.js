const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// script rulat manual/periodic pentru a sterge inregistrarile vechi de istoric de pret
// (evita cresterea nelimitata a bazei de date)
async function cleanOldHistory() {
  console.log('Incepem curatenia in baza de date...');
  
  const limitDate = new Date();
  limitDate.setHours(limitDate.getHours() - 24);

  try {
    // stergem toate inregistrarile mai vechi de 24 de ore
    const result = await prisma.priceHistory.deleteMany({
      where: {
        createdAt: {
          lt: limitDate
        }
      }
    });
    
    console.log(`SUCCES: Am sters ${result.count} inregistrari inutile!`);
    console.log('Aplicatia ta ar trebui sa se miste instantaneu acum.');
  } catch (error) {
    console.error('Eroare la stergere:', error.message);
  }
}

cleanOldHistory()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));