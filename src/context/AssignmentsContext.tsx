import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '@clerk/expo';

export type Assignment = {
  id: string;
  routeName: string;
  vehicle: string;
  vehicleImage?: string;
  time: string;
  notes?: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupCoords: { latitude: number; longitude: number };
  dropoffCoords: { latitude: number; longitude: number };
  status: 'Pending' | 'In Progress' | 'Completed';
};

interface AssignmentsContextType {
  assignments: Assignment[];
  updateAssignmentStatus: (id: string, status: 'Pending' | 'In Progress' | 'Completed') => Promise<void>;
  updateAssignmentLocation: (id: string, coords: {latitude: number, longitude: number}) => Promise<void>;
  refreshAssignments: () => Promise<void>;
}

const AssignmentsContext = createContext<AssignmentsContextType | undefined>(undefined);

export const AssignmentsProvider = ({ children }: { children: ReactNode }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const { user } = useUser();

  const fetchAssignments = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('assignments')
      .select('*, vehicle:vehicles(name, make, image_url)')
      .eq('driver_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const safeTime = (dStr: string) => { const d = new Date(dStr); return isNaN(d.getTime()) ? '--:--' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };

      setAssignments(data.map((t: any) => ({
        id: t.id,
        routeName: t.start_location?.address ? `${t.start_location.address} to ${t.end_location?.address || '...'}` : 'Assigned Route',
        vehicle: t.vehicle ? `${t.vehicle.name || t.vehicle.make}` : 'Unknown',
        vehicleImage: t.vehicle?.image_url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=150&h=150',
        time: safeTime(t.start_time),
        notes: t.notes || t.task_description || t.description || undefined,
        pickupLocation: t.start_location?.address || 'Unknown Pickup',
        dropoffLocation: t.end_location?.address || 'Unknown Drop-off',
        pickupCoords: t.start_location?.lat ? { latitude: t.start_location.lat, longitude: t.start_location.lng } : { latitude: 5.6037, longitude: -0.1870 },
        dropoffCoords: t.end_location?.lat ? { latitude: t.end_location.lat, longitude: t.end_location.lng } : { latitude: 5.6500, longitude: -0.1500 },
        status: t.status === 'completed' ? 'Completed' : t.status === 'ongoing' ? 'In Progress' : 'Pending',
      })));
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAssignments();

      const channel = supabase
        .channel('public:assignments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, (payload) => {
          fetchAssignments();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setAssignments([]);
    }
  }, [user?.id]);

  const updateAssignmentStatus = async (id: string, status: 'Pending' | 'In Progress' | 'Completed') => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    const dbStatus = status === 'Completed' ? 'completed' : status === 'In Progress' ? 'ongoing' : 'cancelled';
    await supabase.from('assignments').update({ status: dbStatus }).eq('id', id);
  };

  const updateAssignmentLocation = async (id: string, coords: {latitude: number, longitude: number}) => {
    await supabase.from('assignments').update({ current_location: { lat: coords.latitude, lng: coords.longitude } }).eq('id', id);
  };

  return (
    <AssignmentsContext.Provider value={{ assignments, updateAssignmentStatus, updateAssignmentLocation, refreshAssignments: fetchAssignments }}>
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
