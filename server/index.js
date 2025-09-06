const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const env=require('dotenv').config();
const cors=require("cors")
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ["GET", "POST"]
  }
});
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
const chatRoute = require('./routes/chatRoute');
const { sendMessage } = require('./controller/chat');
const jwt = require('jsonwebtoken');
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
app.use('/chat', chatRoute);
app.use('/forgot-password', forgotPasswordRoute);
app.use('/reset-password', resetPasswordRoute);

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Authenticate user and store connection
  socket.on('authenticate', (token) => {
    try {
      const decoded = jwt.verify(token, process.env.SECRET);
      socket.userId = decoded.userId;
      connectedUsers.set(decoded.userId, socket.id);
      console.log(`User ${decoded.userId} authenticated and connected`);
      
      // Send authentication success confirmation
      socket.emit('authSuccess', { userId: decoded.userId });
    } catch (error) {
      console.error('Authentication failed:', error);
      socket.emit('authError', 'Authentication failed');
    }
  });

  // Handle joining a chat room
  socket.on('joinChat', (chatId) => {
    if (!socket.userId) {
      socket.emit('authError', 'User not authenticated');
      return;
    }
    socket.join(chatId);
    console.log(`User ${socket.userId} joined chat ${chatId}`);
  });

  // Handle sending messages
  socket.on('sendMessage', async (data) => {
    try {
      const { receiverId, message } = data;
      
      // Check if user is authenticated
      if (!socket.userId) {
        socket.emit('messageError', 'User not authenticated');
        return;
      }
      
      // Save message to database
      const savedMessage = await sendMessage(socket.userId, receiverId, message);
      
      // Create chat room ID (consistent between users)
      const chatId = [socket.userId, receiverId].sort().join('_');
      
      // Emit message to both users in the chat room
      io.to(chatId).emit('newMessage', savedMessage);
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('messageError', 'Failed to send message');
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { receiverId, isTyping } = data;
    const receiverSocketId = connectedUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('userTyping', {
        userId: socket.userId,
        isTyping
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

app.get('/',(req,res)=>{
    res.send("API is running....");
});

server.listen(5000,(err)=>{
    if(err) console.log(err);
    else console.log(`Server is running on port ${PORT} with Socket.io`);
})