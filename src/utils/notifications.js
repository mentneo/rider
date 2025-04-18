import { collection, addDoc, query, where, orderBy, getDocs, doc, updateDoc, limit, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

/**
 * Create a new notification in the database
 * @param {string} userId - User ID to receive notification
 * @param {Object} notification - Notification data
 * @returns {Promise<string>} Notification ID
 */
export const createNotification = async (userId, notification) => {
  try {
    // Validate notification object
    if (!notification.title || !notification.message) {
      throw new Error('Notification must have title and message');
    }

    // Create notification with default fields
    const notificationData = {
      ...notification,
      userId,
      read: false,
      createdAt: new Date().toISOString()
    };

    // Add to the notifications collection
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const docRef = await addDoc(notificationsRef, notificationData);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get all notifications for a user
 * @param {string} userId - User ID
 * @param {number} limitCount - Maximum number of notifications to retrieve
 * @returns {Promise<Array>} Array of notification objects
 */
export const getUserNotifications = async (userId, limitCount = 50) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(
      notificationsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
export const getUnreadCount = async (userId) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(
      notificationsRef,
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return 0;
  }
};

/**
 * Mark a notification as read
 * @param {string} userId - User ID
 * @param {string} notificationId - ID of notification to mark
 * @returns {Promise<boolean>} Success status
 */
export const markAsRead = async (userId, notificationId) => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const markAllAsRead = async (userId) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, where('read', '==', false));
    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        read: true,
        readAt: new Date().toISOString()
      })
    );
    
    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

/**
 * Delete a notification
 * @param {string} userId - User ID
 * @param {string} notificationId - ID of notification to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteNotification = async (userId, notificationId) => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await deleteDoc(notificationRef);
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

/**
 * Send a notification to specific user types (admin, driver, etc)
 * @param {string} role - User role to target (admin, driver, customer)
 * @param {Object} notification - Notification data
 * @returns {Promise<number>} Number of notifications sent
 */
export const sendNotificationToRole = async (role, notification) => {
  try {
    // Get all users with specific role
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    const querySnapshot = await getDocs(q);
    
    let sentCount = 0;
    
    // Create notifications for each user
    const promises = querySnapshot.docs.map(async (userDoc) => {
      try {
        await createNotification(userDoc.id, notification);
        sentCount++;
      } catch (error) {
        console.error(`Failed to send notification to user ${userDoc.id}:`, error);
      }
    });
    
    await Promise.all(promises);
    return sentCount;
  } catch (error) {
    console.error('Error sending notifications to role:', error);
    throw error;
  }
};

export default {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotificationToRole
};
