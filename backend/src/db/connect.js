const mongoose = require('mongoose');

const { mongoDbUri } = require('../config/env');

let connected = false;

async function connectToDatabase() {
  if (connected) {
    return mongoose.connection;
  }

  await mongoose.connect(mongoDbUri);
  connected = true;
  return mongoose.connection;
}

module.exports = {
  connectToDatabase,
};
