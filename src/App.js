import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { initializeFirestore } from './utils/initFirestore';
import { setupAdminAccount } from './utils/adminSetup';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRedirect from './components/auth/RoleRedirect';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Navbar from './components/Navigation/Navbar';
import Footer from './components/Navigation/Footer';
import NotificationComponent from './components/Notifications/NotificationComponent';

// Pages - Public
import HomePage from './pages/HomePage';
import CarsPage from './pages/CarsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import DriverLoginPage from './pages/auth/DriverLoginPage';

// Pages - Protected (Customer)
import CustomerDashboard from './pages/customer/Dashboard';
import BookingPage from './pages/customer/BookingPage';
import BookingDetailsPage from './pages/customer/BookingDetailsPage';
import PaymentPage from './pages/customer/PaymentPage';

// Pages - Protected (Admin)
import AdminDashboard from './pages/admin/Dashboard';
import AdminCars from './pages/admin/Cars';
import AdminDrivers from './pages/admin/Drivers';
import AdminBookings from './pages/admin/Bookings';
import AdminPayments from './pages/admin/Payments';

// Pages - Protected (Driver)
import DriverDashboard from './pages/driver/Dashboard';
import DriverRides from './pages/driver/Rides';
import DriverProfile from './pages/driver/Profile';

// Admin route wrapper that strictly checks for admin role
const AdminRoute = ({ children }) => {
  const { currentUser, userRole, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }
  
  // Only admin can access these routes, redirect others to login
  if (!currentUser || userRole !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

const App = () => {
  const [initAttempted, setInitAttempted] = useState(false);

  useEffect(() => {
    // Only try initialization once
    if (!initAttempted) {
      setInitAttempted(true);
      
      // Use a timeout to not block rendering
      setTimeout(() => {
        // Handle admin setup and data initialization
        // We use catch blocks to ensure the app continues even if initialization fails
        setupAdminAccount().catch(error => 
          console.log('Admin setup error (non-critical):', error)
        );
        
        initializeFirestore().catch(error => 
          console.log('Firestore init error (non-critical):', error)
        );
      }, 2000);
    }
  }, [initAttempted]);

  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <NotificationComponent />
        <main className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/cars" element={<CarsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/driver/login" element={<DriverLoginPage />} />
            
            {/* Role-based redirect */}
            <Route path="/redirect" element={<RoleRedirect />} />
            
            {/* Customer Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/book/:carId" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <BookingPage />
              </ProtectedRoute>
            } />
            <Route path="/booking/:bookingId" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <BookingDetailsPage />
              </ProtectedRoute>
            } />
            <Route path="/payment/:bookingId" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <PaymentPage />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/cars" element={
              <AdminRoute>
                <AdminCars />
              </AdminRoute>
            } />
            <Route path="/admin/drivers" element={
              <AdminRoute>
                <AdminDrivers />
              </AdminRoute>
            } />
            <Route path="/admin/bookings" element={
              <AdminRoute>
                <AdminBookings />
              </AdminRoute>
            } />
            <Route path="/admin/payments" element={
              <AdminRoute>
                <AdminPayments />
              </AdminRoute>
            } />
            
            {/* Driver Routes */}
            <Route path="/driver/dashboard" element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverDashboard />
              </ProtectedRoute>
            } />
            <Route path="/driver/rides" element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverRides />
              </ProtectedRoute>
            } />
            <Route path="/driver/profile" element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverProfile />
              </ProtectedRoute>
            } />
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
        <ToastContainer position="top-right" autoClose={5000} />
      </AuthProvider>
    </Router>
  );
};

export default App;
