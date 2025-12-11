import { Bell, CheckCheck, ArrowLeft } from 'lucide-react';
import type { Notification } from '../types';

interface NotificationsScreenProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
  onBack: () => void;
}

const formatTimeAgo = (timestamp: { seconds?: number } | number | null): string => {
  if (!timestamp) return 'Just now';
  
  const seconds = typeof timestamp === 'object' && timestamp.seconds ? timestamp.seconds : (typeof timestamp === 'number' ? timestamp / 1000 : 0);
  const now = Date.now() / 1000;
  const diff = now - seconds;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
};

export const NotificationsScreen = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  onBack
}: NotificationsScreenProps) => {
  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <div className="fixed inset-0 bg-slate-100 z-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
            <p className="text-xs text-gray-500">
              {notifications.length} total
            </p>
          </div>
        </div>
        {hasUnread && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium transition-colors"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
            <Bell size={48} strokeWidth={1} className="mb-4 opacity-50" />
            <p className="text-center">No notifications yet</p>
            <p className="text-xs text-center mt-2">
              You'll be notified when someone assigns you to a problem
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => {
                  if (!notification.isRead) {
                    onMarkAsRead(notification.id);
                  }
                  onNotificationClick(notification);
                }}
                className={`w-full px-4 py-4 flex gap-3 hover:bg-gray-50 transition-colors text-left ${
                  !notification.isRead ? 'bg-blue-50/50' : 'bg-white'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  !notification.isRead ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Bell size={18} className={!notification.isRead ? 'text-blue-600' : 'text-gray-400'} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-sm font-medium ${
                      !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      New problem assignment
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium text-blue-600">
                      {notification.assignedByName}
                    </span>
                    {' '}assigned you to{' '}
                    <span className="font-medium">
                      {notification.problemTitle}
                    </span>
                  </p>
                  {!notification.isRead && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mt-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      Unread
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
