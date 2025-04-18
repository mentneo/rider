import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminCars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [carImage, setCarImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    pricePerKm: '',
    isAvailable: true,
    features: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const carsSnapshot = await getDocs(collection(db, 'cars'));
      const carsData = carsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCars(carsData);
    } catch (error) {
      toast.error('Error fetching cars: ' + error.message);
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setCarImage(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form
      if (!formData.name || !formData.type || !formData.pricePerKm) {
        toast.error('Please fill all required fields');
        return;
      }
      
      // Parse features string into array
      const featuresArray = formData.features
        ? formData.features.split(',').map(feature => feature.trim())
        : [];
      
      let imageUrl = '';
      
      // Upload image to Firebase Storage if a new image is selected
      if (carImage) {
        try {
          const storageRef = ref(storage, `cars/${Date.now()}-${carImage.name}`);
          await uploadBytes(storageRef, carImage);
          imageUrl = await getDownloadURL(storageRef);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error('Error uploading image. Using placeholder instead.');
          // Use a placeholder image if upload fails
          imageUrl = 'https://via.placeholder.com/500x300?text=Car+Image+Not+Available';
        }
      } else if (!editingId) {
        // If adding a new car and no image is selected, use a placeholder
        imageUrl = 'https://via.placeholder.com/500x300?text=Car+Image+Not+Available';
      }
      
      const carData = {
        name: formData.name,
        type: formData.type,
        pricePerKm: parseFloat(formData.pricePerKm),
        isAvailable: formData.isAvailable,
        features: featuresArray,
        updatedAt: new Date().toISOString()
      };
      
      if (imageUrl) {
        carData.imageUrl = imageUrl;
      }
      
      if (editingId) {
        // Update existing car
        await updateDoc(doc(db, 'cars', editingId), carData);
        toast.success('Car updated successfully');
      } else {
        // Add new car
        carData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'cars'), carData);
        toast.success('Car added successfully');
      }
      
      // Reset form
      setFormData({
        name: '',
        type: '',
        pricePerKm: '',
        isAvailable: true,
        features: ''
      });
      setCarImage(null);
      setImagePreview('');
      setEditingId(null);
      setShowAddForm(false);
      
      // Refresh cars list
      fetchCars();
    } catch (error) {
      toast.error('Error saving car: ' + error.message);
      console.error('Error saving car:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCar = async (id) => {
    try {
      setLoading(true);
      
      const carDoc = await getDoc(doc(db, 'cars', id));
      if (carDoc.exists()) {
        const carData = carDoc.data();
        
        setFormData({
          name: carData.name || '',
          type: carData.type || '',
          pricePerKm: carData.pricePerKm?.toString() || '',
          isAvailable: carData.isAvailable !== false, // default to true if undefined
          features: carData.features?.join(', ') || ''
        });
        
        setEditingId(id);
        setShowAddForm(true);
        
        if (carData.imageUrl) {
          setImagePreview(carData.imageUrl);
        }
      }
    } catch (error) {
      toast.error('Error fetching car details: ' + error.message);
      console.error('Error fetching car details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCar = async (id) => {
    if (window.confirm('Are you sure you want to delete this car?')) {
      try {
        setLoading(true);
        
        await deleteDoc(doc(db, 'cars', id));
        
        toast.success('Car deleted successfully');
        
        // Refresh cars list
        fetchCars();
      } catch (error) {
        toast.error('Error deleting car: ' + error.message);
        console.error('Error deleting car:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && cars.length === 0) {
    return <LoadingSpinner text="Loading cars..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Cars</h1>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) {
              setFormData({
                name: '',
                type: '',
                pricePerKm: '',
                isAvailable: true,
                features: ''
              });
              setEditingId(null);
              setCarImage(null);
              setImagePreview('');
            }
          }}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add New Car'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Car' : 'Add New Car'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Car Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Car Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Truck">Truck</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Electric">Electric</option>
                  <option value="Van">Van</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per km ($)
                </label>
                <input
                  type="number"
                  name="pricePerKm"
                  value={formData.pricePerKm}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAvailable"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                  Available for Booking
                </label>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Features (comma separated)
              </label>
              <textarea
                name="features"
                value={formData.features}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Air Conditioning, Bluetooth, GPS, ..."
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Car Image
              </label>
              <input
                type="file"
                onChange={handleImageChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
                accept="image/*"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="h-40 object-cover rounded" />
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
              >
                {loading ? 'Saving...' : (editingId ? 'Update Car' : 'Add Car')}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Car
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price/km
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Features
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cars.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No cars found. Add your first car to get started.
                </td>
              </tr>
            ) : (
              cars.map(car => (
                <tr key={car.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img className="h-10 w-10 rounded-full object-cover" src={car.imageUrl || 'https://via.placeholder.com/150'} alt={car.name} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{car.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {car.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${car.pricePerKm?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      car.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {car.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate">
                      {car.features?.join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditCar(car.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCar(car.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCars;
