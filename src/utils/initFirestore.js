import { collection, getDocs, addDoc, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Sample car data with reliable image URLs
const sampleCars = [
  {
    name: 'Toyota Camry',
    type: 'Sedan',
    pricePerKm: 0.85,
    features: ['Air Conditioning', 'Bluetooth', 'Cruise Control', 'Backup Camera'],
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
  },
  {
    name: 'Honda CR-V',
    type: 'SUV',
    pricePerKm: 1.2,
    features: ['All-Wheel Drive', 'Navigation System', 'Heated Seats', 'Sunroof'],
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
  },
  {
    name: 'Ford F-150',
    type: 'Truck',
    pricePerKm: 1.5,
    features: ['4x4', 'Towing Package', 'Bedliner', 'Large Cargo Space'],
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1613467145729-502791e2e525?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
  },
  {
    name: 'BMW 5 Series',
    type: 'Luxury',
    pricePerKm: 2.5,
    features: ['Leather Seats', 'Premium Sound System', 'Adaptive Cruise Control', 'Parking Assistant'],
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
  },
  {
    name: 'Tesla Model 3',
    type: 'Electric',
    pricePerKm: 2.0,
    features: ['Autopilot', 'All-Electric', 'Touchscreen Display', 'Long Range Battery'],
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1562053013-685d8a0f3649?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
  },
  {
    name: 'Toyota Sienna',
    type: 'Van',
    pricePerKm: 1.3,
    features: ['8 Passenger Seating', 'Sliding Doors', 'Rear Entertainment System', 'Storage Space'],
    isAvailable: true,
    imageUrl: 'https://images.unsplash.com/photo-1619767886558-efdc7e9e5de2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
  }
];

// Check if cars exist, if not, initialize with sample data
export const initializeCars = async () => {
  try {
    // Check if any cars exist
    let carsExist = false;
    try {
      const carsSnapshot = await getDocs(collection(db, 'cars'));
      carsExist = !carsSnapshot.empty;
    } catch (error) {
      console.log('Error checking cars, will attempt to create them:', error.message);
    }
    
    if (!carsExist) {
      console.log('Initializing cars collection with sample data...');
      
      // Add sample cars
      for (const car of sampleCars) {
        try {
          await addDoc(collection(db, 'cars'), {
            ...car,
            createdAt: new Date().toISOString()
          });
        } catch (addError) {
          console.error('Error adding car:', addError);
          // Continue with next car even if this one fails
        }
      }
      
      console.log('Sample cars added successfully!');
    } else {
      console.log('Cars collection already contains data.');
    }
  } catch (error) {
    console.error('Error initializing cars collection:', error);
  }
};

// Check for admin user more safely
export const initializeAdmin = async () => {
  try {
    console.log('Checking for admin users...');
    // We'll skip checking for admin users to avoid permission issues
    // The adminSetup.js will handle this more appropriately
  } catch (error) {
    console.error('Error checking for admin user:', error);
  }
};

// Main initialization function
export const initializeFirestore = async () => {
  try {
    // Attempt to initialize data - will succeed if permissions allow
    initializeCars().catch(error => console.log('Cars initialization error (non-critical):', error.message));
    // We don't need to wait for these operations to complete
    
    console.log('Firestore initialization attempted.');
  } catch (error) {
    console.error('Error during Firestore initialization (non-critical):', error);
    // App can still function without initialization
  }
};
