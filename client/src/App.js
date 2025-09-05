import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router";
import './App.css';
import Register from './components/Register';
import Login from './components/Login'
import Profile from "./components/Profile";
import Home from "./components/Home"
import ProtectedRoute from "./components/ProtectedRoute";
import ProfileEdit from "./components/ProfileEdit";
import CreatePost from "./components/CreatePost";
import EditPost from "./components/EditPost";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
function App() {
  return (
   <BrowserRouter>
        <Routes>
          <Route element={<ProtectedRoute/>}>
        <Route path='/home' element={<Home/>}></Route>
          <Route path='/profile' element={<Profile />} />
          <Route path='/profile/edit' element={<ProfileEdit />} />
          <Route path='/createPost' element={<CreatePost />} />
          <Route path='/editPost/:postId' element={<EditPost />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Register />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/reset-password/:token' element={<ResetPassword />} />
          
          
        </Routes>
      </BrowserRouter>
  );
}

export default App;
