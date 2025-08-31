import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router";
import './App.css';
import Register from './components/Register';
import Login from './components/Login'
import Profile from "./components/Profile";
import Home from "./components/Home"
import ProtectedRoute from "./components/ProtectedRoute";
function App() {
  return (
   <BrowserRouter>
        <Routes>
          <Route element={<ProtectedRoute/>}>
        <Route path='/home' element={<Home/>}></Route>
          <Route path='/profile' element={<Profile />} />
          {/* <Route path='/' element={<Login/>}></Route> */}
          </Route>
          <Route path="*" element={<Navigate to="/login" />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Register />} />
          
          
        </Routes>
      </BrowserRouter>
  );
}

export default App;
