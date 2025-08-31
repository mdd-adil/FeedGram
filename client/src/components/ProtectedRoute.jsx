import React from 'react'
import { Navigate, Outlet } from 'react-router';

export default function ProtectedRoute() {
    const loggedIn=localStorage.getItem("token");
  return loggedIn?<Outlet/>:<Navigate to='/login'/>
    
  
}
