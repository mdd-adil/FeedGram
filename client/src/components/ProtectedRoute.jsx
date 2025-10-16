import React from 'react'
import { Navigate, Outlet } from 'react-router';
import { isTokenValid } from '../utils/auth';

export default function ProtectedRoute() {
    const loggedIn = isTokenValid();
    return loggedIn ? <Outlet /> : <Navigate to='/login' />
}
