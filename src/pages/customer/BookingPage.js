import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const BookingPage = () => {
  const { carId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [car, setCar] = useState(null);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingType, setBookingType] = useState('withDriver'); // 'withDriver' or 'selfDrive'
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropLocation: '',
    pickupDate: '',
    pickupTime: '',
    returnDate: '',
    returnTime: '',
    estimatedDistance: '',
    driverId: '',
    specialRequests: ''
  });
  const [bookingSummary, setBookingSummary] = useState({
    totalAmount: 0,
    driverCharge: 0,
    distanceCharge: 0
  });

  useEffect(() => {
    // Check if user is logged in
    if (!currentUser) {
      // Store carId in localStorage before redirecting
      if (carId) {
        localStorage.setItem('pendingBookingCarId', carId);
      }
      
      // Redirect to login with return path to this booking page
      navigate(`/login?redirect=/book/${carId}`);
      toast.info('Please log in to continue with your booking.');
      return;
    }
    
    // If user is logged in, proceed with fetching car details
    if (carId) {
      fetchCarDetails();
      fetchAvailableDrivers();
      
      // Clear pending booking info from localStorage if it exists
      localStorage.removeItem('pendingBookingCarId');
    }
  }, [carId, currentUser, navigate]);

  useEffect(() => {
    // Calculate booking cost whenever relevant form data changes
    calculateBookingCost();
  }, [formData.estimatedDistance, car, bookingType, formData.driverId]);

  const fetchCarDetails = async () => {
    try {
      const carDoc = await getDoc(doc(db, 'cars', carId));
      if (carDoc.exists()) {
        setCar({ id: carDoc.id, ...carDoc.data() });
      } else {
        toast.error('Car not found');
        navigate('/cars');
      }
    } catch (error) {
      toast.error('Error fetching car details: ' + error.message);
      console.error('Error fetching car details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDrivers = async () => {
    try {
      const driversQuery = query(
        collection(db, 'users'),
        where('role', '==', 'driver'),
        where('isAvailable', '==', true)
      );
      
      const driversSnapshot = await getDocs(driversQuery);
      const driversList = driversSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAvailableDrivers(driversList);
    } catch (error) {
      console.error('Error fetching available drivers:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const calculateBookingCost = () => {
    if (!car || !formData.estimatedDistance) return;
    
    const distance = parseFloat(formData.estimatedDistance);
    if (isNaN(distance)) return;
    
    const distanceCharge = distance * car.pricePerKm;
    let driverCharge = 0;
    
    if (bookingType === 'withDriver' && formData.driverId) {
      // Add driver charge (for example: fixed amount per day or percentage of the total)
      driverCharge = 50; // Sample fixed charge
    }
    
    const totalAmount = distanceCharge + driverCharge;
    
    setBookingSummary({
      totalAmount,
      driverCharge,
      distanceCharge
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Double check that user is logged in
      if (!currentUser) {
        toast.error('Please login to continue');
        navigate(`/login?redirect=/book/${carId}`);
        return;
      }
      
      if (!car) {
        toast.error('Car details not available');
        return;
      }
      
      if (bookingType === 'withDriver' && !formData.driverId) {
        toast.error('Please select a driver');
        return;
      }
      
      // Prepare booking data
      const bookingData = {
        carId: car.id,
        carName: car.name,
        carType: car.type,
        customerId: currentUser.uid,
        customerName: currentUser.displayName,
        ...formData,
        bookingType,
        driverId: bookingType === 'withDriver' ? formData.driverId : null,
        status: bookingType === 'withDriver' ? 'assigned' : 'confirmed', // If with driver, status is 'assigned', otherwise 'confirmed'
        totalAmount: bookingSummary.totalAmount,
        distanceCharge: bookingSummary.distanceCharge,
        driverCharge: bookingSummary.driverCharge,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString()
      };
      
      // Add booking to Firestore
      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
      
      toast.success('Booking created successfully!');
      
      // Navigate to payment page
      navigate(`/payment/${bookingRef.id}`);
    } catch (error) {
      toast.error('Error creating booking: ' + error.message);
      console.error('Error creating booking:', error);
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

  if (!car) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-xl text-gray-600">Car not found. Please try another car.</p>
        <button
          onClick={() => navigate('/cars')}
          className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
        >
          Back to Cars
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Book Your Ride</h1>
        <p className="text-gray-600">Complete the form below to book {car.name}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Car Details */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <img src={car.imageUrl} alt={car.name} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h2 className="text-xl font-bold mb-1">{car.name}</h2>
              <p className="text-gray-500 mb-2">{car.type}</p>
              <p className="text-primary font-bold mb-3">${car.pricePerKm} per km</p>
              
              {car.features && car.features.length > 0 && (
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Features:</h3>
                  <ul className="text-sm text-gray-600">
                    {car.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-4 bg-gray-50 p-3 rounded-md">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Booking Summary</h3>
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Distance Charge:</span>
                    <span>${bookingSummary.distanceCharge.toFixed(2)}</span>
                  </div>
                  {bookingType === 'withDriver' && (
                    <div className="flex justify-between mb-1">
                      <span>Driver Charge:</span>
                      <span>${bookingSummary.driverCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t border-gray-200 mt-2">
                    <span>Total Amount:</span>
                    <span>${bookingSummary.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit}>
              {/* Booking Type */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Booking Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="bookingType"
                      value="withDriver"
                      checked={bookingType === 'withDriver'}
                      onChange={() => setBookingType('withDriver')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-2">With Driver</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="bookingType"
                      value="selfDrive"
                      checked={bookingType === 'selfDrive'}
                      onChange={() => setBookingType('selfDrive')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                    />
                    <span className="ml-2">Self Drive</span>
                  </label>
                </div>
              </div>

              {/* Trip Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Pickup Location</label>
                  <input
                    type="text"
                    name="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Drop Location</label>
                  <input
                    type="text"
                    name="dropLocation"
                    value={formData.dropLocation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Pickup Date</label>
                  <input
                    type="date"
                    name="pickupDate"
                    value={formData.pickupDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Pickup Time</label>
                  <input
                    type="time"
                    name="pickupTime"
                    value={formData.pickupTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                {bookingType === 'selfDrive' && (
                  <>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Return Date</label>
                      <input
                        type="date"
                        name="returnDate"
                        value={formData.returnDate}
                        onChange={handleInputChange}
                        min={formData.pickupDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        required={bookingType === 'selfDrive'}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Return Time</label>
                      <input
                        type="time"
                        name="returnTime"
                        value={formData.returnTime}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                        required={bookingType === 'selfDrive'}
                      />
                    </div>
                  </>
                )}
                
                <div className={bookingType === 'selfDrive' ? 'md:col-span-2' : ''}>
                  <label className="block text-gray-700 font-medium mb-2">Estimated Distance (km)</label>
                  <input
                    type="number"
                    name="estimatedDistance"
                    value={formData.estimatedDistance}
                    onChange={handleInputChange}
                    min="1"
                    step="0.1"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                {bookingType === 'withDriver' && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Select Driver</label>
                    <select
                      name="driverId"
                      value={formData.driverId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      required={bookingType === 'withDriver'}
                    >
                      <option value="">Choose a driver</option>
                      {availableDrivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">Special Requests (Optional)</label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-white px-6 py-2 rounded font-medium hover:bg-primary-dark transition-colors"
                >
                  {loading ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
