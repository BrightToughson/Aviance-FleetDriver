import React, { useState, useEffect, useRef } from 'react';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text, useWindowDimensions, TouchableOpacity, Image, TextInput, Animated } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from 'expo-router/drawer';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertsProvider, useAlerts } from '../../context/AlertsContext';
import { SchedulesProvider } from '../../context/SchedulesContext';
import { AssignmentsProvider } from '../../context/AssignmentsContext';
import { VehicleProvider } from '../../context/VehicleContext';

import { useAuth, useUser } from '@clerk/expo';
import { supabase } from '../../lib/supabase';

function CustomDrawerContent(props: any) {
  const router = useRouter();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { user } = useUser();

  const getInitials = () => {
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.emailAddresses?.[0]?.emailAddress) return user.emailAddresses[0].emailAddress[0].toUpperCase();
    return 'D';
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(driver)/profile')}>
          <View style={styles.profileCircle}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={{ width: 60, height: 60, borderRadius: 30 }} />
            ) : (
              <Text style={styles.profileText}>{getInitials()}</Text>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.emailText} numberOfLines={1}>
          {user?.fullName || user?.emailAddresses?.[0]?.emailAddress || t('d_layout_mock', 'Driver')}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <DrawerItemList {...props} />
      </View>
      <View style={styles.footer}>
        <LanguageSelector />
        <DrawerItem
          label={t('common_sign_out', 'Sign Out')}
          icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color={color} />}
          onPress={async () => {
            try {
              await signOut();
            } catch (e) {
              console.warn('Sign out error:', e);
            }
            router.replace('/(auth)/sign-in');
          }}
          labelStyle={{ color: '#ef4444' }}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const CustomHeader = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const isMobile = width < 768;
  const router = useRouter();
  const { t } = useTranslation();
  const { unreadCount } = useAlerts();

  return (
    <View style={[styles.customHeaderContainer, { height: 70 }]}>
      <View style={styles.headerLeftArea}>
        {!isLargeScreen && (
          <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginRight: 15 }}>
            <Ionicons name="menu" size={28} color="#333" />
          </TouchableOpacity>
        )}
        <Image 
          source={require('../../../assets/images/logo/logo.png')} 
          style={{ width: isMobile ? 110 : 140, height: 35, resizeMode: 'contain' }} 
        />
      </View>

      {!isMobile && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput 
            placeholder={t('d_layout_search_ph', 'Search...')}
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      )}

      <View style={styles.headerRightArea}>
        {isMobile && (
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(driver)/search')}>
            <Ionicons name="search" size={24} color="#4B5563" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(driver)/alerts')}>
          <Ionicons name="notifications-outline" size={24} color="#4B5563" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        {!isMobile && (
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(driver)/help')}>
            <Ionicons name="help-circle-outline" size={24} color="#4B5563" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(driver)/new-request')}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ToastManager = () => null;

export default function DriverLayout() {
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const isLargeScreen = width >= 768;
  const { user } = useUser();

  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (user?.id) {
      const fetchUnread = async () => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false);
        setUnreadMessages(count || 0);
      };
      
      fetchUnread();

      const channel = supabase
        .channel('public:messages:driver_badge')
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          }, () => {
            fetchUnread();
          })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  return (
    <VehicleProvider>
    <AssignmentsProvider>
    <SchedulesProvider>
      <AlertsProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Drawer
            backBehavior="history"
            drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={({ navigation }) => ({
          drawerType: isLargeScreen ? 'permanent' : 'front',
          drawerStyle: isLargeScreen ? { width: 280 } : undefined,
          drawerActiveBackgroundColor: '#043094',
          drawerActiveTintColor: '#fff',
          drawerInactiveTintColor: '#333',
          header: (props) => <CustomHeader {...props} />
        })}
      >
        <Drawer.Screen
          name="dashboard"
          options={{
            drawerLabel: t('d_menu_dashboard', 'Dashboard'),
            title: t('d_menu_dashboard', 'Dashboard'),
            drawerIcon: ({ color, size }) => <Ionicons name="speedometer-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="assignments"
          options={{
            drawerLabel: t('d_menu_assignments', 'Assignments'),
            title: t('d_menu_assignments', 'Assignments'),
            drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="equipments"
          options={{
            drawerLabel: 'My Equipment',
            title: 'My Equipment',
            drawerIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="inspections"
          options={{
            drawerLabel: t('d_menu_inspections', 'Pre-use Inspections'),
            title: t('d_menu_inspections', 'Inspections'),
            drawerIcon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="fuel"
          options={{
            drawerLabel: t('d_menu_fuel', 'Log Fuel/Fill Ups'),
            title: t('d_menu_fuel', 'Fuel Log'),
            drawerIcon: ({ color, size }) => <Ionicons name="water-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="issues"
          options={{
            drawerLabel: t('d_menu_issues', 'Report Issues'),
            title: t('d_menu_issues', 'Report Issues'),
            drawerIcon: ({ color, size }) => <Ionicons name="warning-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="messages"
          options={{
            drawerLabel: ({ color }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1, marginRight: -16 }}>
                <Text style={{ color, fontWeight: '500' }}>{t('d_menu_messages', 'Messages')}</Text>
                {unreadMessages > 0 && (
                  <View style={{ backgroundColor: '#10B981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, minWidth: 22, alignItems: 'center', marginRight: 16 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{unreadMessages}</Text>
                  </View>
                )}
              </View>
            ),
            title: t('d_menu_messages', 'Messages'),
            drawerIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="requests"
          options={{
            drawerLabel: t('d_menu_requests', 'Requests'),
            title: t('d_menu_requests', 'Requests'),
            drawerIcon: ({ color, size }) => <Ionicons name="git-pull-request-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="alerts"
          options={{
            drawerLabel: t('d_menu_alerts', 'Alerts'),
            title: t('d_menu_alerts', 'Alerts'),
            drawerIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="reminders"
          options={{
            drawerLabel: t('d_menu_reminders', 'Reminders'),
            title: t('d_menu_reminders', 'Reminders'),
            drawerIcon: ({ color, size }) => <Ionicons name="alarm-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="schedules"
          options={{
            drawerLabel: t('d_menu_schedules', 'Schedules'),
            title: t('d_menu_schedules', 'Schedules'),
            drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            drawerLabel: t('d_menu_profile', 'Profile'),
            title: t('d_menu_profile', 'Profile'),
            drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="edit-profile"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false
          }}
        />
        <Drawer.Screen
          name="issue-details"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false
          }}
        />
        <Drawer.Screen
          name="messages/[id]"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false
          }}
        />
        <Drawer.Screen
          name="new-request"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false
          }}
        />
        <Drawer.Screen
          name="search"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false
          }}
        />
        <Drawer.Screen
          name="help"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false
          }}
        />
        <Drawer.Screen
          name="vehicle-details"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false
          }}
        />
        <Drawer.Screen
          name="assignments/[id]"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false
          }}
        />
        <Drawer.Screen
          name="trip/[id]"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false
          }}
        />
      </Drawer>
      <ToastManager />
      </GestureHandlerRootView>
    </AlertsProvider>
    </SchedulesProvider>
    </AssignmentsProvider>
    </VehicleProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
    alignItems: 'center',
  },
  profileCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#043094',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  emailText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  footer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  customHeaderContainer: {
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeftArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    flex: 1,
    marginHorizontal: 20,
    maxWidth: 600,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#111827',
    outlineStyle: 'none',
  } as any,
  headerRightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    marginLeft: 20,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  addButton: {
    marginLeft: 20,
    backgroundColor: '#043094',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -175,
    width: 350,
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 9999,
  },
  toastIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#043094',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  toastBody: {
    fontSize: 14,
    color: '#4B5563',
  },
});
