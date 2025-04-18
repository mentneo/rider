import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const DriverDashboard = () => {
  const { currentUser } = useAuth();
  const [activeRides, setActiveRides] = useState([]);
  const [completedRides, setCompletedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    active: 0,
    earnings: 0
  });

  useEffect(() => {
    if (currentUser) {
      fetchDriverRides();
    }
  }, [currentUser]);

  const fetchDriverRides = async () => {
    try {
      setLoading(true);
      
      // Query bookings assigned to this driver
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('driverId', '==', currentUser.uid)
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookingsData = [];
      
      let completedCount = 0;
      let activeCount = 0;
      let totalEarnings = 0;
      
      // Process each booking
      for (const bookingDoc of bookingsSnapshot.docs) {
        const bookingData = {
          id: bookingDoc.id,
          ...bookingDoc.data()
        };
        
        // Fetch customer details
        if (bookingData.customerId) {
          const customerSnap = await getDoc(doc(db, 'users', bookingData.customerId));
          if (customerSnap.exists()) {
            bookingData.customerName = customerSnap.data().name;
            bookingData.customerPhone = customerSnap.data().phone;
          }
        }
        
        // Fetch car details
        if (bookingData.carId) {
          const carSnap = await getDoc(doc(db, 'cars', bookingData.carId));
          if (carSnap.exists()) {
            bookingData.carName = carSnap.data().name;
            bookingData.carImage = carSnap.data().imageUrl;
          }
        }
        
        bookingsData.push(bookingData);
        
        // Update statistics
        if (bookingData.status === 'completed') {
          completedCount++;
          totalEarnings += bookingData.totalAmount || 0;
        } else if (bookingData.status === 'active' || bookingData.status === 'assigned') {
          activeCount++;
        }
      }
      
      // Set statistics
      setStats({
        total: bookingsData.length,
        completed: completedCount,
        active: activeCount,
        earnings: totalEarnings
      });
      
      // Split bookings by status
      setActiveRides(bookingsData.filter(booking => 
        booking.status === 'active' || booking.status === 'assigned'
      ));
      
      setCompletedRides(bookingsData.filter(booking => 
        booking.status === 'completed'
      ));
      
    } catch (error) {
      toast.error('Error fetching rides: ' + error.message);
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRide = async (bookingId) => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      
      toast.success('Ride marked as completed successfully!');
      fetchDriverRides();
    } catch (error) {
      toast.error('Error completing ride: ' + error.message);
      console.error('Error completing ride:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCashCollected = async (bookingId) => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'bookings', bookingId), {
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        paidAt: new Date().toISOString()
      });
      
      toast.success('Payment marked as collected successfully!');
      fetchDriverRides();
    } catch (error) {
      toast.error('Error updating payment status: ' + error.message);
      console.error('Error updating payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async (bookingId, rating, comment) => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'bookings', bookingId), {
        driverReview: {
          rating,
          comment,
          createdAt: new Date().toISOString()
        }
      });
      
      toast.success('Review added successfully!');
      fetchDriverRides();
    } catch (error) {
      toast.error('Error adding review: ' + error.message);
      console.error('Error adding review:', error);
    } finally {
      setLoading(false);
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
      <h1 className="text-2xl font-bold mb-6">Driver Dashboard</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500 font-medium">Total Rides</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500 font-medium">Active Rides</div>
          <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500 font-medium">Completed Rides</div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500 font-medium">Total Earnings</div>
          <div className="text-2xl font-bold text-primary">${stats.earnings.toFixed(2)}</div>
        </div>
      </div>
      
      {/* Active Rides */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Active Rides</h2>
        {activeRides.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-500">No active rides at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeRides.map(ride => (
              <div key={ride.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex items-center">
                    {ride.carImage && (
                      <img src={ride.carImage} alt={ride.carName} className="w-16 h-12 object-cover rounded mr-3" />
                    )}
                    <div>
                      <h3 className="font-bold">{ride.carName || 'Car'}</h3>
                      <p className="text-sm text-gray-500">Booking #{ride.id.substring(0, 8)}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">{ride.customerName || 'Customer'}</p>
                    {ride.customerPhone && <p className="text-sm">{ride.customerPhone}</p>}
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Locations</p>
                    <p className="font-medium">From: {ride.pickupLocation}</p>
                    <p className="font-medium">To: {ride.dropLocation}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Schedule</p>
                    <p className="font-medium">
                      {new Date(ride.pickupDate).toLocaleDateString()} at {ride.pickupTime}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Payment</p>
                    <p className="font-medium">
                      ${ride.totalAmount} ({ride.paymentMethod === 'online' ? 'Online' : 'Cash'})
                      {ride.paymentStatus === 'paid' ? (
                        <span className="ml-2 text-green-600">Paid</span>
                      ) : (
                        <span className="ml-2 text-orange-600">Pending</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => handleCompleteRide(ride.id)}
                      className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700"
                    >
                      Complete Ride
                    </button>
                    
                    {ride.paymentMethod === 'cash' && ride.paymentStatus !== 'paid' && (
                      <button
                        onClick={() => handleCashCollected(ride.id)}
                        className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700"
                      >
                        Mark Cash Collected
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Completed Rides */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Completed Rides</h2>
        {completedRides.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-500">No completed rides yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trip Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {completedRides.map(ride => (
                  <tr key={ride.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {ride.carImage && (
                          <img src={ride.carImage} alt={ride.carName} className="w-10 h-10 object-cover rounded-full mr-3" />
                        )}
                        <div>
                          <div className="font-medium">{ride.carName || 'Car'}</div>
                          <div className="text-sm text-gray-500">#{ride.id.substring(0, 8)}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(ride.completedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{ride.customerName || 'Customer'}</div>
                      {ride.customerPhone && <div className="text-sm text-gray-500">{ride.customerPhone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">From: {ride.pickupLocation}</div>
                      <div className="text-sm">To: {ride.dropLocation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">${ride.totalAmount}</div>
                      <div className="text-sm text-gray-500">
                        {ride.paymentMethod === 'online' ? 'Online' : 'Cash'}
                      </div>
                      <div className={`text-sm ${ride.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                        {ride.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ride.driverReview ? (
                        <div>
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <span key={i}>{i < ride.driverReview.rating ? '★' : '☆'}</span>
                            ))}
                          </div>
                          <div className="text-sm text-gray-500">{ride.driverReview.comment}</div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            const rating = prompt('Rate this ride (1-5)');
                            if (rating && !isNaN(rating) && rating >= 1 && rating <= 5) {
                              const comment = prompt('Add a comment (optional)');
                              handleAddReview(ride.id, parseInt(rating), comment || '');
                            } else if (rating) {
                              alert('Please enter a valid rating between 1 and 5');
                            }
                          }}
                          className="text-primary hover:text-primary-dark text-sm font-medium"
                        >
                          Add Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
