const onlineUsers = new Map(); // userId -> socketId

export function setUserOnline(userId, socketId) {
  onlineUsers.set(userId, socketId);
}

export function setUserOffline(userId, socketId) {
  const current = onlineUsers.get(userId);
  if (current === socketId) onlineUsers.delete(userId);
}

export function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

export function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}