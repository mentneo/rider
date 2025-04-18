import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort bookings by date (newest first by default)
      bookingsData.sort((a, b) => {
        if (sortDirection === 'asc') {
          return new Date(a[sortField] || a.createdAt) - new Date(b[sortField] || b.createdAt);
        } else {
          return new Date(b[sortField] || b.createdAt) - new Date(a[sortField] || a.createdAt);
        }
      });
      
      setBookings(bookingsData);
    } catch (error) {
      toast.error('Error fetching bookings: ' + error.message);
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      toast.success(`Booking status updated to ${newStatus}`);
      
      // Refresh bookings list
      fetchBookings();
    } catch (error) {
      toast.error('Error updating booking status: ' + error.message);
      console.error('Error updating booking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (bookingId, newStatus) => {
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'bookings', bookingId), {
        paymentStatus: newStatus,
        paidAt: newStatus === 'paid' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      });
      
      toast.success(`Payment status updated to ${newStatus}`);
      
      // Refresh bookings list
      fetchBookings();
    } catch (error) {
      toast.error('Error updating payment status: ' + error.message);
      console.error('Error updating payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
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

  const filteredBookings = () => {
    return bookings.filter(booking => {
      // Filter by status
      if (filterStatus !== 'all' && booking.status !== filterStatus) {
        return false;
      }
      
      // Filter by payment status
      if (filterPayment !== 'all' && booking.paymentStatus !== filterPayment) {
        return false;
      }
      
      // Filter by search term (check customer name, booking ID, car)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const bookingIdMatch = booking.id.toLowerCase().includes(searchLower);
        const customerNameMatch = booking.customerName && booking.customerName.toLowerCase().includes(searchLower);
        const carNameMatch = booking.carName && booking.carName.toLowerCase().includes(searchLower);
        
        return bookingIdMatch || customerNameMatch || carNameMatch;
      }
      
      return true;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Bookings</h1>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              id="statusFilter"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="paymentFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Payment
            </label>
            <select
              id="paymentFilter"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              placeholder="Search by ID, customer, car..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">
                      Booking ID
                      {sortField === 'id' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Car & Driver
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('pickupDate')}
                  >
                    <div className="flex items-center">
                      Date
                      {sortField === 'pickupDate' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('totalAmount')}
                  >
                    <div className="flex items-center">
                      Amount
                      {sortField === 'totalAmount' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings().length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      No bookings found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredBookings().map(booking => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{booking.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.customerName || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{booking.customerEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{booking.carName}</div>
                        <div className="text-sm text-gray-500">
                          {booking.bookingType === 'withDriver' ? 'With Driver' : 'Self Drive'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.pickupDate && new Date(booking.pickupDate).toLocaleDateString()}
                        <div>{booking.pickupTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                            {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                          </span>
                          <div className="ml-2">
                            <button 
                              className="text-gray-400 hover:text-gray-500"
                              onClick={() => {
                                const element = document.getElementById(`status-dropdown-${booking.id}`);
                                element.classList.toggle('hidden');
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div id={`status-dropdown-${booking.id}`} className="hidden absolute z-10 mt-1 w-40 bg-white shadow-lg rounded-md py-1">
                              <button
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                              >
                                Mark Confirmed
                              </button>
                              <button
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'assigned')}
                              >
                                Mark Assigned
                              </button>
                              <button
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
                              >
                                Mark Completed
                              </button>
                              <button
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                              >
                                Mark Cancelled
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeClass(booking.paymentStatus)}`}>
                            {booking.paymentStatus?.charAt(0).toUpperCase() + booking.paymentStatus?.slice(1)}
                          </span>
                          <div className="ml-2">
                            <button 
                              className="text-gray-400 hover:text-gray-500"
                              onClick={() => {
                                const element = document.getElementById(`payment-dropdown-${booking.id}`);
                                element.classList.toggle('hidden');
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <div id={`payment-dropdown-${booking.id}`} className="hidden absolute z-10 mt-1 w-40 bg-white shadow-lg rounded-md py-1">
                              <button
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                onClick={() => handleUpdatePaymentStatus(booking.id, 'paid')}
                              >
                                Mark as Paid
                              </button>
                              <button
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                onClick={() => handleUpdatePaymentStatus(booking.id, 'pending')}
                              >
                                Mark as Pending
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {booking.paymentMethod === 'online' ? 'Online' : 'Cash'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${booking.totalAmount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/admin/bookings/${booking.id}`}
                          className="text-primary hover:text-primary-dark"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
