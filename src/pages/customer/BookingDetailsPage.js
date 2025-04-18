import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const BookingDetailsPage = () => {
  const { bookingId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [driver, setDriver] = useState(null);
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    if (bookingId && currentUser) {
      fetchBookingDetails();
    }
  }, [bookingId, currentUser]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch booking
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      
      if (!bookingDoc.exists()) {
        toast.error('Booking not found');
        navigate('/dashboard');
        return;
      }
      
      const bookingData = { id: bookingDoc.id, ...bookingDoc.data() };
      
      // Verify this booking belongs to the current user
      if (bookingData.customerId !== currentUser.uid) {
        toast.error('You do not have permission to view this booking');
        navigate('/dashboard');
        return;
      }
      
      setBooking(bookingData);
      
      // Fetch car details
      if (bookingData.carId) {
        const carDoc = await getDoc(doc(db, 'cars', bookingData.carId));
        if (carDoc.exists()) {
          setCar({ id: carDoc.id, ...carDoc.data() });
        }
      }
      
      // Fetch driver details if booked with driver
      if (bookingData.bookingType === 'withDriver' && bookingData.driverId) {
        const driverDoc = await getDoc(doc(db, 'users', bookingData.driverId));
        if (driverDoc.exists()) {
          setDriver({ id: driverDoc.id, ...driverDoc.data() });
        }
      }
      
    } catch (error) {
      toast.error('Error fetching booking details: ' + error.message);
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this booking?');
    
    if (!confirmCancel) return;
    
    try {
      setLoading(true);
      
      // Check if the booking can be cancelled (e.g., not already completed, not too close to pickup time)
      const pickupDate = new Date(`${booking.pickupDate}T${booking.pickupTime}`);
      const now = new Date();
      
      // Check if less than 2 hours before pickup (adjust timing as needed for your business rules)
      const hoursDiff = (pickupDate - now) / (1000 * 60 * 60);
      
      if (booking.status === 'completed') {
        toast.error('Completed bookings cannot be cancelled');
        return;
      }
      
      if (hoursDiff < 2) {
        toast.error('Bookings can only be cancelled at least 2 hours before pickup time');
        return;
      }
      
      // Update booking status
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Booking cancelled successfully');
      
      // Refresh booking data
      fetchBookingDetails();
      
    } catch (error) {
      toast.error('Error cancelling booking: ' + error.message);
      console.error('Error cancelling booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewData({
      ...reviewData,
      [name]: name === 'rating' ? parseInt(value, 10) : value
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      await updateDoc(doc(db, 'bookings', bookingId), {
        customerReview: {
          ...reviewData,
          createdAt: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Thank you for your review!');
      setReviewModalOpen(false);
      
      // Refresh booking data
      fetchBookingDetails();
      
    } catch (error) {
      toast.error('Error submitting review: ' + error.message);
      console.error('Error submitting review:', error);
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

  if (!booking) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-xl text-gray-600">Booking not found.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center text-gray-600 hover:text-primary mb-6"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to My Bookings
      </Link>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">Booking #{bookingId.substring(0, 8)}</h1>
              <p className="text-gray-600">Created on {new Date(booking.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {booking.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Car and booking type */}
            <div className="md:col-span-1">
              <h2 className="text-lg font-semibold mb-4">Car & Booking Type</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                {car && car.imageUrl && (
                  <img src={car.imageUrl} alt={car.name} className="w-full h-40 object-cover rounded mb-3" />
                )}
                <h3 className="font-bold text-lg">{car?.name || booking.carName}</h3>
                <p className="text-gray-600 mb-2">{car?.type || booking.carType}</p>
                <p className="text-primary font-bold">${car?.pricePerKm || booking.pricePerKm} per km</p>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="font-medium">Booking Type:</p>
                  <p>{booking.bookingType === 'withDriver' ? 'With Driver' : 'Self Drive'}</p>
                </div>
              </div>
            </div>

            {/* Trip details */}
            <div className="md:col-span-1">
              <h2 className="text-lg font-semibold mb-4">Trip Details</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="mb-4">
                  <p className="text-gray-600 text-sm">Pickup Location</p>
                  <p className="font-medium">{booking.pickupLocation}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-600 text-sm">Drop Location</p>
                  <p className="font-medium">{booking.dropLocation}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-600 text-sm">Pickup Date & Time</p>
                  <p className="font-medium">
                    {new Date(booking.pickupDate).toLocaleDateString()} at {booking.pickupTime}
                  </p>
                </div>
                {booking.bookingType === 'selfDrive' && booking.returnDate && (
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm">Return Date & Time</p>
                    <p className="font-medium">
                      {new Date(booking.returnDate).toLocaleDateString()} at {booking.returnTime}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600 text-sm">Estimated Distance</p>
                  <p className="font-medium">{booking.estimatedDistance} km</p>
                </div>
              </div>
            </div>

            {/* Payment & driver (if assigned) */}
            <div className="md:col-span-1">
              <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="mb-2">
                  <p className="text-gray-600 text-sm">Distance Charge</p>
                  <p className="font-medium">${booking.distanceCharge?.toFixed(2)}</p>
                </div>
                {booking.driverCharge > 0 && (
                  <div className="mb-2">
                    <p className="text-gray-600 text-sm">Driver Charge</p>
                    <p className="font-medium">${booking.driverCharge?.toFixed(2)}</p>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <p className="text-gray-600 text-sm">Total Amount</p>
                  <p className="font-bold text-lg">${booking.totalAmount?.toFixed(2)}</p>
                </div>
                <div className="mt-2">
                  <p className="text-gray-600 text-sm">Payment Method</p>
                  <p className="font-medium">{booking.paymentMethod === 'online' ? 'Paid Online' : 'Cash'}</p>
                </div>
              </div>

              {driver && (
                <>
                  <h2 className="text-lg font-semibold mb-2">Assigned Driver</h2>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center">
                      {driver.imageUrl && (
                        <img 
                          src={driver.imageUrl} 
                          alt={driver.name} 
                          className="w-12 h-12 rounded-full object-cover mr-3" 
                        />
                      )}
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        {driver.phone && <p className="text-sm">{driver.phone}</p>}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Driver's Review (if available) */}
              {booking.driverReview && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Driver's Review</h3>
                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>{i < booking.driverReview.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <p className="text-gray-700">{booking.driverReview.comment || 'No comment provided.'}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Reviewed on {new Date(booking.driverReview.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Customer's Review (if available) or Add Review Button */}
              {booking.customerReview ? (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Your Review</h3>
                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>{i < booking.customerReview.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                  <p className="text-gray-700">{booking.customerReview.comment || 'No comment provided.'}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Reviewed on {new Date(booking.customerReview.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ) : booking.status === 'completed' ? (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-3">Share Your Experience</h3>
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
                  >
                    Leave a Review
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
            <div>
              {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                <button
                  onClick={handleCancelBooking}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  disabled={loading}
                >
                  Cancel Booking
                </button>
              )}
            </div>

            <div>
              {booking.paymentStatus !== 'paid' && booking.status !== 'cancelled' && (
                <Link
                  to={`/payment/${bookingId}`}
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors ml-3"
                >
                  Complete Payment
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Rate Your Experience</h2>
            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <label key={star} className="cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        value={star}
                        checked={reviewData.rating === star}
                        onChange={handleReviewChange}
                        className="sr-only"
                      />
                      <span className={`text-2xl ${reviewData.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Your Comments</label>
                <textarea
                  name="comment"
                  value={reviewData.comment}
                  onChange={handleReviewChange}
                  rows="4"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Share your experience with this ride..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                  disabled={loading}
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetailsPage;
