import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function testConnection() {
  try {
    console.log('🔗 Testing MongoDB connection...');
    console.log('URI:', process.env.MONGO_URI.replace(/:([^:@]{3})[^:@]*@/, ':$1***@')); // Hide password in logs
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ SUCCESS: MongoDB connection works!');
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = await TestModel.create({ test: 'Hello from AUREA!' });
    console.log('✅ SUCCESS: Can write to database!', testDoc._id);
    
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ SUCCESS: Can delete from database!');
    
    await mongoose.connection.close();
    console.log('🔒 Connection closed successfully');
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
    
    if (error.message.includes('bad auth')) {
      console.error('\n💡 Authentication failed. Check:');
      console.error('   1. Username and password are correct');
      console.error('   2. User exists in MongoDB Atlas');
      console.error('   3. User has proper permissions');
      console.error('   4. Database name is correct');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('\n💡 DNS/Network issue. Check:');
      console.error('   1. Internet connection');
      console.error('   2. MongoDB Atlas cluster is running');
      console.error('   3. Network access (IP whitelist)');
    }
    
    process.exit(1);
  }
}

testConnection();
