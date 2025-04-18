import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Function to send notification to specific user
export const sendNotificationToUser = async (userId, title, body, data = {}) => {
  try {
    // Get user's FCM token from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists() || !userDoc.data().fcmToken) {
      console.log('User or FCM token not found');
      return false;
    }
    
    const fcmToken = userDoc.data().fcmToken;
    
    // Add notification to user's notifications collection
    const notificationRef = doc(db, 'users', userId, 'notifications', Date.now().toString());
    await setDoc(notificationRef, {
      title,
      body,
      data,
      read: false,
      createdAt: new Date().toISOString()
    });
    
    // Send notification via Firebase Cloud Function (backend) or external service
    // Note: For production, this would typically be done via a server to protect your FCM credentials
    // Here is a placeholder for the API call
    
    console.log('Notification saved to database for user:', userId);
    
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Function to mark a notification as read
export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    await setDoc(doc(db, 'users', userId, 'notifications', notificationId), {
      read: true,
      readAt: new Date().toISOString()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Function to get all notifications for a user
export const getUserNotifications = async (userId, limit = 20) => {
  try {
    const userNotificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(userNotificationsRef, orderBy('createdAt', 'desc'), limit(limit));
    
    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};
