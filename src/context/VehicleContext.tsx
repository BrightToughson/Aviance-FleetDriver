import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FuelLog {
  id: string;
  date: string;
  gallons: string;
  cost: string;
}

export interface Issue {
  id: string;
  type: string;
  desc: string;
  date: string;
  status: 'Pending' | 'Resolved';
}

export interface Inspection {
  id: string;
  date: string;
  status: 'Passed' | 'Failed';
  vehicle: string;
}

interface VehicleContextType {
  fuelLevel: number;
  updateFuelLevel: (level: number) => void;
  addFuelGallons: (gallons: number) => void;
  fuelLogs: FuelLog[];
  addFuelLog: (log: FuelLog) => void;
  issues: Issue[];
  addIssue: (issue: Issue) => void;
  inspections: Inspection[];
  addInspection: (inspection: Inspection) => void;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider = ({ children }: { children: ReactNode }) => {
  const [fuelLevel, setFuelLevel] = useState<number>(75);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([
    { id: '1', date: 'Oct 20, 2026', gallons: '12.5', cost: '45.00' },
    { id: '2', date: 'Oct 15, 2026', gallons: '10.2', cost: '38.50' },
  ]);
  const [issues, setIssues] = useState<Issue[]>([
    { id: '1', type: 'Maintenance', desc: 'Brakes squeaking on downhill', date: 'Sep 20, 2026', status: 'Pending' },
    { id: '2', type: 'Body Damage', desc: 'Scratch on left rear bumper', date: 'Aug 14, 2026', status: 'Resolved' },
  ]);
  const [inspections, setInspections] = useState<Inspection[]>([
    { id: '1', date: 'Oct 24, 2026', status: 'Passed', vehicle: '2022 Ford Transit (XYZ-1234)' }
  ]);

  const updateFuelLevel = (level: number) => {
    setFuelLevel(level);
  };

  const addFuelGallons = (gallonsAdded: number) => {
    const TANK_CAPACITY_GALLONS = 20; // Placeholder until database is built
    const currentGallons = (fuelLevel / 100) * TANK_CAPACITY_GALLONS;
    let newGallons = currentGallons + gallonsAdded;
    
    // Cap at 100%
    if (newGallons > TANK_CAPACITY_GALLONS) {
      newGallons = TANK_CAPACITY_GALLONS; 
    }
    
    const newPercentage = Math.round((newGallons / TANK_CAPACITY_GALLONS) * 100);
    setFuelLevel(newPercentage);
  };

  const addFuelLog = (log: FuelLog) => {
    setFuelLogs(prev => [log, ...prev]);
  };

  const addIssue = (issue: Issue) => {
    setIssues(prev => [issue, ...prev]);
  };

  const addInspection = (inspection: Inspection) => {
    setInspections(prev => [inspection, ...prev]);
  };

  return (
    <VehicleContext.Provider value={{ fuelLevel, updateFuelLevel, addFuelGallons, fuelLogs, addFuelLog, issues, addIssue, inspections, addInspection }}>
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
