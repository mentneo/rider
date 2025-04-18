import React from 'react';

const AboutPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">About Us</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-10">
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-gray-700 mb-4">
            Founded in 2023, Car Booking App started with a simple mission: to provide reliable, convenient, and high-quality car rental services to our customers. 
            What began as a small fleet of vehicles has now grown into a trusted service that connects customers with the perfect vehicles for their needs.
          </p>
          <p className="text-gray-700 mb-4">
            We believe that transportation should be easy, comfortable, and stress-free. Whether you're traveling for business, going on a family vacation, 
            or simply need a vehicle for everyday use, we're here to make your journey better.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-10">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            Our mission is to revolutionize the car rental experience by providing exceptional service, transparent pricing, and a diverse fleet of well-maintained vehicles. 
            We strive to exceed our customers' expectations at every touchpoint, from booking to return.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8 mb-10">
          <h2 className="text-2xl font-semibold mb-4">Why Choose Us</h2>
          <ul className="space-y-3 text-gray-700 mb-4">
            <li className="flex items-start">
              <svg className="h-6 w-6 text-primary mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span><strong>Diverse Fleet:</strong> From economy cars to luxury vehicles, our wide selection ensures you'll find the perfect match for your journey.</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-primary mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span><strong>Flexible Options:</strong> Choose between self-drive rentals or book with a professional driver for a hassle-free experience.</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-primary mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span><strong>Transparent Pricing:</strong> No hidden fees or surprise charges - what you see is what you pay.</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-primary mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span><strong>24/7 Support:</strong> Our customer service team is always available to assist you with any questions or concerns.</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-primary mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span><strong>Reliability:</strong> All our vehicles are regularly maintained and thoroughly cleaned before each rental.</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-4">Our Team</h2>
          <p className="text-gray-700 mb-6">
            Behind our service is a dedicated team of professionals committed to making your car rental experience exceptional. 
            From our customer service representatives to our maintenance staff and professional drivers, every member of our team works 
            with a customer-first mindset.
          </p>
          
          <div className="mt-8 text-center">
            <a href="/contact" className="inline-block bg-primary text-white px-6 py-3 rounded-md font-medium hover:bg-primary-dark transition-colors">
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
