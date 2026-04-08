const xlsx = require('xlsx');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const processExcel = (fileName, type) => {
  const filePath = path.join(__dirname, fileName);
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const assets = [];

    data.forEach((row, index) => {
      if (index === 0 && (row[1] === 'Company' || row[0] === '1')) return;

      let name, symbol, price;

      if (type === 'STOCK') {
        name = row[1];
        symbol = row[2];
        price = parseFloat(String(row[4]).replace(/[^0-9.-]+/g, ''));
      } else {
        name = row[1];
        symbol = row[2];
        price = parseFloat(String(row[4]).replace(/[^0-9.-]+/g, ''));
      }

      if (name && symbol && !isNaN(price)) {
        assets.push({
          symbol: String(symbol).trim(),
          name: String(name).trim(),
          type: type,
          currentPrice: price,
          change24h: 0
        });
      }
    });

    return assets;
  } catch (error) {
    console.log(`Eroare la procesarea ${fileName}: ${error.message}`);
    return [];
  }
};

async function seed() {
  console.log('--- Incepem citirea fisierelor Excel (.xlsx) ---');

  const stocks = processExcel('Book1.xlsx', 'STOCK');
  const cryptos = processExcel('Book2.xlsx', 'CRYPTO');
  const allAssets = [...stocks, ...cryptos];

  if (allAssets.length === 0) {
    console.log('Nu am gasit date. Asigura-te ca Book1.xlsx si Book2.xlsx sunt in folderul server.');
    return;
  }

  console.log(`Am gasit ${allAssets.length} active. Curatam baza de date...`);
  await prisma.asset.deleteMany({});

  console.log('Inseram noile date...');
  let count = 0;
  for (const asset of allAssets) {
    try {
      await prisma.asset.create({ data: asset });
      count++;
    } catch (e) {}
  }

  console.log(`--- SUCCES! ${count} active au fost incarcate corect ---`);
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));