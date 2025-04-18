import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA6S5CmwHb-5wN1waHLePJuU6CCDJCtkGQ",
  authDomain: "ridebooking-849fe.firebaseapp.com",
  projectId: "ridebooking-849fe",
  storageBucket: "ridebooking-849fe.firebasestorage.app",
  messagingSenderId: "580980020549",
  appId: "1:580980020549:web:53d0783d04eac334b81a2c",
  measurementId: "G-6PMYEHZP8M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize providers for social login
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Initialize Firebase Cloud Messaging
let messaging = null;

// We need to check if we're in a browser environment and if it supports service workers
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.error('Firebase messaging error:', error);
}

// Function to request notification permission and get FCM token
const requestNotificationPermission = async () => {
  if (!messaging) return null;
  
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // You'll need to replace this with your actual VAPID key
      });
      
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Function to handle foreground messages
const onMessageListener = () => {
  return new Promise((resolve) => {
    if (!messaging) {
      resolve(null);
      return;
    }
    
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

export { 
  auth, 
  db, 
  storage, 
  messaging, 
  googleProvider,
  appleProvider,
  requestNotificationPermission, 
  onMessageListener 
};
