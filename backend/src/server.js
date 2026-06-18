const { appEnv, gameId, port } = require('./config/env');
const app = require('./app');
const { connectToDatabase } = require('./db/connect');

async function start() {
  await connectToDatabase();

  app.listen(port, () => {
    console.log(`21 Stackem backend listening on port ${port}`);
    console.log(`APP_ENV=${appEnv} GAME_ID=${gameId}`);
  });
}

if (require.main === module) {
  start().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = start;
