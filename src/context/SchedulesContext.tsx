import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@clerk/expo';

export type Schedule = {
  id: string;
  title: string;
  dueDate: string;
  daysLeft: number;
  type: string;
  icon: string;
  status: string;
  description: string;
  timestamp?: number;
  isReminder?: boolean;
};

interface SchedulesContextType {
  schedules: Schedule[];
  setSchedules: (updater: Schedule[] | ((prev: Schedule[]) => Schedule[])) => void;
  addSchedule: (schedule: Schedule) => Promise<void>;
  updateSchedule: (id: string, updated: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  clearSchedules: () => Promise<void>;
  refreshSchedules: () => Promise<void>;
}

const SchedulesContext = createContext<SchedulesContextType | undefined>(undefined);

export const SchedulesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [schedules, setSchedulesState] = useState<Schedule[]>([]);

  const fetchSchedules = async () => {
    if (!user?.id) {
      setSchedulesState([]);
      return;
    }
    try {
      const stored = await AsyncStorage.getItem(`@driver_schedules_${user.id}`);
      if (stored) {
        setSchedulesState(JSON.parse(stored));
      } else {
        setSchedulesState([]);
      }
    } catch (e) {
      console.error('Error fetching driver schedules:', e);
      setSchedulesState([]);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [user?.id]);

  const setSchedules = (updater: Schedule[] | ((prev: Schedule[]) => Schedule[])) => {
    setSchedulesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (user?.id) {
        AsyncStorage.setItem(`@driver_schedules_${user.id}`, JSON.stringify(next)).catch(console.error);
      }
      return next;
    });
  };

  const addSchedule = async (schedule: Schedule) => {
    if (!user?.id) return;
    setSchedules(prev => [schedule, ...prev]);
  };

  const updateSchedule = async (id: string, updatedFields: Partial<Schedule>) => {
    if (!user?.id) return;
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updatedFields } : s));
  };

  const deleteSchedule = async (id: string) => {
    if (!user?.id) return;
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const clearSchedules = async () => {
    if (!user?.id) return;
    setSchedulesState([]);
    try {
      await AsyncStorage.removeItem(`@driver_schedules_${user.id}`);
    } catch (e) {
      console.error('Error clearing driver schedules:', e);
    }
  };

  return (
    <SchedulesContext.Provider value={{ 
      schedules, 
      setSchedules, 
      addSchedule, 
      updateSchedule, 
      deleteSchedule,
      clearSchedules,
      refreshSchedules: fetchSchedules 
    }}>
      {children}
    </SchedulesContext.Provider>
  );
};

export const useSchedules = () => {
  const context = useContext(SchedulesContext);
  if (context === undefined) {
    throw new Error('useSchedules must be used within a SchedulesProvider');
  }
  return context;
};
