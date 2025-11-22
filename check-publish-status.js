import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Portfolio from './src/models/Portfolio.js';

dotenv.config();

const portfolioId = '691e821ab4443125952a6616';

async function check() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const p = await Portfolio.findById(portfolioId);
  console.log('Published:', p.isPublished);
  console.log('Owner ID:', p.userId);
  await mongoose.connection.close();
}

check();
