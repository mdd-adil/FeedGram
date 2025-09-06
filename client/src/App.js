import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router";
import './App.css';
import Register from './components/Register';
import Login from './components/Login'
import Profile from "./components/Profile";
import UserProfile from "./components/UserProfile";
import Home from "./components/Home"
import ProtectedRoute from "./components/ProtectedRoute";
import ProfileEdit from "./components/ProfileEdit";
import CreatePost from "./components/CreatePost";
import EditPost from "./components/EditPost";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Chat from "./components/Chat";


function App() {
  return (
   <BrowserRouter>
        <Routes>
          <Route element={<ProtectedRoute/>}>
          <Route path='https://feedgram-frontende.onrender.com/home' element={<Home/>}></Route>
          <Route path='https://feedgram-frontende.onrender.com/profile' element={<Profile />} />
          <Route path='https://feedgram-frontende.onrender.com/user/:userId' element={<UserProfile />} />
          <Route path='https://feedgram-frontende.onrender.com/profile/edit' element={<ProfileEdit />} />
          <Route path='https://feedgram-frontende.onrender.com/createPost' element={<CreatePost />} />
          <Route path='https://feedgram-frontende.onrender.com/editPost/:postId' element={<EditPost />} />
          <Route path="https://feedgram-frontende.onrender.com/chat" element={<Chat />} />
          <Route path="https://feedgram-frontende.onrender.com/chat/:userId" element={<Chat />} />
          <Route path="*" element={<Navigate to="https://feedgram-frontende.onrender.com/home" />} />
          </Route>
          <Route path='https://feedgram-frontende.onrender.com/login' element={<Login />} />
          <Route path='https://feedgram-frontende.onrender.com/signup' element={<Register />} />
          <Route path='https://feedgram-frontende.onrender.com/forgot-password' element={<ForgotPassword />} />
          <Route path='https://feedgram-frontende.onrender.com/reset-password/:token' element={<ResetPassword />} />
          
          
        </Routes>
      </BrowserRouter>
  );
}

export default App;
