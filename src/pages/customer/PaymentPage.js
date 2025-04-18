import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      
      if (!bookingDoc.exists()) {
        toast.error('Booking not found');
        navigate('/dashboard');
        return;
      }
      
      const bookingData = { id: bookingDoc.id, ...bookingDoc.data() };
      
      // Check if this booking belongs to the current user
      if (bookingData.customerId !== currentUser.uid) {
        toast.error('You do not have permission to view this booking');
        navigate('/dashboard');
        return;
      }
      
      setBooking(bookingData);
    } catch (error) {
      toast.error('Error fetching booking details: ' + error.message);
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails({
      ...cardDetails,
      [name]: value
    });
  };

  const validateCard = () => {
    // This is a basic validation. In a real app, you'd use a proper card validation library
    if (paymentMethod === 'cash') return true;
    
    if (!cardDetails.cardNumber || cardDetails.cardNumber.length < 16) {
      toast.error('Please enter a valid card number');
      return false;
    }
    
    if (!cardDetails.cardHolder) {
      toast.error('Please enter the card holder name');
      return false;
    }
    
    if (!cardDetails.expiryDate) {
      toast.error('Please enter the expiry date');
      return false;
    }
    
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      toast.error('Please enter a valid CVV');
      return false;
    }
    
    return true;
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateCard()) return;
    
    try {
      setPaymentProcessing(true);
      
      // Update the booking with payment information
      await updateDoc(doc(db, 'bookings', bookingId), {
        paymentMethod,
        paymentStatus: paymentMethod === 'online' ? 'paid' : 'pending', // If online, mark as paid immediately
        paidAt: paymentMethod === 'online' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      });
      
      // In a real app, you would integrate with a payment gateway here
      
      toast.success(paymentMethod === 'online' 
        ? 'Payment successful! Your booking is confirmed.' 
        : 'Booking confirmed! You will pay cash to the driver.'
      );
      
      // Redirect to booking details page
      navigate(`/booking/${bookingId}`);
    } catch (error) {
      toast.error('Payment failed: ' + error.message);
      console.error('Payment error:', error);
    } finally {
      setPaymentProcessing(false);
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
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>
        <p className="text-gray-600">Booking #{bookingId.substring(0, 8)}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Booking Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Car</p>
              <p className="font-medium">{booking.carName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Booking Type</p>
              <p className="font-medium">{booking.bookingType === 'withDriver' ? 'With Driver' : 'Self Drive'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pickup Location</p>
              <p className="font-medium">{booking.pickupLocation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Drop Location</p>
              <p className="font-medium">{booking.dropLocation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pickup Date & Time</p>
              <p className="font-medium">
                {new Date(booking.pickupDate).toLocaleDateString()} at {booking.pickupTime}
              </p>
            </div>
            {booking.bookingType === 'selfDrive' && booking.returnDate && (
              <div>
                <p className="text-sm text-gray-500">Return Date & Time</p>
                <p className="font-medium">
                  {new Date(booking.returnDate).toLocaleDateString()} at {booking.returnTime}
                </p>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Distance Charge:</span>
              <span>${booking.distanceCharge.toFixed(2)}</span>
            </div>
            {booking.driverCharge > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Driver Charge:</span>
                <span>${booking.driverCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span>${booking.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
          
          <div className="mb-6">
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={() => setPaymentMethod('online')}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <span className="ml-2">Pay Online</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                />
                <span className="ml-2">Pay Cash on Ride</span>
              </label>
            </div>
          </div>
          
          {paymentMethod === 'online' ? (
            <form onSubmit={handlePaymentSubmit}>
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={handleInputChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="16"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Card Holder Name</label>
                  <input
                    type="text"
                    name="cardHolder"
                    value={cardDetails.cardHolder}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Expiry Date</label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={cardDetails.expiryDate}
                      onChange={handleInputChange}
                      placeholder="MM/YY"
                      maxLength="5"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">CVV</label>
                    <input
                      type="text"
                      name="cvv"
                      value={cardDetails.cvv}
                      onChange={handleInputChange}
                      placeholder="123"
                      maxLength="4"
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={paymentProcessing}
                className="w-full bg-primary text-white py-3 rounded-md font-medium hover:bg-primary-dark transition-colors"
              >
                {paymentProcessing ? 'Processing...' : `Pay $${booking.totalAmount.toFixed(2)}`}
              </button>
            </form>
          ) : (
            <div>
              <p className="text-gray-600 mb-6">
                You will pay the driver directly in cash after your ride is completed. The driver will provide a receipt.
              </p>
              <button
                onClick={handlePaymentSubmit}
                disabled={paymentProcessing}
                className="w-full bg-primary text-white py-3 rounded-md font-medium hover:bg-primary-dark transition-colors"
              >
                {paymentProcessing ? 'Processing...' : 'Confirm Cash Payment'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
