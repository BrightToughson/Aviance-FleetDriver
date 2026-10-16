import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '@clerk/expo';
import { supabase } from '../../lib/supabase';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [licenseImageUri, setLicenseImageUri] = useState<string | null>(null);
  
  const [fleetCode, setFleetCode] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.unsafeMetadata?.fleetCode && typeof user.unsafeMetadata.fleetCode === 'string') {
      setFleetCode(user.unsafeMetadata.fleetCode);
    }
  }, [user]);

  const pickImage = async (isLicense: boolean = false) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Refused", "You need to allow camera roll permissions to upload a photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: isLicense ? [4, 3] : [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (isLicense) setLicenseImageUri(result.assets[0].uri);
      else setImageUri(result.assets[0].uri);
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
      // Append a timestamp to break the browser/React Native image cache
      return `${publicUrl}?t=${new Date().getTime()}`;
    } catch (e: any) {
      console.error("Upload error:", e.message);
      return null;
    }
  };

  const handleComplete = async () => {
    if (!imageUri || !licenseImageUri || !fleetCode || !phone || !licenseNumber || !licenseExpiry) {
      const msg = 'Please fill out all fields and upload both photos to continue.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Missing Info', msg);
      return;
    }

    setLoading(true);
    try {
      // 1. Verify the Fleet Code
      const { data: managerProfile, error: codeError } = await supabase
        .from('profiles')
        .select('id')
        .eq('fleet_code', fleetCode.trim().toUpperCase())
        .single();

      if (codeError || !managerProfile) {
        throw new Error('Invalid Fleet Invite Code. Please check with your manager.');
      }

      const managerId = managerProfile.id;

      if (user) {
        // 2. Upload Avatar
        let avatarUrl = null;
        if (imageUri) {
          avatarUrl = await uploadToSupabase(imageUri, 'avatars', `${user.id}/profile.jpg`);
        }

        // 3. Upload License Image
        let licenseUrl = null;
        if (licenseImageUri) {
          licenseUrl = await uploadToSupabase(licenseImageUri, 'documents', `${user.id}/license.jpg`);
        }

        // 4. Create the driver profile in Supabase
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            is_driver: true,
            role: 'driver',
            full_name: user.fullName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Driver',
            email: user.emailAddresses[0]?.emailAddress,
            phone_number: phone,
            avatar_url: avatarUrl,
            manager_id: managerId,
            status: 'Active',
          });

        if (profileError) throw profileError;

        // 5. Create Driver Details
        const { error: detailsError } = await supabase
          .from('driver_details')
          .upsert({
            profile_id: user.id,
            license_number: licenseNumber,
            license_expiry: licenseExpiry,
          });

        if (detailsError) throw detailsError;

        // 6. Create License Document Record
        if (licenseUrl) {
          const { error: docError } = await supabase
            .from('documents')
            .insert({
              name: 'Driver License',
              entity_type: 'driver',
              entity_id: user.id,
              document_type: 'License',
              document_url: licenseUrl,
            });
            
          if (docError) throw docError;
        }

        // 7. Update Clerk metadata
        if (typeof (user as any).updateMetadata === 'function') {
          await (user as any).updateMetadata({
            unsafeMetadata: {
              profileCompleted: true
            }
          });
        } else {
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              profileCompleted: true
            }
          });
        }
      }
      
      if (Platform.OS === 'web') {
        window.alert('Profile Complete! Your manager will now assign you a vehicle.');
        router.replace('/(driver)/dashboard');
      } else {
        Alert.alert('Profile Complete', 'Your profile is ready. Your manager will now assign you a vehicle.', [
          { text: 'Continue', onPress: () => router.replace('/(driver)/dashboard') }
        ]);
      }
    } catch (error: any) {
      if (Platform.OS === 'web') window.alert(error.message);
      else Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.innerContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Profile</Text>
            <Text style={styles.subtitle}>Let's get you set up so you can start driving.</Text>
          </View>

          {/* Avatar Upload */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoContainer} onPress={() => pickImage(false)} activeOpacity={0.8}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.photo} />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="camera" size={36} color="#9CA3AF" />
                  <Text style={styles.placeholderText}>Add Photo</Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name={imageUri ? "pencil" : "add"} size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Profile Picture</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Manager's Fleet Invite Code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. AV-9X4P2A"
              placeholderTextColor="#9CA3AF"
              value={fleetCode}
              onChangeText={(text) => setFleetCode(text.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 6, lineHeight: 16 }}>
              Ask your fleet manager for their invite code (e.g. AV-XXXXXX) to link your account to their fleet.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. (555) 123-4567"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Driver's License Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. DL-123456789"
              placeholderTextColor="#9CA3AF"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>License Expiry Date</Text>
            {Platform.OS === 'web' ? (
              React.createElement('input', {
                type: 'date',
                value: licenseExpiry || '',
                onChange: (e: any) => setLicenseExpiry(e.target.value),
                onClick: (e: any) => { try { e.target.showPicker(); } catch(err) {} },
                style: {
                  borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: '12px 16px',
                  fontSize: 16, color: '#111827', backgroundColor: '#F9FAFB', cursor: 'pointer',
                  width: '100%', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                }
              })
            ) : (
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                value={licenseExpiry}
                onChangeText={setLicenseExpiry}
              />
            )}
          </View>

          {/* License Image Upload */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photo of Driver's License</Text>
            <TouchableOpacity style={styles.licenseUploadBtn} onPress={() => pickImage(true)} activeOpacity={0.8}>
              {licenseImageUri ? (
                <Image source={{ uri: licenseImageUri }} style={styles.licenseImg} />
              ) : (
                <View style={styles.licensePlaceholder}>
                  <Ionicons name="image-outline" size={32} color="#6366F1" />
                  <Text style={styles.licensePlaceholderText}>Upload License Image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.primaryBtn, loading && styles.btnDisabled]} 
              onPress={handleComplete}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Finish & Let's Go</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 24, flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  innerContainer: { width: '100%', maxWidth: 480, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
  header: { marginBottom: 36, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 10, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  
  photoSection: { alignItems: 'center', marginBottom: 32 },
  photoContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  photo: { width: '100%', height: '100%', borderRadius: 60 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#9CA3AF', fontWeight: '600', marginTop: 8, fontSize: 13 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#043094', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFFFFF' },
  photoHint: { fontSize: 14, fontWeight: '600', color: '#374151' },
  
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111827', fontWeight: '500' },
  
  licenseUploadBtn: { height: 160, backgroundColor: '#EEF2FF', borderWidth: 2, borderColor: '#C7D2FE', borderStyle: 'dashed', borderRadius: 12, overflow: 'hidden' },
  licenseImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  licensePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  licensePlaceholderText: { color: '#6366F1', fontWeight: '600', marginTop: 12, fontSize: 14 },

  footer: { marginTop: 16 },
  primaryBtn: { backgroundColor: '#043094', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: "#043094", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 }
});
