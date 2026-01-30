import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(window.location.origin, {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        setConnected(true);
        newSocket.emit('join', user._id);
      });

      newSocket.on('disconnect', () => {
        setConnected(false);
      });

      newSocket.on('new_request', (data) => {
        toast.success(`New request from ${data.developerName}`, {
          icon: '📋',
        });
      });

      newSocket.on('request_updated', (data) => {
        if (data.status === 'executed') {
          toast.success('Your query has been executed! View results now.', {
            icon: '✅',
          });
        } else if (data.status === 'rejected') {
          toast.error('Your request has been rejected.', {
            icon: '❌',
          });
        } else if (data.status === 'failed') {
          toast.error('Query execution failed. Check details.', {
            icon: '⚠️',
          });
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const value = {
    socket,
    connected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
