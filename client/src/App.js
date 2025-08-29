import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import Register from './components/Register';
import Login from './components/Login'
import Profile from "./components/Profile";
import Home from "./components/Home"
function App() {
  return (
   <BrowserRouter>
        <Routes>
        <Route path='/home' element={<Home/>}></Route>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          
          
        </Routes>
      </BrowserRouter>
  );
}

export default App;
