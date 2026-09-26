import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Assignment = {
  id: string;
  routeName: string;
  vehicle: string;
  vehicleImage?: string;
  time: string;
  status: 'Pending' | 'In Progress' | 'Completed';
};

interface AssignmentsContextType {
  assignments: Assignment[];
  updateAssignmentStatus: (id: string, status: 'Pending' | 'In Progress' | 'Completed') => void;
}

const AssignmentsContext = createContext<AssignmentsContextType | undefined>(undefined);

export const AssignmentsProvider = ({ children }: { children: ReactNode }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([
    { id: '1', routeName: 'Downtown Deliveries', vehicle: 'Ford Transit (XYZ-1234)', vehicleImage: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=150&h=150', time: '09:00 AM - 02:00 PM', status: 'In Progress' },
    { id: '2', routeName: 'Suburban Route B', vehicle: 'Toyota Sienna (ABC-9876)', vehicleImage: 'https://images.unsplash.com/photo-1579822646631-0eb142b78b88?auto=format&fit=crop&q=80&w=150&h=150', time: '03:00 PM - 07:00 PM', status: 'Pending' },
  ]);

  const updateAssignmentStatus = (id: string, status: 'Pending' | 'In Progress' | 'Completed') => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  return (
    <AssignmentsContext.Provider value={{ assignments, updateAssignmentStatus }}>
      {children}
    </AssignmentsContext.Provider>
  );
};

export const useAssignments = () => {
  const context = useContext(AssignmentsContext);
  if (context === undefined) {
    throw new Error('useAssignments must be used within an AssignmentsProvider');
  }
  return context;
};
