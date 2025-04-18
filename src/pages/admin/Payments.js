import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    cash: 0,
    pending: 0
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Fetch all bookings (considering each booking as a payment record)
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const bookingsData = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate payment statistics
      let totalAmount = 0;
      let onlineAmount = 0;
      let cashAmount = 0;
      let pendingAmount = 0;
      
      bookingsData.forEach(booking => {
        const amount = booking.totalAmount || 0;
        
        if (booking.paymentStatus === 'paid') {
          totalAmount += amount;
          
          if (booking.paymentMethod === 'online') {
            onlineAmount += amount;
          } else if (booking.paymentMethod === 'cash') {
            cashAmount += amount;
          }
        } else {
          pendingAmount += amount;
        }
      });
      
      setStats({
        total: totalAmount,
        online: onlineAmount,
        cash: cashAmount,
        pending: pendingAmount
      });
      
      // Sort by payment date (if available) or created date
      bookingsData.sort((a, b) => {
        const dateA = a.paidAt || a.createdAt;
        const dateB = b.paidAt || b.createdAt;
        return new Date(dateB) - new Date(dateA);
      });
      
      setPayments(bookingsData);
    } catch (error) {
      toast.error('Error fetching payments: ' + error.message);
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = () => {
    return payments.filter(payment => {
      // Filter by payment status
      if (filterStatus === 'paid' && payment.paymentStatus !== 'paid') {
        return false;
      }
      if (filterStatus === 'pending' && payment.paymentStatus !== 'pending') {
        return false;
      }
      
      // Filter by payment method
      if (filterMethod === 'online' && payment.paymentMethod !== 'online') {
        return false;
      }
      if (filterMethod === 'cash' && payment.paymentMethod !== 'cash') {
        return false;
      }
      
      // Filter by date range
      if (dateRange.start && dateRange.end) {
        const paymentDate = new Date(payment.paidAt || payment.createdAt);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59); // Include the entire end day
        
        if (paymentDate < startDate || paymentDate > endDate) {
          return false;
        }
      }
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const bookingIdMatch = payment.id.toLowerCase().includes(searchLower);
        const customerNameMatch = payment.customerName && payment.customerName.toLowerCase().includes(searchLower);
        
        return bookingIdMatch || customerNameMatch;
      }
      
      return true;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Payment Management</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Total Collected</h2>
          <p className="text-3xl font-bold text-gray-900">${stats.total.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Online Payments</h2>
          <p className="text-3xl font-bold text-primary">${stats.online.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Cash Payments</h2>
          <p className="text-3xl font-bold text-secondary">${stats.cash.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Pending Payments</h2>
          <p className="text-3xl font-bold text-yellow-500">${stats.pending.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              id="statusFilter"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="methodFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              id="methodFilter"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
            >
              <option value="all">All Methods</option>
              <option value="online">Online</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
          
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Payments Table */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments().length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No payments found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredPayments().map(payment => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                        #{payment.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.customerName || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">
                          {payment.bookingType === 'withDriver' ? 'With Driver' : 'Self Drive'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paidAt ? (
                          new Date(payment.paidAt).toLocaleDateString()
                        ) : (
                          <span className="text-yellow-500">Not paid yet</span>
                        )}
                        {payment.paidAt && (
                          <div className="text-xs">
                            {new Date(payment.paidAt).toLocaleTimeString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          ${payment.totalAmount?.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Distance: ${payment.distanceCharge?.toFixed(2)}
                          {payment.driverCharge > 0 && `, Driver: $${payment.driverCharge?.toFixed(2)}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.paymentMethod === 'online'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.paymentMethod === 'online' ? 'Online' : 'Cash'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                        </span>
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

export default AdminPayments;
