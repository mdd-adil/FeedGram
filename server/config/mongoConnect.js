const mongoose = require('mongoose');
const env=require('dotenv').config();
const mongoDb=mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    console.log("Database connected successfully");
}).catch((err)=>{
    console.log(err.message);  
    process.exit(1);
});
module.exports=mongoDb