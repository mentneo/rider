import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { toast } from 'react-toastify';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalCars: 0,
    availableCars: 0,
    totalDrivers: 0,
    availableDrivers: 0,
    totalRevenue: 0,
    onlinePayments: 0,
    cashPayments: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [chartData, setChartData] = useState({
    bookingStatus: {
      labels: ['Active', 'Completed', 'Cancelled'],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: ['#4F46E5', '#10B981', '#EF4444'],
        },
      ],
    },
    paymentMethod: {
      labels: ['Online', 'Cash'],
      datasets: [
        {
          data: [0, 0],
          backgroundColor: ['#4F46E5', '#F59E0B'],
        },
      ],
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch cars
      const carsSnapshot = await getDocs(collection(db, 'cars'));
      const carsData = carsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch drivers
      const driversQuery = query(
        collection(db, 'users'),
        where('role', '==', 'driver')
      );
      const driversSnapshot = await getDocs(driversQuery);
      const driversData = driversSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate statistics
      const activeBookings = bookingsData.filter(booking => 
        booking.status === 'active' || booking.status === 'assigned' || booking.status === 'confirmed'
      );
      const completedBookings = bookingsData.filter(booking => booking.status === 'completed');
      const cancelledBookings = bookingsData.filter(booking => booking.status === 'cancelled');
      
      const availableCars = carsData.filter(car => car.isAvailable);
      const availableDrivers = driversData.filter(driver => driver.isAvailable);
      
      const onlinePayments = bookingsData.filter(booking => 
        booking.paymentMethod === 'online' && booking.paymentStatus === 'paid'
      );
      const cashPayments = bookingsData.filter(booking => 
        booking.paymentMethod === 'cash' && booking.paymentStatus === 'paid'
      );
      
      let totalRevenue = 0;
      let onlineRevenue = 0;
      let cashRevenue = 0;
      
      bookingsData.forEach(booking => {
        if (booking.status === 'completed' && booking.paymentStatus === 'paid') {
          totalRevenue += booking.totalAmount || 0;
          
          if (booking.paymentMethod === 'online') {
            onlineRevenue += booking.totalAmount || 0;
          } else if (booking.paymentMethod === 'cash') {
            cashRevenue += booking.totalAmount || 0;
          }
        }
      });
      
      // Update stats
      setStats({
        totalBookings: bookingsData.length,
        activeBookings: activeBookings.length,
        completedBookings: completedBookings.length,
        cancelledBookings: cancelledBookings.length,
        totalCars: carsData.length,
        availableCars: availableCars.length,
        totalDrivers: driversData.length,
        availableDrivers: availableDrivers.length,
        totalRevenue,
        onlinePayments: onlinePayments.length,
        cashPayments: cashPayments.length
      });
      
      // Update chart data
      setChartData({
        bookingStatus: {
          labels: ['Active', 'Completed', 'Cancelled'],
          datasets: [
            {
              data: [activeBookings.length, completedBookings.length, cancelledBookings.length],
              backgroundColor: ['#4F46E5', '#10B981', '#EF4444'],
            },
          ],
        },
        paymentMethod: {
          labels: ['Online', 'Cash'],
          datasets: [
            {
              data: [onlineRevenue, cashRevenue],
              backgroundColor: ['#4F46E5', '#F59E0B'],
            },
          ],
        }
      });
      
      // Get recent bookings (last 5)
      const recentBookingsQuery = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentBookingsSnapshot = await getDocs(recentBookingsQuery);
      const recentBookingsData = recentBookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRecentBookings(recentBookingsData);
      
    } catch (error) {
      toast.error('Error fetching dashboard data: ' + error.message);
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'assigned':
      case 'active':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Total Bookings</h2>
          <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
          <div className="mt-1 flex items-center text-sm text-gray-500">
            <span className="text-green-600">{Math.round((stats.completedBookings / stats.totalBookings) * 100)}% completed</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Total Revenue</h2>
          <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
          <div className="mt-1 flex items-center text-sm text-gray-500">
            <span className="text-green-600">From {stats.completedBookings} completed rides</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Cars</h2>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCars}</p>
          <div className="mt-1 flex items-center text-sm text-gray-500">
            <span className="text-green-600">{stats.availableCars} available</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Drivers</h2>
          <p className="text-3xl font-bold text-gray-900">{stats.totalDrivers}</p>
          <div className="mt-1 flex items-center text-sm text-gray-500">
            <span className="text-green-600">{stats.availableDrivers} available</span>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Booking Status</h2>
          <div className="h-64">
            <Doughnut 
              data={chartData.bookingStatus} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Revenue by Payment Method</h2>
          <div className="h-64">
            <Doughnut 
              data={chartData.paymentMethod} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Bookings</h2>
          <Link to="/admin/bookings" className="text-primary hover:text-primary-dark text-sm font-medium">
            View All
          </Link>
        </div>
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
                  Car & Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                recentBookings.map(booking => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/admin/bookings/${booking.id}`} className="text-primary hover:underline">
                        #{booking.id.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.customerName || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.carName}</div>
                      {booking.driverId && <div className="text-sm text-gray-500">With Driver</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(booking.pickupDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      ${booking.totalAmount?.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/cars"
            className="bg-primary text-white p-4 rounded-md hover:bg-primary-dark transition-colors text-center"
          >
            Manage Cars
          </Link>
          <Link
            to="/admin/drivers"
            className="bg-secondary text-white p-4 rounded-md hover:bg-green-600 transition-colors text-center"
          >
            Manage Drivers
          </Link>
          <Link
            to="/admin/bookings"
            className="bg-blue-600 text-white p-4 rounded-md hover:bg-blue-700 transition-colors text-center"
          >
            Manage Bookings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
