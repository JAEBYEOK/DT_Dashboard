const mongoose = require('mongoose');

const {
  syncVissimScenarioCatalog,
  syncComparisonSnapshots,
} = require('../services/vissimScenarioService');

async function main() {
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error('MONGO_URI environment variable is required.');
  }

  await mongoose.connect(mongoURI, { dbName: 'Traffic_DB' });

  const catalog = await syncVissimScenarioCatalog();
  const comparison = await syncComparisonSnapshots();

  console.log('VISSIM sync completed.');
  console.log(JSON.stringify({ catalog, comparison }, null, 2));
}

main()
  .catch((error) => {
    console.error('VISSIM sync failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
