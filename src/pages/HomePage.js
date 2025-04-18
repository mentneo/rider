import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import ErrorState from '../components/common/ErrorState';

const HomePage = () => {
  const [featuredCars, setFeaturedCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeaturedCars();
  }, []);

  const fetchFeaturedCars = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all cars instead of using a query with orderBy
      const carsSnapshot = await getDocs(collection(db, 'cars'));
      const carsData = carsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter and sort in memory
      const availableCars = carsData
        .filter(car => car.isAvailable === true)
        .sort((a, b) => (b.pricePerKm || 0) - (a.pricePerKm || 0))
        .slice(0, 4); // Get top 4 cars
      
      setFeaturedCars(availableCars);
    } catch (error) {
      console.error('Error fetching cars:', error);
      setError(error.message);
      toast.error('Error loading featured cars. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <div className="relative bg-gray-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1485291571150-772bcfc10da5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
            alt="Luxury car on the road" 
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="md:w-2/3">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-6">
              Your journey begins with the perfect car
            </h1>
            <p className="text-xl md:text-2xl mb-10">
              Rent premium vehicles for any occasion with our flexible booking options
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/cars"
                className="inline-block bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-md transition-colors duration-300"
              >
                Browse Cars
              </Link>
              <Link
                to="/register"
                className="inline-block bg-white hover:bg-gray-100 text-primary font-bold py-3 px-8 rounded-md transition-colors duration-300"
              >
                Sign Up Now
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Book your ride in just a few simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary text-white text-2xl font-bold mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Choose Your Car</h3>
              <p className="text-gray-600">
                Browse our wide selection of vehicles and choose the perfect one for your needs.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary text-white text-2xl font-bold mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Book Online</h3>
              <p className="text-gray-600">
                Select your dates, choose with or without driver, and complete the booking process.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary text-white text-2xl font-bold mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Enjoy Your Ride</h3>
              <p className="text-gray-600">
                Get your car delivered or pick it up, and enjoy your journey with confidence.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Featured Cars Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Cars</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our premium selection of vehicles
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <ErrorState 
              message="We couldn't load our featured cars at the moment. Please check back later."
              showHomeLink={false}
            />
          ) : featuredCars.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No cars available at the moment. Please check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCars.map(car => (
                <div key={car.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <img src={car.imageUrl} alt={car.name} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold">{car.name}</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary">
                        {car.type}
                      </span>
                    </div>
                    <p className="text-primary font-bold text-lg mb-3">${car.pricePerKm?.toFixed(2) || '0.00'} per km</p>
                    <Link
                      to={`/book/${car.id}`}
                      className="w-full block text-center bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-primary-dark transition-colors"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-10">
            <Link
              to="/cars"
              className="inline-block bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-md transition-colors duration-300"
            >
              View All Cars
            </Link>
          </div>
        </div>
      </div>
      
      {/* Services Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We offer a variety of car booking options to fit your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md flex">
              <div className="mr-6">
                <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Self-Drive Cars</h3>
                <p className="text-gray-600 mb-4">
                  Enjoy the freedom of driving yourself. Perfect for those who prefer to be behind the wheel.
                </p>
                <Link to="/cars" className="text-primary font-medium hover:text-primary-dark">
                  Learn More →
                </Link>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md flex">
              <div className="mr-6">
                <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">With Driver</h3>
                <p className="text-gray-600 mb-4">
                  Let our professional drivers take you to your destination while you relax in comfort.
                </p>
                <Link to="/cars" className="text-primary font-medium hover:text-primary-dark">
                  Learn More →
                </Link>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md flex">
              <div className="mr-6">
                <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Insurance Included</h3>
                <p className="text-gray-600 mb-4">
                  All our rentals come with comprehensive insurance coverage for your peace of mind.
                </p>
                <Link to="/cars" className="text-primary font-medium hover:text-primary-dark">
                  Learn More →
                </Link>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md flex">
              <div className="mr-6">
                <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">24/7 Support</h3>
                <p className="text-gray-600 mb-4">
                  Our customer support team is available round the clock to assist you with any needs.
                </p>
                <Link to="/contact" className="text-primary font-medium hover:text-primary-dark">
                  Contact Us →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonials Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it — hear from our satisfied customers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex text-yellow-400 mb-4">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-gray-600 mb-6 italic">
                "The car was in pristine condition and driving it was a pleasure. The booking process was straightforward, and the staff was very helpful."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-300 mr-4"></div>
                <div>
                  <p className="font-bold">Michael Johnson</p>
                  <p className="text-gray-500 text-sm">Business Executive</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex text-yellow-400 mb-4">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-gray-600 mb-6 italic">
                "I needed a car with a driver for a business trip and the service exceeded my expectations. The driver was professional and punctual."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-300 mr-4"></div>
                <div>
                  <p className="font-bold">Sarah Williams</p>
                  <p className="text-gray-500 text-sm">Marketing Director</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex text-yellow-400 mb-4">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-gray-600 mb-6 italic">
                "We booked a luxury car for our wedding day and it was absolutely perfect. Everyone was impressed and the service was top-notch."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-300 mr-4"></div>
                <div>
                  <p className="font-bold">David & Emma Thompson</p>
                  <p className="text-gray-500 text-sm">Newlyweds</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book Your Perfect Car?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Join thousands of satisfied customers who trust us for their transportation needs
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/cars"
              className="inline-block bg-white text-primary font-bold py-3 px-8 rounded-md hover:bg-gray-100 transition-colors duration-300"
            >
              Browse Cars
            </Link>
            <Link
              to="/contact"
              className="inline-block bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-md hover:bg-white hover:text-primary transition-colors duration-300"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
