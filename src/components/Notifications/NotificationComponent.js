import React, { useState, useEffect } from 'react';
import { onMessageListener } from '../../firebase/config';
import { toast } from 'react-toastify';

const NotificationComponent = () => {
  const [notification, setNotification] = useState({ title: '', body: '' });

  useEffect(() => {
    // Set up listener for foreground messages
    const unsubscribePromise = onMessageListener();
    
    unsubscribePromise.then((payload) => {
      if (payload) {
        setNotification({
          title: payload.notification.title,
          body: payload.notification.body
        });
        
        // Show toast notification
        toast.info(
          <div>
            <h4 className="font-bold">{payload.notification.title}</h4>
            <p>{payload.notification.body}</p>
          </div>, 
          {
            autoClose: 5000
          }
        );
      }
    }).catch(err => console.log('Failed to set up notification listener:', err));

    return () => {
      // Clean up the listener
      // Note: Since onMessageListener returns a Promise, we can't directly unsubscribe
      // The Firebase messaging listener is managed internally
    };
  }, []);

  return null; // This component doesn't render anything, it just handles notifications
};

export default NotificationComponent;
