import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Ensure the database name is included in the URI
    let mongoURI = process.env.MONGO_URI;
    
    // If the URI doesn't include the database name, add it
    if (!mongoURI.includes('/aurea?')) {
      mongoURI = mongoURI.replace('/?retryWrites', '/aurea?retryWrites');
    }
    
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    const conn = await mongoose.connect(mongoURI, {
      // Remove deprecated options for newer mongoose versions
      // maxPoolSize: 10,
      // serverSelectionTimeoutMS: 5000,
      // socketTimeoutMS: 45000,
      // bufferCommands: false,
      // bufferMaxEntries: 0
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Test the connection with a ping
    await mongoose.connection.db.admin().ping();
    console.log("🏓 Pinged your deployment. You successfully connected to MongoDB!");
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful exit
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔒 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during MongoDB disconnection:', err);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    
    // More detailed error information
    if (error.name === 'MongoServerSelectionError') {
      console.error('💡 Possible causes:');
      console.error('   - Check your MongoDB Atlas IP whitelist');
      console.error('   - Verify your database credentials');
      console.error('   - Ensure your cluster is running');
    }
    
    process.exit(1);
  }
};

export default connectDB;
