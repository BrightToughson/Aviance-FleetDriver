import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth, useUser } from '@clerk/expo';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [isJoinFleetVisible, setIsJoinFleetVisible] = useState(false);
  const [fleetCode, setFleetCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const { join } = useLocalSearchParams<{ join?: string }>();

  React.useEffect(() => {
    if (user?.id) {
      fetchDriverProfile();
      
      const channel = supabase.channel('driver_own_details_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'driver_details', filter: `profile_id=eq.${user.id}` },
          () => {
            fetchDriverProfile();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  React.useEffect(() => {
    if (join === 'true') {
      setIsJoinFleetVisible(true);
      // Optional: Clear the param by replacing the route so it doesn't stay open on refresh
      router.setParams({ join: undefined });
    }
  }, [join]);

  const fetchDriverProfile = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number, created_at, manager_id, status')
        .eq('id', user!.id)
        .maybeSingle();
        
      const { data: details } = await supabase
        .from('driver_details')
        .select('license_number, license_expiry')
        .eq('profile_id', user!.id)
        .maybeSingle();
        
      let managerName = 'N/A';
      let fleetCode = 'N/A';
      if (profile?.manager_id) {
        const { data: managerProfile } = await supabase
          .from('profiles')
          .select('full_name, fleet_code')
          .eq('id', profile.manager_id)
          .maybeSingle();
        if (managerProfile) {
          managerName = managerProfile.full_name || 'Fleet Manager';
          fleetCode = managerProfile.fleet_code || 'N/A';
        }
      }
        
      setDriverProfile({
        phone: profile?.phone_number,
        joinedDate: profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A',
        licenseNumber: details?.license_number,
        licenseExpiry: details?.license_expiry,
        status: profile?.status || 'Active',
        managerId: profile?.manager_id,
        managerName,
        fleetCode,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const getLicenseExpiryInfo = (expStr?: string) => {
    if (!expStr) return { text: 'Not set', color: '#9CA3AF', isUrgent: false, badge: null, badgeBg: '#F3F4F6', badgeColor: '#6B7280' };
    try {
      const expDate = new Date(expStr);
      if (isNaN(expDate.getTime())) return { text: expStr, color: '#111827', isUrgent: false, badge: null, badgeBg: '#F3F4F6', badgeColor: '#6B7280' };
      
      const formatted = expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { 
          text: formatted, 
          color: '#EF4444', 
          isUrgent: true, 
          badge: 'Expired', 
          badgeColor: '#EF4444', 
          badgeBg: '#FEE2E2' 
        };
      }
      if (diffDays === 0) {
        return { 
          text: formatted, 
          color: '#DC2626', 
          isUrgent: true, 
          badge: 'Expires Today', 
          badgeColor: '#DC2626', 
          badgeBg: '#FEE2E2' 
        };
      }
      if (diffDays <= 30) {
        return { 
          text: formatted, 
          color: '#D97706', 
          isUrgent: true, 
          badge: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} left`, 
          badgeColor: '#B45309', 
          badgeBg: '#FEF3C7' 
        };
      }
      return { 
        text: formatted, 
        color: '#111827', 
        isUrgent: false, 
        badge: `${diffDays} days left`, 
        badgeColor: '#059669', 
        badgeBg: '#ECFDF5' 
      };
    } catch {
      return { text: expStr, color: '#111827', isUrgent: false, badge: null, badgeBg: '#F3F4F6', badgeColor: '#6B7280' };
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleJoinFleet = async () => {
    if (!fleetCode.trim()) {
      if (Platform.OS === 'web') window.alert('Please enter a fleet code.');
      else Alert.alert('Error', 'Please enter a fleet code.');
      return;
    }
    setIsJoining(true);
    try {
      // Find manager by fleet code
      const { data: managerProfile, error: codeError } = await supabase
        .from('profiles')
        .select('id')
        .eq('fleet_code', fleetCode.trim().toUpperCase())
        .single();

      if (codeError || !managerProfile) {
        throw new Error('Invalid Fleet Invite Code. Please check with your manager.');
      }

      // Update driver profile with new manager_id and driver role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          manager_id: managerProfile.id,
          role: 'driver',
          is_driver: true,
          is_manager: false,
        })
        .eq('id', user!.id);

      if (updateError) throw updateError;

      if (Platform.OS === 'web') window.alert('Successfully joined the fleet!');
      else Alert.alert('Success', 'Successfully joined the fleet!');
      
      setIsJoinFleetVisible(false);
      setFleetCode('');
      fetchDriverProfile();
    } catch (error: any) {
      if (Platform.OS === 'web') window.alert(error.message);
      else Alert.alert('Error', error.message);
    } finally {
      setIsJoining(false);
    }
  };

  const uploadToSupabase = async (uri: string, bucket: string, path: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
      // Append a timestamp to break the browser/React Native image cache!
      return `${publicUrl}?t=${new Date().getTime()}`;
    } catch (e: any) {
      console.error("Upload error:", e.message);
      return null;
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].uri) {
        setIsUploading(true);
        const imageUri = result.assets[0].uri;
        
        if (user?.id) {
          // 1. Upload to Supabase Bucket
          const newAvatarUrl = await uploadToSupabase(imageUri, 'avatars', `${user.id}/profile.jpg`);
          
          if (newAvatarUrl) {
            // 2. Update Supabase Profile Table
            await supabase.from('profiles').update({ avatar_url: newAvatarUrl }).eq('id', user.id);
            
            // 3. Update Clerk Profile (optional, but good for sync)
            try {
              if (result.assets[0].base64) {
                const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                await user.setProfileImage({ file: base64Image });
              }
            } catch (clerkErr) {
               console.log("Clerk upload skipped or failed", clerkErr);
            }
            
            if (Platform.OS === 'web') window.alert("Profile photo updated successfully!");
          }
        }
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      if (Platform.OS === 'web') window.alert("Failed to update profile photo.");
    } finally {
      setIsUploading(false);
    }
  };

  // Create a short, memorable ID using the last 6 characters of the Clerk user ID
  const memorableId = user?.id ? user.id.substring(user.id.length - 6).toUpperCase() : 'N/A';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage} disabled={isUploading}>
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageText}>
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'D'}
              </Text>
            </View>
          )}
          
          <View style={styles.editBadge}>
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={16} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        
        <Text style={styles.name}>{user?.fullName || 'Driver'}</Text>
        <Text style={styles.role}>{t('d_profile_role_driver', 'Active Driver')}</Text>
        <Text style={styles.email}>
          {user?.emailAddresses?.[0]?.emailAddress || 'No Contact Info'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('d_profile_account_info', 'Account Information')}</Text>
        
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="finger-print-outline" size={20} color="#4B5563" />
            <Text style={styles.rowText}>Account ID</Text>
          </View>
          <Text style={styles.rowRightText}>{memorableId}</Text>
        </View>

        <TouchableOpacity style={styles.row} onPress={() => router.push('/(driver)/edit-profile')}>
          <View style={styles.rowLeft}>
            <Ionicons name="person-outline" size={20} color="#4B5563" />
            <Text style={styles.rowText}>{t('d_profile_edit', 'Edit Profile')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="lock-closed-outline" size={20} color="#4B5563" />
            <Text style={styles.rowText}>{t('d_profile_change_password', 'Change Password')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {(!driverProfile?.managerId) && (
          <TouchableOpacity style={styles.row} onPress={() => setIsJoinFleetVisible(true)}>
            <View style={styles.rowLeft}>
              <Ionicons name="business-outline" size={20} color="#043094" />
              <Text style={[styles.rowText, { color: '#043094', fontWeight: '600' }]}>Join a Fleet</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#043094" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('d_profile_personal_info', 'Personal & License Info')}</Text>
        
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="call-outline" size={20} color="#4B5563" />
            <Text style={styles.rowText}>{t('d_profile_phone', 'Phone Number')}</Text>
          </View>
          <Text style={styles.rowRightText}>{driverProfile?.phone || 'Not set'}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="calendar-outline" size={20} color="#4B5563" />
            <Text style={styles.rowText}>{t('d_profile_joined', 'Joined')}</Text>
          </View>
          <Text style={styles.rowRightText}>{driverProfile?.joinedDate || 'N/A'}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="card-outline" size={20} color="#4B5563" />
            <Text style={styles.rowText}>{t('d_profile_license_no', 'License No.')}</Text>
          </View>
          <Text style={[styles.rowRightText, !driverProfile?.licenseNumber && { color: '#9CA3AF' }]}>
            {driverProfile?.licenseNumber || 'Not set'}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="time-outline" size={20} color="#4B5563" />
            <Text style={styles.rowText}>{t('d_profile_license_exp', 'License Expiry')}</Text>
          </View>
          {(() => {
            const expInfo = getLicenseExpiryInfo(driverProfile?.licenseExpiry);
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.rowRightText, { color: expInfo.color, fontWeight: expInfo.isUrgent ? '600' : '500' }]}>
                  {expInfo.text}
                </Text>
                {expInfo.badge && (
                  <View style={{ backgroundColor: expInfo.badgeBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                    <Text style={{ color: expInfo.badgeColor, fontSize: 12, fontWeight: '600' }}>
                      {expInfo.badge}
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}
        </View>
      </View>

      {driverProfile?.managerId && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fleet Information</Text>
          
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="business-outline" size={20} color="#4B5563" />
              <Text style={styles.rowText}>Manager</Text>
            </View>
            <Text style={styles.rowRightText}>{driverProfile?.managerName}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="key-outline" size={20} color="#4B5563" />
              <Text style={styles.rowText}>Fleet Code</Text>
            </View>
            <Text style={styles.rowRightText}>{driverProfile?.fleetCode}</Text>
          </View>
        </View>
      )}


      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.signOutText}>{t('d_profile_sign_out', 'Sign Out')}</Text>
        </TouchableOpacity>
      </View>

      {/* Join Fleet Modal */}
      <Modal
        visible={isJoinFleetVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsJoinFleetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join a Fleet</Text>
              <TouchableOpacity onPress={() => setIsJoinFleetVisible(false)}>
                <Ionicons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Enter your manager's Fleet Invite Code to join their fleet and start receiving assignments.
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Fleet Invite Code</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. AVI-8492"
                placeholderTextColor="#9CA3AF"
                value={fleetCode}
                onChangeText={(text) => setFleetCode(text.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalBtn, isJoining && { opacity: 0.7 }]}
              onPress={handleJoinFleet}
              disabled={isJoining}
            >
              {isJoining ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalBtnText}>Join Fleet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#fff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#043094',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#111827',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  role: {
    fontSize: 16,
    color: '#043094',
    fontWeight: '500',
    marginTop: 4,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  rowRightText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  modalBtn: {
    backgroundColor: '#043094',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  }
});
