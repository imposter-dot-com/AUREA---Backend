import mongoose from 'mongoose';
import logger from '../infrastructure/logging/Logger.js';

const connectDB = async () => {
  try {
    // Read directly from process.env to avoid circular dependency
    // Config module is imported too early in server.js before dotenv runs
    let mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error('MONGO_URI environment variable is not set. Please check your .env file.');
    }

    // If the URI doesn't include the database name, add it
    if (!mongoURI.includes('/aurea?')) {
      mongoURI = mongoURI.replace('/?retryWrites', '/aurea?retryWrites');
    }
    
    logger.info('Connecting to MongoDB Atlas...');

    const conn = await mongoose.connect(mongoURI, {
      // Remove deprecated options for newer mongoose versions
      // maxPoolSize: 10,
      // serverSelectionTimeoutMS: 5000,
      // socketTimeoutMS: 45000,
      // bufferCommands: false,
      // bufferMaxEntries: 0
    });

    logger.info('MongoDB Connected', { host: conn.connection.host });
    logger.info('Database', { name: conn.connection.name });

    // Test the connection with a ping
    await mongoose.connection.db.admin().ping();
    logger.info('Pinged MongoDB deployment - successfully connected');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful exit
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error during MongoDB disconnection', { error: err });
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    // Log full error details for debugging
    console.error('❌ MongoDB Connection Error Details:');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Full error:', error);

    logger.error('Error connecting to MongoDB', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // More detailed error information
    if (error.name === 'MongoServerSelectionError') {
      logger.error('MongoDB connection failed - Possible causes:', {
        causes: [
          'Check your MongoDB Atlas IP whitelist',
          'Verify your database credentials',
          'Ensure your cluster is running'
        ]
      });
    }

    process.exit(1);
  }
};

export default connectDB;
