import mongoose from 'mongoose';
import CaseStudy from '../src/models/CaseStudy.js';

mongoose.connect('mongodb://localhost:27017/aurea-portfolio')
  .then(async () => {
    console.log('Connected to database\n');
    
    const cs = await CaseStudy.findOne({ projectId: '1' });
    
    if (cs) {
      console.log('Case Study Object Structure for projectId "1":');
      console.log(JSON.stringify(cs.toObject(), null, 2));
      console.log('\n=== Keys at root level ===');
      console.log(Object.keys(cs.toObject()));
    } else {
      console.log('No case study found with projectId "1"');
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.connection.close();
  });
