const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://abhiraj:abhiraj2026@chaicode.ukddfcz.mongodb.net/chaiandblog?retryWrites=true&w=majority')
  .then(async () => {
    const blog = await mongoose.connection.db.collection('blogs').findOne({ 
      slug: 'i-thought-tcp-was-always-better-then-i-ran-two-dns-queries-mkse6bwu' 
    });
    
    console.log('=== BLOG CONTENT ===');
    console.log(JSON.stringify(blog.content, null, 2));
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
