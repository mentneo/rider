import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, appleProvider, requestNotificationPermission } from '../firebase/config';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for redirect result when component mounts (for Apple auth)
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          // Handle the signed-in user information
          await handleSocialSignIn(result.user);
        }
      } catch (error) {
        console.error("Error with redirect sign-in:", error);
        toast.error("Error with social sign-in: " + error.message);
      }
    };
    
    checkRedirectResult();
  }, []);

  // Helper function to store user role in localStorage
  const saveUserRoleToLocalStorage = (role) => {
    try {
      localStorage.setItem('userRole', role);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Helper function to get user role from localStorage
  const getUserRoleFromLocalStorage = () => {
    try {
      return localStorage.getItem('userRole');
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  };

  // Helper function to validate if user is admin
  const validateAdminRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error validating admin role:', error);
      return false;
    }
  };

  // Helper function to fetch user data from Firestore
  const fetchUserData = async (user) => {
    if (!user) {
      setUserRole(null);
      saveUserRoleToLocalStorage(null);
      return null;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role || 'customer';
        setUserRole(role);
        saveUserRoleToLocalStorage(role);
        return userData;
      } else {
        console.log('No user document found for:', user.uid);
        setUserRole('customer'); // Default role
        saveUserRoleToLocalStorage('customer');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserRole('customer'); // Default role on error
      saveUserRoleToLocalStorage('customer');
      return null;
    }
  };

  async function register(email, password, name, role = 'customer') {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, { displayName: name });
      
      // Add user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        role,
        createdAt: new Date().toISOString()
      });
      
      // Request notification permission and save FCM token
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) {
        await setDoc(doc(db, 'users', user.uid), {
          fcmToken
        }, { merge: true });
      }
      
      // Update context state
      setUserRole(role);
      saveUserRoleToLocalStorage(role);
      
      return user;
    } catch (error) {
      console.error('Error in register:', error);
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // After successful login, request notification permission and save FCM token
      const fcmToken = await requestNotificationPermission();
      if (fcmToken && userCredential.user) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          fcmToken,
          lastLogin: new Date().toISOString()
        }, { merge: true });
        
        // Show welcome back notification
        if (Notification.permission === 'granted') {
          new Notification('Welcome back!', {
            body: `You've successfully logged in to Car Booking App`,
            icon: '/logo192.png'
          });
        }
      }
      
      await fetchUserData(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  }

  // Function to log in admin specifically
  async function adminLogin(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // After login, verify this is actually an admin
      const isAdmin = await validateAdminRole(userCredential.user.uid);
      
      if (!isAdmin) {
        // If not admin, log out and throw error
        await signOut(auth);
        throw new Error('Access denied. Admin privileges required.');
      }
      
      // If is admin, proceed with setting user data
      await fetchUserData(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  }

  async function loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleSocialSignIn(result.user);
      return result.user;
    } catch (error) {
      console.error('Error in Google login:', error);
      throw error;
    }
  }

  async function loginWithApple() {
    try {
      // Apple login works better with redirect on mobile
      await signInWithRedirect(auth, appleProvider);
      // The result will be handled in the useEffect checking for redirect results
    } catch (error) {
      console.error('Error in Apple login:', error);
      throw error;
    }
  }

  async function handleSocialSignIn(user) {
    try {
      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // New user, create a document
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName || 'User',
          email: user.email,
          role: 'customer', // Default role for social login
          createdAt: new Date().toISOString(),
          authProvider: user.providerData[0].providerId
        });
      }
      
      // Get FCM token and update the user document
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) {
        await setDoc(doc(db, 'users', user.uid), {
          fcmToken,
          lastLogin: new Date().toISOString()
        }, { merge: true });
      }
      
      toast.success('Login successful!');
    } catch (error) {
      console.error('Error in social sign-in:', error);
      throw error;
    }
  }

  function logout() {
    saveUserRoleToLocalStorage(null);
    localStorage.removeItem('userRole');
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Get user role from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
            saveUserRoleToLocalStorage(userDoc.data().role);
          } else {
            setUserRole('customer'); // Default role
            saveUserRoleToLocalStorage('customer');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('customer'); // Default role on error
          saveUserRoleToLocalStorage('customer');
        }
      } else {
        setUserRole(null);
        localStorage.removeItem('userRole');
      }
      
      setLoading(false);
    });

    // Check if we have a cached role while waiting for Firebase
    const cachedRole = getUserRoleFromLocalStorage();
    if (cachedRole) {
      setUserRole(cachedRole);
    }

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    register,
    login,
    adminLogin,
    loginWithGoogle,
    loginWithApple,
    logout,
    isAdmin: userRole === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
