import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '@clerk/expo';

export interface FuelLog {
  id: string;
  date: string;
  gallons: string;
  cost: string;
  vehicleId?: string;
  odometer?: string;
  receiptImage?: string | null;
}

export interface Issue {
  id: string;
  type: string;
  priority?: string;
  vehicleId?: string;
  desc: string;
  date: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
}

export interface Inspection {
  id: string;
  date: string;
  status: 'Passed' | 'Failed';
  vehicle: string;
}

interface VehicleContextType {
  currentVehicle: any | null;
  fuelLevel: number;
  updateFuelLevel: (level: number) => void;
  addFuelGallons: (gallons: number) => Promise<void>;
  fuelLogs: FuelLog[];
  addFuelLog: (log: FuelLog) => Promise<{ success: boolean; error?: string }>;
  issues: Issue[];
  addIssue: (issue: Issue) => Promise<void>;
  inspections: Inspection[];
  addInspection: (inspection: Inspection) => Promise<void>;
  refreshVehicleData: () => Promise<void>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [currentVehicle, setCurrentVehicle] = useState<any | null>(null);
  const [fuelLevel, setFuelLevel] = useState<number>(0);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);

  const fetchVehicleData = async () => {
    if (user?.id) {
      const { data: assignedVehicle } = await supabase
        .from('vehicles')
        .select('*')
        .eq('current_driver_id', user.id)
        .maybeSingle();
      setCurrentVehicle(assignedVehicle || null);
      if (assignedVehicle?.fuel_level !== undefined && assignedVehicle?.fuel_level !== null) {
        setFuelLevel(assignedVehicle.fuel_level);
      } else {
        setFuelLevel(0);
      }

      const [{ data: fLogs }, { data: fIssues }, { data: fInspections }] = await Promise.all([
        supabase.from('fuel_logs').select('*').eq('driver_id', user.id).order('created_at', { ascending: false }),
        supabase.from('issues').select('*').eq('reported_by', user.id).order('created_at', { ascending: false }),
        supabase.from('inspections').select('*, vehicle:vehicles(name)').eq('driver_id', user.id).order('created_at', { ascending: false })
      ]);

      if (fLogs) {
        setFuelLogs(fLogs.map((l: any) => ({
          id: l.id,
          date: new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          gallons: (l.amount || 0).toString(),
          cost: (l.cost || 0).toString(),
        })));
      } else {
        setFuelLogs([]);
      }

      if (fIssues) {
        setIssues(fIssues.map((i: any) => ({
          id: i.id,
          type: i.priority || 'Maintenance',
          desc: i.description,
          date: new Date(i.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          status: i.status === 'resolved' ? 'Resolved' : i.status === 'in_progress' ? 'In Progress' : 'Pending',
        })));
      } else {
        setIssues([]);
      }

      if (fInspections) {
        setInspections(fInspections.map((i: any) => ({
          id: i.id,
          date: new Date(i.inspection_date || i.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          status: i.status === 'pass' ? 'Passed' : 'Failed',
          vehicle: i.vehicle ? i.vehicle.name : 'Current Vehicle'
        })));
      } else {
        setInspections([]);
      }
    } else {
      setCurrentVehicle(null);
      setFuelLevel(0);
      setFuelLogs([]);
      setIssues([]);
      setInspections([]);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchVehicleData();

      // Realtime subscription
      const channel = supabase.channel(`driver_vehicles_changes_${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'vehicles' },
          () => {
            fetchVehicleData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'fuel_logs', filter: `driver_id=eq.${user.id}` },
          () => {
            fetchVehicleData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'issues', filter: `reported_by=eq.${user.id}` },
          () => {
            fetchVehicleData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'inspections', filter: `driver_id=eq.${user.id}` },
          () => {
            fetchVehicleData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setCurrentVehicle(null);
      setFuelLevel(0);
      setFuelLogs([]);
      setIssues([]);
      setInspections([]);
    }
  }, [user?.id]);

  const updateFuelLevel = async (level: number) => {
    setFuelLevel(level);
    if (currentVehicle?.id) {
      await supabase.from('vehicles').update({ fuel_level: level }).eq('id', currentVehicle.id);
    }
  };

  const addFuelGallons = async (gallonsAdded: number) => {
    const TANK_CAPACITY_GALLONS = 20; 
    const currentGallons = (fuelLevel / 100) * TANK_CAPACITY_GALLONS;
    let newGallons = currentGallons + gallonsAdded;
    if (newGallons > TANK_CAPACITY_GALLONS) newGallons = TANK_CAPACITY_GALLONS; 
    
    const newLevel = Math.round((newGallons / TANK_CAPACITY_GALLONS) * 100);
    setFuelLevel(newLevel);
    
    if (currentVehicle?.id) {
      await supabase.from('vehicles').update({ fuel_level: newLevel }).eq('id', currentVehicle.id);
    }
  };

  const addFuelLog = async (log: FuelLog): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload: any = {
        amount: parseFloat(log.gallons) || 0,
        cost: parseFloat(log.cost) || 0,
        date: new Date().toISOString(),
      };

      // Resolve valid vehicle UUID
      let targetVehicleId = log.vehicleId;
      const isUuid = (str?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');
      
      if (!isUuid(targetVehicleId)) {
        if (isUuid(currentVehicle?.id)) {
          targetVehicleId = currentVehicle.id;
        } else if (log.vehicleId) {
          // Look up vehicle by plate or name if available
          const { data: matchedVehicle } = await supabase
            .from('vehicles')
            .select('id')
            .or(`license_plate.ilike.%${log.vehicleId}%,name.ilike.%${log.vehicleId}%`)
            .limit(1)
            .maybeSingle();
          if (matchedVehicle?.id && isUuid(matchedVehicle.id)) {
            targetVehicleId = matchedVehicle.id;
          }
        }
      }

      if (isUuid(targetVehicleId)) {
        payload.vehicle_id = targetVehicleId;
      }

      // Ensure driver profile exists in profiles table so foreign key references succeed
      if (user?.id) {
        payload.driver_id = user.id;

        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!existingProfile) {
          await supabase.from('profiles').upsert([{
            id: user.id,
            full_name: user.fullName || user.firstName || 'Driver',
            email: user.primaryEmailAddress?.emailAddress || '',
            role: 'driver',
            is_driver: true,
            is_manager: false,
          }]);
        }
      }

      if (log.odometer) {
        const odoNum = parseInt(log.odometer.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(odoNum)) {
          payload.odometer = odoNum;
        }
      }

      console.log('Inserting fuel log payload:', payload);
      const { data, error } = await supabase.from('fuel_logs').insert([payload]).select();

      if (error) {
        console.error('Supabase fuel_logs insert error:', error);
        return { success: false, error: error.message || 'Database insert failed' };
      }

      console.log('Fuel log successfully saved:', data);
      await fetchVehicleData();
      return { success: true };
    } catch (err: any) {
      console.error('Error in addFuelLog:', err);
      return { success: false, error: err?.message || 'Unexpected error' };
    }
  };

  const addIssue = async (issue: Issue) => {
    await supabase.from('issues').insert([{ 
      description: `[${issue.type}] ${issue.desc}`, 
      priority: issue.priority ? issue.priority.toLowerCase() : 'low', 
      status: 'open',
      vehicle_id: issue.vehicleId || currentVehicle?.id || null,
      reported_by: user?.id || null
    }]);
    fetchVehicleData();
  };

  const addInspection = async (inspection: Inspection) => {
    await supabase.from('inspections').insert([{ 
      status: inspection.status === 'Passed' ? 'pass' : 'fail',
      driver_id: user?.id || null,
      vehicle_id: currentVehicle?.id || null,
      inspection_date: new Date().toISOString()
    }]);
    fetchVehicleData();
  };

  return (
    <VehicleContext.Provider value={{ currentVehicle, fuelLevel, updateFuelLevel, addFuelGallons, fuelLogs, addFuelLog, issues, addIssue, inspections, addInspection, refreshVehicleData: fetchVehicleData }}>
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicle = () => {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
};
