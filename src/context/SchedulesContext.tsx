import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (id: string, updated: Partial<Schedule>) => void;
}

const SchedulesContext = createContext<SchedulesContextType | undefined>(undefined);

export const SchedulesProvider = ({ children }: { children: ReactNode }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([
    { id: '1', title: 'CDL License Renewal', dueDate: 'Nov 15, 2026', daysLeft: 22, type: 'Document', icon: 'document-text', status: 'active', description: '' },
    { id: '2', title: 'Medical Certificate', dueDate: 'Dec 01, 2026', daysLeft: 38, type: 'Document', icon: 'medkit', status: 'active', description: '' },
    { id: '3', title: 'Mandatory Safety Training', dueDate: 'Oct 30, 2026', daysLeft: 6, type: 'Training', icon: 'school', status: 'ignored', description: '' },
    { id: '4', title: 'Vehicle Scheduled Service', dueDate: 'Oct 28, 2026', daysLeft: 4, type: 'Maintenance', icon: 'construct', status: 'completed', description: '' },
  ]);

  const addSchedule = (schedule: Schedule) => {
    setSchedules([schedule, ...schedules]);
  };

  const updateSchedule = (id: string, updated: Partial<Schedule>) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
  };

  return (
    <SchedulesContext.Provider value={{ schedules, setSchedules, addSchedule, updateSchedule }}>
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
