import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import type { Notification } from '../types';
import type { User } from 'firebase/auth';

export const useNotifications = (user: User | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Notification[];
      
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    }, (error) => {
      console.error('Notifications Error:', error);
      setNotifications([]);
      setUnreadCount(0);
    });

    return () => {
      unsubscribe();
      // Clean up state when effect cleanup runs
      setNotifications([]);
      setUnreadCount(0);
    };
  }, [user]);

  const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error('Failed to create notification:', e);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true
      });
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { isRead: true });
      });

      await batch.commit();
    } catch (e) {
      console.error('Failed to mark all notifications as read:', e);
    }
  };

  return {
    notifications,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead
  };
};
