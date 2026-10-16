import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '@clerk/expo';
import { notificationService, NotificationPermissionStatus } from '../services/NotificationService';
import { InAppNotificationBanner } from '../components/InAppNotificationBanner';

export interface AlertMessage {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  timestamp: Date;
  type: 'reminder' | 'schedule' | 'assignment' | 'request' | 'checklist' | string;
}

interface AlertsContextType {
  alerts: AlertMessage[];
  unreadCount: number;
  permissionStatus: NotificationPermissionStatus;
  requestPermissions: () => Promise<boolean>;
  addAlert: (title: string, body: string, type: AlertMessage['type']) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  activeBanner: AlertMessage | null;
  dismissBanner: () => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const AlertsProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>('undetermined');
  const [activeBanner, setActiveBanner] = useState<AlertMessage | null>(null);
  const { user } = useUser();
  const knownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    notificationService.init();
    notificationService.getPermissionStatus().then(status => setPermissionStatus(status));
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    const granted = await notificationService.requestPermissions();
    setPermissionStatus(granted ? 'granted' : 'denied');
    return granted;
  };

  const triggerNotification = (alert: AlertMessage) => {
    setActiveBanner(alert);
    notificationService.sendSystemNotification({
      title: alert.title,
      body: alert.body,
      type: alert.type,
      data: { alertId: alert.id, type: alert.type },
    });
  };

  const fetchAlerts = async () => {
    let loadedAlerts: AlertMessage[] = [];

    // 1. Fetch system & fleet alerts, filtering out manager logs meant for other drivers
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    const driverName = (user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`).trim().toLowerCase();

    if (!error && data) {
      data.forEach((a: any) => {
        // If the alert is directed to a specific user, ensure it matches this driver
        if (a.user_id && user?.id && a.user_id !== user.id) {
          return;
        }

        const bodyLower = (a.body || '').toLowerCase();
        
        // Filter out manager-facing assignment logs ("You assigned ...")
        if (bodyLower.startsWith('you assigned ') || bodyLower.includes('you assigned ')) {
          // If the alert mentions another driver, do NOT show it to this driver!
          if (!driverName || !bodyLower.includes(driverName)) {
            return;
          }
          // If it was assigned to this driver, adapt the wording to the driver's perspective:
          loadedAlerts.push({
            id: a.id,
            title: 'New Assignment',
            body: a.body.replace(/^you assigned /i, 'You have been assigned to '),
            isRead: a.is_read,
            timestamp: new Date(a.created_at),
            type: a.type || 'assignment'
          });
          return;
        }

        loadedAlerts.push({
          id: a.id,
          title: a.title,
          body: a.body,
          isRead: a.is_read,
          timestamp: new Date(a.created_at),
          type: a.type || 'reminder'
        });
      });
    }

    // 2. Fetch assignments specifically created for THIS driver
    if (user?.id) {
      const { data: myAssignments } = await supabase
        .from('assignments')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (myAssignments && myAssignments.length > 0) {
        myAssignments.forEach((a: any) => {
          const pickup = a.start_location?.address || 'Pickup';
          const dropoff = a.end_location?.address || 'Drop-off';
          loadedAlerts.push({
            id: `assign-${a.id}`,
            title: 'New Assignment',
            body: `You have been assigned to route: ${pickup} - ${dropoff}.`,
            isRead: a.status === 'completed',
            timestamp: new Date(a.created_at || a.start_time || Date.now()),
            type: 'assignment'
          });
        });
      }
    }

    // 3. Check for license expiry for THIS driver
    if (user?.id) {
      const { data: details } = await supabase
        .from('driver_details')
        .select('license_expiry')
        .eq('profile_id', user.id)
        .single();
        
      if (details?.license_expiry) {
        const expiryDate = new Date(details.license_expiry);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        
        if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
          loadedAlerts.unshift({
            id: 'local-expiry-alert',
            title: 'License Expiring Soon',
            body: `Your driver license will expire in ${daysUntilExpiry} days (${details.license_expiry}). Please update it to avoid suspension.`,
            isRead: false,
            timestamp: new Date(),
            type: 'reminder'
          });
        } else if (daysUntilExpiry < 0) {
          loadedAlerts.unshift({
            id: 'local-expiry-alert',
            title: 'License Expired!',
            body: `Your driver license expired on ${details.license_expiry}! Please update it immediately.`,
            isRead: false,
            timestamp: new Date(),
            type: 'reminder'
          });
        }
      }
    }

    // Sort all alerts by timestamp descending
    loadedAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Check if there are newly arrived unread alerts to notify
    if (knownIdsRef.current.size > 0) {
      const brandNew = loadedAlerts.find(a => !knownIdsRef.current.has(a.id) && !a.isRead);
      if (brandNew) {
        triggerNotification(brandNew);
      }
    }
    knownIdsRef.current = new Set(loadedAlerts.map(a => a.id));
    setAlerts(loadedAlerts);
  };

  useEffect(() => {
    fetchAlerts();

    const alertsChannel = supabase.channel('driver_alerts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newAlert: AlertMessage = {
              id: payload.new.id?.toString() || Math.random().toString(),
              title: payload.new.title || 'New Fleet Alert',
              body: payload.new.body || '',
              isRead: false,
              timestamp: new Date(payload.new.created_at || Date.now()),
              type: payload.new.type || 'system',
            };
            triggerNotification(newAlert);
          }
          fetchAlerts();
        }
      )
      .subscribe();

    const assignmentsChannel = supabase.channel('driver_assignments_alerts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignments' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            triggerNotification({
              id: `assign_${Date.now()}`,
              title: 'New Assignment',
              body: 'A manager has assigned a new route/vehicle to you.',
              isRead: false,
              timestamp: new Date(),
              type: 'assignment',
            });
          }
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(assignmentsChannel);
    };
  }, [user?.id]); // Re-fetch if user changes

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const addAlert = async (title: string, body: string, type: AlertMessage['type']) => {
    const { error } = await supabase.from('alerts').insert([{ title, body, type, is_read: false }]);
    if (!error) fetchAlerts();
  };

  const markAsRead = async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
    if (!id.startsWith('local-') && !id.startsWith('assign-')) {
      await supabase.from('alerts').update({ is_read: true }).eq('id', id);
    }
  };

  const markAllAsRead = async () => {
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    const dbAlertIds = alerts
      .filter(a => !a.id.startsWith('local-') && !a.id.startsWith('assign-') && !a.isRead)
      .map(a => a.id);
    if (dbAlertIds.length > 0) {
      await supabase.from('alerts').update({ is_read: true }).in('id', dbAlertIds);
    }
  };

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        unreadCount,
        permissionStatus,
        requestPermissions,
        addAlert,
        markAsRead,
        markAllAsRead,
        refreshAlerts: fetchAlerts,
        activeBanner,
        dismissBanner: () => setActiveBanner(null),
      }}
    >
      {children}
      <InAppNotificationBanner
        alert={activeBanner}
        onDismiss={() => setActiveBanner(null)}
      />
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
