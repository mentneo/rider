import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { toast } from 'react-toastify';

// Function to create or verify the admin account
export const setupAdminAccount = async () => {
  const adminEmail = "mentneo6@gmail.com";
  const adminPassword = "itsmeiamabhi";
  const adminName = "Admin User";

  try {
    console.log('Attempting to set up admin account...');
    
    // Try to sign in with admin credentials first
    try {
      const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('Admin credentials valid, checking role...');
      
      // Check if user has admin role and update if needed
      await verifyAdminRole(userCredential.user.uid);
      return true;
    } catch (signInError) {
      // If sign-in fails, the account might not exist, so try to create it
      if (signInError.code === 'auth/user-not-found') {
        console.log('Admin account does not exist, trying to create...');
        return await createAdminAccount(adminEmail, adminPassword, adminName);
      } else {
        console.error('Error signing in with admin credentials:', signInError);
        // Don't show toast for this error to avoid confusion during normal usage
        return false;
      }
    }
  } catch (error) {
    console.error('Error in setupAdminAccount:', error);
    // Don't show error to end users
    return false;
  }
};

// Helper function to create admin account
const createAdminAccount = async (email, password, name) => {
  try {
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with name
    await updateProfile(user, { displayName: name });
    
    // Store in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    
    console.log('Admin account created successfully');
    // Only show this toast in development environment
    if (process.env.NODE_ENV === 'development') {
      toast.success('Admin account created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Error creating admin account:', error);
    
    // Only show error in development environment
    if (process.env.NODE_ENV === 'development') {
      if (error.code === 'auth/email-already-in-use') {
        toast.warning('Admin email already exists but cannot be accessed. Please check Firebase console.');
      } else {
        toast.error('Failed to create admin account');
      }
    }
    return false;
  }
};

// Function to ensure admin has proper role in database
export const verifyAdminRole = async (uid) => {
  try {
    // Get the user document
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    // Check if document exists and has the correct email
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.email === "mentneo6@gmail.com" && userData.role !== 'admin') {
        // Update role to admin
        await setDoc(userRef, { 
          role: 'admin',
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log('Updated user to admin role');
      }
    } else if (uid) {
      // Create the user document if it doesn't exist
      await setDoc(userRef, {
        uid: uid,
        email: "mentneo6@gmail.com",
        name: "Admin User",
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      console.log('Created admin user document');
    }
  } catch (error) {
    console.error('Error verifying admin role:', error);
  }
};
