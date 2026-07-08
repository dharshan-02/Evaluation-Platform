import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

export const useSocket = (url = 'http://localhost:5000') => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    // Only connect if user is logged in
    if (!user) return;

    // Get the JWT token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) return;

    socketRef.current = io(url, {
      auth: {
        token
      }
    });

    socketRef.current.on('connect', () => {
      console.log('🔌 WebSocket connected');
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, url]);

  return socketRef.current;
};
