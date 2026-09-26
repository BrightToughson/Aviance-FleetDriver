import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      <View style={styles.card}>
        <View style={styles.profileCircle}>
          <Text style={styles.profileText}>
            D
          </Text>
        </View>
        <Text style={styles.emailText}>
          Mock Driver (Auth Bypassed)
        </Text>

        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={() => {
            router.replace('/(auth)/sign-in');
          }}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#043094', marginBottom: 20 },
  card: { backgroundColor: '#FFF', padding: 30, borderRadius: 12, alignItems: 'center', width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  profileCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#043094', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  profileText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  emailText: { fontSize: 16, color: '#333', fontWeight: '600', marginBottom: 30 },
  signOutButton: { backgroundColor: '#ef4444', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8, width: '100%', alignItems: 'center' },
  signOutText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
