import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const CarsPage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    priceRange: 'all',
    sortBy: 'default'
  });
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      
      // Fetch all cars instead of using a complex query
      const carsSnapshot = await getDocs(collection(db, 'cars'));
      const carsData = carsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter available cars in memory
      const availableCars = carsData.filter(car => car.isAvailable === true);
      
      setCars(availableCars);
    } catch (error) {
      toast.error('Error fetching cars: ' + error.message);
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const getFilteredCars = () => {
    return cars.filter(car => {
      // Filter by car type
      if (filters.type !== 'all' && car.type !== filters.type) {
        return false;
      }
      
      // Filter by price range
      if (filters.priceRange !== 'all') {
        const price = car.pricePerKm;
        
        switch(filters.priceRange) {
          case 'low':
            if (price > 1) return false;
            break;
          case 'medium':
            if (price < 1 || price > 2) return false;
            break;
          case 'high':
            if (price < 2) return false;
            break;
          default:
            break;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Sort cars
      switch(filters.sortBy) {
        case 'priceLow':
          return a.pricePerKm - b.pricePerKm;
        case 'priceHigh':
          return b.pricePerKm - a.pricePerKm;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };

  // Handle booking button click
  const handleBookClick = (carId) => {
    // If user is not logged in, redirect to login page with return path
    if (!currentUser) {
      // Store the carId in localStorage so we can redirect after login
      localStorage.setItem('pendingBookingCarId', carId);
      
      // Redirect to login with the booking path as return URL
      navigate(`/login?redirect=/book/${carId}`);
      
      // Show notification to the user
      toast.info('Please log in to continue with your booking.');
      return;
    }
    
    // If user is logged in, navigate directly to booking page
    navigate(`/book/${carId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Our Cars</h1>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Car Type
            </label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            >
              <option value="all">All Types</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Luxury">Luxury</option>
              <option value="Van">Van</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="priceRange" className="block text-sm font-medium text-gray-700 mb-1">
              Price Range
            </label>
            <select
              id="priceRange"
              name="priceRange"
              value={filters.priceRange}
              onChange={handleFilterChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            >
              <option value="all">All Prices</option>
              <option value="low">Budget (Less than $1/km)</option>
              <option value="medium">Standard ($1-$2/km)</option>
              <option value="high">Premium (More than $2/km)</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sortBy"
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            >
              <option value="default">Default</option>
              <option value="priceLow">Price: Low to High</option>
              <option value="priceHigh">Price: High to Low</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Cars List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : getFilteredCars().length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold mb-4">No Cars Found</h2>
          <p className="text-gray-600 mb-4">Try changing your filters or check back later for new cars.</p>
          <button
            onClick={() => setFilters({ type: 'all', priceRange: 'all', sortBy: 'default' })}
            className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-primary-dark transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredCars().map(car => (
            <div key={car.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img src={car.imageUrl} alt={car.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold">{car.name}</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary">
                    {car.type}
                  </span>
                </div>
                <p className="text-primary font-bold text-lg mb-3">${car.pricePerKm?.toFixed(2) || '0.00'} per km</p>
                
                {car.features && car.features.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Features:</h3>
                    <div className="flex flex-wrap gap-1">
                      {car.features.slice(0, 3).map((feature, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {feature}
                        </span>
                      ))}
                      {car.features.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          +{car.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => handleBookClick(car.id)}
                  className="w-full text-center bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-primary-dark transition-colors"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CarsPage;
