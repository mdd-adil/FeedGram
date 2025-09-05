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
const bodyParser=require("body-parser")
const homeRoute=require("./routes/homeRoute")
const profileRoute=require("./routes/profileRoute");
const updateProfileRoute=require("./routes/updateProfileRoute");
const unlikeRoute = require('./routes/unlikeRoute');
const likeRoute = require('./routes/likeRoute');
const deletePostRoute = require('./routes/deletePostRoute');
const forgotPasswordRoute = require('./routes/forgotPasswordRoute');
const resetPasswordRoute = require('./routes/resetPasswordRoute');
const updatePostRoute = require('./routes/updatePostRoute');
const PORT = process.env.PORT || 5000;




//Some middlewares
app.use(express.json());
app.use(cookieParser())
app.use(bodyParser.json())
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
};
app.use(cors(corsOptions));







app.use('/login',loginRoute);
app.use('/register',registerRoute);
app.use('/logout',logoutRoute);
app.use('/home',homeRoute);
app.use('/profile',profileRoute);
app.use('/updateProfile',updateProfileRoute);
app.use('/createPost',createPostRoute);
app.use('/like', likeRoute);
app.use('/unlike', unlikeRoute);
app.use('/deletePost', deletePostRoute);
app.use('/updatePost', updatePostRoute);
app.use('/forgot-password', forgotPasswordRoute);
app.use('/reset-password', resetPasswordRoute);

app.get('/',(req,res)=>{
    res.send("API is running....");
});

app.listen(5000,(err)=>{
    if(err) console.log(err);
    else console.log(`Server is running on port ${PORT}`);
})