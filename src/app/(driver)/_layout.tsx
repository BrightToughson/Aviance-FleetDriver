import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text, useWindowDimensions, TouchableOpacity, Image, TextInput } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertsProvider, useAlerts } from '../../context/AlertsContext';
import { SchedulesProvider } from '../../context/SchedulesContext';
import { AssignmentsProvider } from '../../context/AssignmentsContext';
import { VehicleProvider } from '../../context/VehicleContext';

function CustomDrawerContent(props: any) {
  const router = useRouter();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.header}>
        <View style={styles.profileCircle}>
          <Text style={styles.profileText}>
            D
          </Text>
        </View>
        <Text style={styles.emailText}>
          Mock Driver
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <DrawerItemList {...props} />
      </View>
      <View style={styles.footer}>
        <DrawerItem
          label="Sign Out"
          icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color={color} />}
          onPress={() => {
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
            placeholder="Search..." 
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

export default function DriverLayout() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

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
            drawerLabel: 'Dashboard',
            title: 'Dashboard',
            drawerIcon: ({ color, size }) => <Ionicons name="speedometer-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="assignments"
          options={{
            drawerLabel: 'Assignments',
            title: 'Assignments',
            drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="inspections"
          options={{
            drawerLabel: 'Pre-use Inspections',
            title: 'Inspections',
            drawerIcon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="fuel"
          options={{
            drawerLabel: 'Log Fuel/Fill Ups',
            title: 'Fuel Log',
            drawerIcon: ({ color, size }) => <Ionicons name="water-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="issues"
          options={{
            drawerLabel: 'Report Issues',
            title: 'Report Issues',
            drawerIcon: ({ color, size }) => <Ionicons name="warning-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="requests"
          options={{
            drawerLabel: 'Requests',
            title: 'Requests',
            drawerIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="alerts"
          options={{
            drawerLabel: 'Alerts',
            title: 'Alerts',
            drawerIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="reminders"
          options={{
            drawerLabel: 'Reminders',
            title: 'Reminders',
            drawerIcon: ({ color, size }) => <Ionicons name="alarm-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="schedules"
          options={{
            drawerLabel: 'Schedules',
            title: 'Schedules',
            drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            drawerLabel: 'Profile',
            title: 'Profile',
            drawerIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
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
});
