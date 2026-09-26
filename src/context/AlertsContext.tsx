import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export interface AlertMessage {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  timestamp: Date;
  type: 'reminder' | 'schedule' | 'assignment' | 'request' | 'checklist';
}

interface AlertsContextType {
  alerts: AlertMessage[];
  unreadCount: number;
  addAlert: (title: string, body: string, type: AlertMessage['type']) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const AlertsProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<AlertMessage[]>([
    {
      id: 'mock-1',
      title: 'Daily Checklist',
      body: 'Please complete your pre-use inspection for TRK-99.',
      isRead: false,
      timestamp: new Date(),
      type: 'checklist'
    }
  ]);

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const addAlert = (title: string, body: string, type: AlertMessage['type']) => {
    const newAlert: AlertMessage = {
      id: Math.random().toString(),
      title,
      body,
      isRead: false,
      timestamp: new Date(),
      type
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  return (
    <AlertsContext.Provider value={{ alerts, unreadCount, addAlert, markAsRead, markAllAsRead }}>
      {children}
    </AlertsContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
};
