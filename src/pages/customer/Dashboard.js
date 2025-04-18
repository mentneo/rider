import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const CustomerDashboard = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'past'

  useEffect(() => {
    if (currentUser) {
      fetchBookings();
    }
  }, [currentUser]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Query bookings for this customer
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('customerId', '==', currentUser.uid)
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookingsData = [];
      
      // Process each booking
      for (const bookingDoc of bookingsSnapshot.docs) {
        const bookingData = {
          id: bookingDoc.id,
          ...bookingDoc.data()
        };
        
        // Fetch car details if needed
        if (!bookingData.carName && bookingData.carId) {
          const carSnap = await getDoc(doc(db, 'cars', bookingData.carId));
          if (carSnap.exists()) {
            bookingData.carName = carSnap.data().name;
            bookingData.carImage = carSnap.data().imageUrl;
          }
        }
        
        // Fetch driver details if needed
        if (bookingData.bookingType === 'withDriver' && bookingData.driverId) {
          const driverSnap = await getDoc(doc(db, 'users', bookingData.driverId));
          if (driverSnap.exists()) {
            bookingData.driverName = driverSnap.data().name;
            bookingData.driverPhone = driverSnap.data().phone;
          }
        }
        
        bookingsData.push(bookingData);
      }
      
      // Sort bookings by date (newest first)
      bookingsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setBookings(bookingsData);
    } catch (error) {
      toast.error('Error fetching bookings: ' + error.message);
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = () => {
    const today = new Date();
    
    if (activeTab === 'upcoming') {
      return bookings.filter(booking => {
        const pickupDate = new Date(booking.pickupDate);
        return pickupDate >= today && booking.status !== 'completed';
      });
    } else if (activeTab === 'past') {
      return bookings.filter(booking => {
        const pickupDate = new Date(booking.pickupDate);
        return pickupDate < today || booking.status === 'completed';
      });
    }
    
    return bookings;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPaymentStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-2 md:mb-0">My Bookings</h1>
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'all' ? 'bg-primary text-white' : 'text-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'upcoming' ? 'bg-primary text-white' : 'text-gray-600'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'past' ? 'bg-primary text-white' : 'text-gray-600'
            }`}
          >
            Past
          </button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold mb-4">No Bookings Yet</h2>
          <p className="text-gray-600 mb-6">You haven't made any bookings yet. Explore our cars and book your first ride!</p>
          <Link
            to="/cars"
            className="inline-block bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary-dark transition-colors"
          >
            Browse Cars
          </Link>
        </div>
      ) : filteredBookings().length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold mb-4">No {activeTab === 'upcoming' ? 'Upcoming' : 'Past'} Bookings</h2>
          <button
            onClick={() => setActiveTab('all')}
            className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-300 transition-colors"
          >
            View All Bookings
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings().map(booking => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="font-bold">{booking.carName || 'Car'}</h2>
                  <p className="text-sm text-gray-500">Booking #{booking.id.substring(0, 8)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                    {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadgeClass(booking.paymentStatus)}`}>
                    {booking.paymentStatus === 'paid' ? 'Paid' : 'Pending Payment'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{new Date(booking.pickupDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{booking.pickupTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">From</p>
                    <p className="font-medium">{booking.pickupLocation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">To</p>
                    <p className="font-medium">{booking.dropLocation}</p>
                  </div>
                </div>
                
                {booking.bookingType === 'withDriver' && booking.driverName && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-500 mb-1">Assigned Driver</p>
                    <p className="font-medium">{booking.driverName}</p>
                    {booking.driverPhone && <p className="text-sm">{booking.driverPhone}</p>}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-gray-500 text-sm">Total Amount</p>
                    <p className="font-bold text-lg">${booking.totalAmount?.toFixed(2)}</p>
                  </div>
                  
                  <Link
                    to={`/booking/${booking.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
