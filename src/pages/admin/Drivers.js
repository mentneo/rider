import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../firebase/config';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [driverImage, setDriverImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    isAvailable: true,
    password: '',
    address: ''
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch drivers on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      
      // Query for all users with role 'driver'
      const driversQuery = query(
        collection(db, 'users'),
        where('role', '==', 'driver')
      );
      
      const driversSnapshot = await getDocs(driversQuery);
      const driversData = driversSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setDrivers(driversData);
    } catch (error) {
      toast.error('Error fetching drivers: ' + error.message);
      console.error('Error fetching drivers:', error);
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
      setDriverImage(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    
    try {
      setActionLoading(true);
      
      // Validate form
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        toast.error('Please fill all required fields');
        return;
      }
      
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      const user = userCredential.user;
      
      // Update profile name
      await updateProfile(user, {
        displayName: formData.name
      });
      
      // Upload image if selected
      let imageUrl = '';
      if (driverImage) {
        const storageRef = ref(storage, `drivers/${user.uid}`);
        await uploadBytes(storageRef, driverImage);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Add driver to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        address: formData.address,
        role: 'driver',
        isAvailable: formData.isAvailable,
        imageUrl: imageUrl,
        createdAt: new Date().toISOString()
      });
      
      toast.success('Driver added successfully');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        licenseNumber: '',
        isAvailable: true,
        password: '',
        address: ''
      });
      setDriverImage(null);
      setImagePreview(null);
      setShowAddForm(false);
      
      // Refresh drivers list
      fetchDrivers();
      
    } catch (error) {
      console.error('Error adding driver:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already in use. Please use a different email.');
      } else {
        toast.error('Error adding driver: ' + error.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditDriver = (driver) => {
    setEditingId(driver.id);
    setFormData({
      name: driver.name || '',
      email: driver.email || '',
      phone: driver.phone || '',
      licenseNumber: driver.licenseNumber || '',
      isAvailable: driver.isAvailable !== false,
      password: '', // Don't populate password
      address: driver.address || ''
    });
    
    if (driver.imageUrl) {
      setImagePreview(driver.imageUrl);
    } else {
      setImagePreview(null);
    }
    
    setShowAddForm(true);
  };

  const handleUpdateDriver = async (e) => {
    e.preventDefault();
    
    try {
      setActionLoading(true);
      
      // Validate form
      if (!formData.name || !formData.email || !formData.phone) {
        toast.error('Please fill all required fields');
        return;
      }
      
      // Prepare updated data
      const driverData = {
        name: formData.name,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        address: formData.address,
        isAvailable: formData.isAvailable,
        updatedAt: new Date().toISOString()
      };
      
      // Upload new image if selected
      if (driverImage) {
        const storageRef = ref(storage, `drivers/${editingId}`);
        await uploadBytes(storageRef, driverImage);
        driverData.imageUrl = await getDownloadURL(storageRef);
      }
      
      // Update driver in Firestore
      await updateDoc(doc(db, 'users', editingId), driverData);
      
      toast.success('Driver updated successfully');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        licenseNumber: '',
        isAvailable: true,
        password: '',
        address: ''
      });
      setDriverImage(null);
      setImagePreview(null);
      setEditingId(null);
      setShowAddForm(false);
      
      // Refresh drivers list
      fetchDrivers();
    } catch (error) {
      toast.error('Error updating driver: ' + error.message);
      console.error('Error updating driver:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDriver = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        setActionLoading(true);
        
        // In a real app, you'd want to handle deleting the auth user too
        // But deleting auth users requires special Firebase Admin SDK privileges
        // So for now, we'll just delete the Firestore document
        await deleteDoc(doc(db, 'users', id));
        
        toast.success('Driver deleted successfully');
        
        // Refresh drivers list
        fetchDrivers();
      } catch (error) {
        toast.error('Error deleting driver: ' + error.message);
        console.error('Error deleting driver:', error);
      } finally {
        setActionLoading(false);
      }
    }
  };

  if (loading && drivers.length === 0) {
    return <LoadingSpinner text="Loading drivers..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Drivers</h1>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) {
              // Reset form when opening
              setFormData({
                name: '',
                email: '',
                phone: '',
                licenseNumber: '',
                isAvailable: true,
                password: '',
                address: ''
              });
              setDriverImage(null);
              setImagePreview(null);
              setEditingId(null);
            }
          }}
          className={`${showAddForm ? 'bg-gray-500' : 'bg-primary'} text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors`}
        >
          {showAddForm ? 'Cancel' : 'Add New Driver'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Update Driver' : 'Add New Driver'}</h2>
          <form onSubmit={editingId ? handleUpdateDriver : handleAddDriver}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
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
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                  disabled={!!editingId} // Disable email editing for existing drivers
                />
                {editingId && (
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed after creation.</p>
                )}
              </div>
              
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    required={!editingId}
                    minLength="6"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div className="md:col-span-2">
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
                    Available for Assignment
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver Photo
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
                disabled={actionLoading}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
              >
                {actionLoading ? 'Processing...' : (editingId ? 'Update Driver' : 'Add Driver')}
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
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {drivers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No drivers found. Add your first driver to get started.
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {driver.imageUrl ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={driver.imageUrl} alt={driver.name} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary-light text-primary flex items-center justify-center">
                            {driver.name?.charAt(0).toUpperCase() || 'D'}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                        <div className="text-sm text-gray-500">{driver.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.email}</div>
                    <div className="text-sm text-gray-500">{driver.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {driver.licenseNumber || 'Not provided'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      driver.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {driver.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditDriver(driver)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDriver(driver.id)}
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

export default AdminDrivers;
