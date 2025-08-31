const express = require('express');
const env=require('dotenv').config();
const cors=require("cors")
const app = express();
const mongoDb=require('./config/mongoConnect');
const loginRoute=require('./routes/loginRoute');
const registerRoute=require('./routes/regisrterRoute');
const logoutRoute=require('./routes/logoutRoute');
const createPostRoute=require('./routes/createPostRoute');
const cookieParser = require('cookie-parser');
const isLoggedIn = require('./middleware/isLoggedIn');
const bodyParser=require("body-parser")
const homeRoute=require("./routes/homeRoute")
const profileRuote=require("./routes/profileRoute")
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cookieParser())
app.use(cors())
app.use(bodyParser.json())








app.use('/login',loginRoute);
app.use('/register',registerRoute);
app.use('/createPost',createPostRoute);
app.use('/home',homeRoute)
app.use('/profile',profileRuote)
app.get('/',(req,res)=>{
    res.send("API is running....");
});

app.listen(5000,(err)=>{
    if(err) console.log(err);
    else console.log(`Server is running on port ${PORT}`);
})