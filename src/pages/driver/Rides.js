import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const DriverRides = () => {
  const { currentUser } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, active, completed
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchDriverRides();
    }
  }, [currentUser]);

  const fetchDriverRides = async () => {
    try {
      setLoading(true);
      
      // Create query for rides assigned to this driver
      const ridesQuery = query(
        collection(db, 'bookings'),
        where('driverId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const ridesSnapshot = await getDocs(ridesQuery);
      const ridesData = ridesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRides(ridesData);
    } catch (error) {
      toast.error('Error fetching rides: ' + error.message);
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRides = () => {
    return rides.filter(ride => {
      // Filter by status
      if (activeTab === 'active' && ride.status !== 'active' && ride.status !== 'assigned') {
        return false;
      }
      if (activeTab === 'completed' && ride.status !== 'completed') {
        return false;
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          ride.id.toLowerCase().includes(searchLower) ||
          (ride.customerName && ride.customerName.toLowerCase().includes(searchLower)) ||
          (ride.pickupLocation && ride.pickupLocation.toLowerCase().includes(searchLower)) ||
          (ride.dropLocation && ride.dropLocation.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
  };

  const getStatusBadge = (status) => {
    let statusClass = '';
    
    switch (status) {
      case 'assigned':
        statusClass = 'bg-blue-100 text-blue-800';
        break;
      case 'active':
        statusClass = 'bg-blue-100 text-blue-800';
        break;
      case 'completed':
        statusClass = 'bg-green-100 text-green-800';
        break;
      case 'cancelled':
        statusClass = 'bg-red-100 text-red-800';
        break;
      default:
        statusClass = 'bg-gray-100 text-gray-800';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusClass = status === 'paid' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
        {status === 'paid' ? 'Paid' : 'Pending'}
      </span>
    );
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
      <h1 className="text-2xl font-bold mb-6">My Rides</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm ${
                activeTab === 'all' ? 'bg-primary text-white' : 'text-gray-600'
              }`}
            >
              All Rides
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-md text-sm ${
                activeTab === 'active' ? 'bg-primary text-white' : 'text-gray-600'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-md text-sm ${
                activeTab === 'completed' ? 'bg-primary text-white' : 'text-gray-600'
              }`}
            >
              Completed
            </button>
          </div>
          
          <div className="w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rides..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>
      
      {/* Rides List */}
      {rides.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold mb-4">No Rides Found</h2>
          <p className="text-gray-600">You haven't been assigned any rides yet.</p>
        </div>
      ) : getFilteredRides().length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold mb-4">No Rides Match Your Filters</h2>
          <button
            onClick={() => {
              setActiveTab('all');
              setSearchTerm('');
            }}
            className="mt-2 text-primary hover:text-primary-dark"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trip Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredRides().map(ride => (
                  <tr key={ride.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{ride.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ride.customerName}</div>
                      {ride.customerPhone && (
                        <div className="text-sm text-gray-500">{ride.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="mb-1">From: {ride.pickupLocation}</div>
                        <div>To: {ride.dropLocation}</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {ride.estimatedDistance && `${ride.estimatedDistance} km`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(ride.pickupDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">{ride.pickupTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ride.status)}
                      {ride.status === 'completed' && ride.completedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Completed on {new Date(ride.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          ${ride.totalAmount?.toFixed(2)}
                        </div>
                        <div className="ml-2">
                          {getPaymentStatusBadge(ride.paymentStatus)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {ride.paymentMethod === 'online' ? 'Online' : 'Cash'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverRides;
