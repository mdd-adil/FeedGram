"# FeedGram 📱

A modern social media platform built with React.js and Node.js, featuring real-time messaging, post sharing, and privacy controls.

![FeedGram Banner](https://via.placeholder.com/800x200/667eea/ffffff?text=FeedGram+-+Social+Media+Platform)

## ✨ Features

### 🔐 Authentication & Security
- **User Registration & Login** with JWT authentication
- **Password Reset** via email with secure tokens
- **Protected Routes** for authenticated users only
- **Private Account** support with follow request system

### 📝 Post Management
- **Create Posts** with image uploads
- **Edit & Delete** your own posts
- **Like/Unlike** posts with real-time updates
- **Post Feed** with chronological timeline
- **Image Upload** with automatic optimization

### 👥 Social Features
- **Follow/Unfollow** users
- **Private Accounts** with follow request approval
- **Followers & Following** lists
- **User Profiles** with post history
- **User Search** functionality

### 💬 Real-time Messaging
- **Direct Messages** between users
- **Real-time Chat** with Socket.io
- **Typing Indicators** for active conversations
- **Message History** persistence
- **Chat List** with latest message preview
- **Privacy Controls** - only chat with followers or existing conversations

### 🎨 Modern UI/UX
- **Responsive Design** with Bootstrap
- **Modern Interface** with gradient themes
- **Avatar System** with Dicebear integration
- **Notifications** for user actions
- **Loading States** and error handling

## 🛠️ Tech Stack

### Frontend
- **React.js** (v19.1.1) - UI Framework
- **React Router** (v7.8.2) - Client-side routing
- **React Bootstrap** (v2.10.10) - UI Components
- **Socket.io Client** (v4.8.1) - Real-time communication
- **Axios** (v1.11.0) - HTTP requests

### Backend
- **Node.js** - Runtime environment
- **Express.js** (v5.1.0) - Web framework
- **MongoDB** with **Mongoose** (v8.18.0) - Database
- **Socket.io** (v4.8.1) - Real-time server
- **JWT** (v9.0.2) - Authentication
- **Bcrypt** (v6.0.0) - Password hashing
- **Multer** (v2.0.2) - File uploads
- **Nodemailer** (v7.0.6) - Email service

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mdd-adil/FeedGram.git
   cd FeedGram
   ```

2. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the `server` directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/feedgram
   
   # JWT Secret
   JWT_SECRET=your_super_secret_jwt_key_here
   
   # Email Configuration (for password reset)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

6. **Run the Application**
   
   **Backend (Terminal 1):**
   ```bash
   cd server
   npm run dev
   ```
   
   **Frontend (Terminal 2):**
   ```bash
   cd client
   npm start
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
FeedGram/
├── client/                     # React.js Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # React Components
│   │   │   ├── Chat.jsx       # Real-time messaging
│   │   │   ├── Home.jsx       # Main feed
│   │   │   ├── Login.jsx      # Authentication
│   │   │   ├── Register.jsx   # User registration
│   │   │   ├── Profile.jsx    # User profile
│   │   │   ├── CreatePost.jsx # Post creation
│   │   │   └── ...
│   │   ├── App.js             # Main App component
│   │   └── index.js           # Entry point
│   └── package.json
├── server/                     # Node.js Backend
│   ├── controller/             # Route handlers
│   │   ├── chat.js            # Chat functionality
│   │   ├── login.js           # Authentication
│   │   ├── follow.js          # Follow system
│   │   └── ...
│   ├── models/                 # MongoDB schemas
│   │   ├── userModel.js       # User schema
│   │   ├── postModel.js       # Post schema
│   │   └── messageModel.js    # Message schema
│   ├── routes/                 # API routes
│   ├── middleware/             # Custom middleware
│   ├── config/                 # Configuration files
│   ├── index.js               # Server entry point
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token

### Posts
- `GET /home` - Get timeline posts
- `POST /create-post` - Create new post
- `PUT /update-post/:id` - Update post
- `DELETE /delete-post/:id` - Delete post
- `POST /like/:id` - Like post
- `POST /unlike/:id` - Unlike post

### Users
- `GET /profile` - Get own profile
- `GET /user-profile/:id` - Get user profile
- `PUT /update-profile` - Update profile
- `GET /search` - Search users

### Follow System
- `POST /follow/follow/:id` - Follow user
- `DELETE /follow/unfollow/:id` - Unfollow user
- `GET /follow/followers/:id` - Get followers
- `GET /follow/following/:id` - Get following
- `POST /follow/accept/:id` - Accept follow request
- `DELETE /follow/reject/:id` - Reject follow request

### Messaging
- `GET /chat/users` - Get chat users
- `GET /chat/history/:id` - Get chat history
- `POST /chat/send` - Send message

## 🎯 Key Features Explained

### Real-time Messaging
- Built with Socket.io for instant communication
- Typing indicators show when users are typing
- Message persistence in MongoDB
- Privacy controls limit chats to followers

### Privacy System
- Private accounts require follow approval
- Follow requests system with accept/reject
- Content visibility based on follow status
- Secure API endpoints with proper authorization

### Performance Optimizations
- Database indexing for faster queries
- React hooks optimization (useCallback, useMemo)
- Aggregation pipelines for complex queries
- Memoized components to prevent re-renders

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** with bcrypt
- **Input Validation** and sanitization
- **Protected Routes** on both client and server
- **CORS Configuration** for cross-origin requests
- **Rate Limiting** (recommended for production)

## 🚀 Deployment

### Frontend (Netlify/Vercel)
1. Build the React app: `npm run build`
2. Deploy the `build` folder to your hosting service
3. Configure environment variables

### Backend (Heroku/Railway)
1. Set up environment variables on your hosting platform
2. Configure MongoDB connection (MongoDB Atlas recommended)
3. Deploy the `server` directory

### Environment Variables for Production
```env
MONGODB_URI=your_production_mongodb_url
JWT_SECRET=your_super_secure_jwt_secret
EMAIL_USER=your_production_email
EMAIL_PASS=your_production_email_password
NODE_ENV=production
PORT=5000
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Adil** - [mdd-adil](https://github.com/mdd-adil)

## 🙏 Acknowledgments

- React.js community for excellent documentation
- Socket.io for real-time capabilities
- MongoDB for flexible data storage
- Bootstrap for responsive design components

## 📞 Support

If you have any questions or need help with setup, please open an issue in the GitHub repository.

---

⭐ **Star this repository if you found it helpful!**" 
