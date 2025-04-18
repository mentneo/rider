import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

const DriverLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if user is logged in AND has driver role
    if (currentUser && userRole === 'driver') {
      navigate('/driver/dashboard');
    } else if (currentUser && userRole !== 'driver') {
      // If user is logged in but NOT a driver, show error and redirect to appropriate dashboard
      toast.error('Access denied. This portal is for drivers only.');
      
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [currentUser, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill all fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if the email belongs to a driver account
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), where('role', '==', 'driver'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('Access denied. This portal is for drivers only.');
        setLoading(false);
        return;
      }
      
      // Proceed with login
      await login(email, password);
      
      // No need to navigate here, the useEffect will handle it when userRole is updated
    } catch (error) {
      let errorMessage = 'Failed to login.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Driver Portal Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your driver account and manage your rides
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Driver Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {loading ? 'Signing in...' : 'Sign in to Driver Portal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverLoginPage;
