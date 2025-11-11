const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api`;

export const NotificationMapper = {
  getNotifications: `${BASE_URL}/notifications`, // GET?page=&size=&isRead=
  markAsRead: (id: number) => `${BASE_URL}/notifications/${id}/read`,
  deleteNotification: (id: number) => `${BASE_URL}/notifications/${id}`,
  markAllAsRead: `${BASE_URL}/notifications/read-all`,
};

export default NotificationMapper;
