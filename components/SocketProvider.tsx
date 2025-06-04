'use client';
import { io, Socket } from 'socket.io-client';
import React, { createContext, useContext, useEffect, useRef } from 'react';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io('/api/socket');
    }
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>{children}</SocketContext.Provider>
  );
}
