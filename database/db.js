const mongoose=require('mongoose');

const connectToDB=async ()=>{
    try {

        await mongoose.connect(process.env.MONGO_URI);
        console.log('mongodb connected successfully!');
        
        
    } catch (e) {
        console.error('Mongodb connection failed');
        process.exit(1)
        
        
    }
}

module.exports=connectToDB;