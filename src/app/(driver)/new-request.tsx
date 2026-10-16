import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useUser } from '@clerk/expo';
import { uploadImageToSupabase } from '../../lib/uploadImage';

export default function NewRequestScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useUser();
  const [reqType, setReqType] = useState('Time Off');
  const [reqDetails, setReqDetails] = useState('');
  
  // Dynamic Fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [amount, setAmount] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [leaveType, setLeaveType] = useState('Vacation');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAttachReceipt = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert(t('d_fuel_cam_perm', "Permission to access camera is required!"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!reqDetails.trim()) {
      alert(t('d_newreq_err_details', 'Please provide the details or reason for your request.'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (reqType === 'Maintenance') {
        const { error } = await supabase.from('maintenance_requests').insert([{
          driver_id: user?.id || 'unknown',
          description: `[${urgency}] ${reqDetails.trim()}`,
          status: 'pending'
        }]);
        if (error) throw error;
      } else {
        let parsedStart = null;
        let parsedEnd = null;

        if (startDate) {
          const d = new Date(startDate);
          if (isNaN(d.getTime())) {
            alert('Invalid Start Date. Please enter a valid date (e.g. YYYY-MM-DD)');
            setIsSubmitting(false);
            return;
          }
          parsedStart = d.toISOString().split('T')[0];
        }

        if (endDate) {
          const d = new Date(endDate);
          if (isNaN(d.getTime())) {
            alert('Invalid End Date. Please enter a valid date (e.g. YYYY-MM-DD)');
            setIsSubmitting(false);
            return;
          }
          parsedEnd = d.toISOString().split('T')[0];
        }

        let uploadedUrl = null;
        if (receiptImage) {
          uploadedUrl = await uploadImageToSupabase(receiptImage, 'media');
        }

        let finalDetails = reqDetails.trim();
        if (reqType === 'Time Off') {
          finalDetails = `[${leaveType} Leave] ${reqDetails.trim()}${emergencyContact ? ` | Contact: ${emergencyContact.trim()}` : ''}`;
        }

        const { error } = await supabase.from('driver_requests').insert([{
          driver_id: user?.id || 'unknown',
          request_type: reqType,
          details: finalDetails,
          start_date: parsedStart,
          end_date: parsedEnd,
          amount: amount ? parseFloat(amount) : null,
          receipt_url: uploadedUrl,
          status: 'pending'
        }]);
        if (error) throw error;
      }

      alert(t('d_newreq_success', 'Request submitted successfully!'));
      router.back();
    } catch (err: any) {
      console.error(err);
      alert('Failed to submit request: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('d_newreq_title', 'Submit New Request')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>{t('d_newreq_lbl_type', 'Request Type *')}</Text>
          <View style={styles.typeSelector}>
            {['Time Off', 'Maintenance', 'Expense'].map((type) => (
              <TouchableOpacity 
                key={type} 
                style={[styles.typeOption, reqType === type && styles.typeOptionActive]}
                onPress={() => setReqType(type)}
              >
                <Text style={[styles.typeText, reqType === type && styles.typeTextActive]}>
                  {t(`d_newreq_type_${type.toLowerCase().replace(' ', '_')}`, type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {reqType === 'Time Off' && (
            <>
              <Text style={styles.inputLabel}>{t('d_newreq_lbl_leave_type', 'Leave Category *')}</Text>
              <View style={styles.urgencyGrid}>
                {['Vacation', 'Sick', 'Personal', 'Unpaid'].map((lt) => (
                  <TouchableOpacity 
                    key={lt} 
                    style={[styles.urgencyBtn, leaveType === lt && styles.urgencyBtnActive]}
                    onPress={() => setLeaveType(lt)}
                  >
                    <Text style={[styles.urgencyText, leaveType === lt && styles.urgencyTextActive]}>
                      {lt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>{t('d_newreq_lbl_start', 'Start Date *')}</Text>
              {Platform.OS === 'web' ? (
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16, fontSize: 16, color: '#111827', marginBottom: 20, width: '100%', boxSizing: 'border-box' }}
                />
              ) : (
                <TextInput style={styles.singleInput} placeholder={t('d_newreq_start_ph', 'e.g. YYYY-MM-DD')} placeholderTextColor="#9CA3AF" value={startDate} onChangeText={setStartDate} />
              )}
              
              <Text style={styles.inputLabel}>{t('d_newreq_lbl_end', 'End Date *')}</Text>
              {Platform.OS === 'web' ? (
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16, fontSize: 16, color: '#111827', marginBottom: 20, width: '100%', boxSizing: 'border-box' }}
                />
              ) : (
                <TextInput style={styles.singleInput} placeholder={t('d_newreq_end_ph', 'e.g. YYYY-MM-DD')} placeholderTextColor="#9CA3AF" value={endDate} onChangeText={setEndDate} />
              )}

              <Text style={styles.inputLabel}>{t('d_newreq_lbl_emergency', 'Emergency Contact / Handover (Optional)')}</Text>
              <TextInput style={styles.singleInput} placeholder="Contact info while away..." placeholderTextColor="#9CA3AF" value={emergencyContact} onChangeText={setEmergencyContact} />

              <Text style={styles.inputLabel}>{t('d_newreq_lbl_document', 'Supporting Document (Required for Sick Leave)')}</Text>
              {receiptImage ? (
                <View style={styles.imageContainer}>
                  <Text style={styles.receiptText}>{t('d_newreq_attached', 'Document Attached ✓')}</Text>
                  <TouchableOpacity onPress={() => setReceiptImage(null)}>
                    <Text style={styles.removeText}>{t('d_newreq_remove', 'Remove')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadBtn} onPress={handleAttachReceipt}>
                  <Ionicons name="document-attach" size={20} color="#043094" />
                  <Text style={styles.uploadText}>{t('d_newreq_attach_doc', 'Attach Document')}</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {reqType === 'Maintenance' && (
            <>
              <Text style={styles.inputLabel}>{t('d_newreq_lbl_urgency', 'Urgency *')}</Text>
              <View style={styles.urgencyGrid}>
                {['Low', 'Medium', 'High'].map((u) => (
                  <TouchableOpacity 
                    key={u} 
                    style={[styles.urgencyBtn, urgency === u && styles.urgencyBtnActive]}
                    onPress={() => setUrgency(u)}
                  >
                    <Text style={[styles.urgencyText, urgency === u && styles.urgencyTextActive]}>
                      {t(`d_newreq_urgency_${u.toLowerCase()}`, u)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {reqType === 'Expense' && (
            <>
              <Text style={styles.inputLabel}>{t('d_newreq_lbl_amount', 'Amount (GH₵) *')}</Text>
              <TextInput style={styles.singleInput} placeholder={t('d_newreq_amt_ph', 'e.g. 150.00')} keyboardType="numeric" placeholderTextColor="#9CA3AF" value={amount} onChangeText={setAmount} />
              <Text style={styles.inputLabel}>{t('d_newreq_lbl_receipt', 'Receipt *')}</Text>
              {receiptImage ? (
                <View style={styles.imageContainer}>
                  <Text style={styles.receiptText}>{t('d_newreq_attached', 'Receipt Attached ✓')}</Text>
                  <TouchableOpacity onPress={() => setReceiptImage(null)}>
                    <Text style={styles.removeText}>{t('d_newreq_remove', 'Remove')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadBtn} onPress={handleAttachReceipt}>
                  <Ionicons name="camera" size={20} color="#043094" />
                  <Text style={styles.uploadText}>{t('d_newreq_attach', 'Attach Receipt')}</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <Text style={styles.inputLabel}>{t('d_newreq_lbl_details', 'Details / Reason *')}</Text>
          <TextInput 
            style={styles.textInput}
            placeholder={t('d_newreq_details_ph', 'Please describe your request in detail...')}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            value={reqDetails}
            onChangeText={setReqDetails}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>{t('common_cancel', 'Cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.submitBtn, isSubmitting && { backgroundColor: '#9CA3AF' }]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitBtnText}>{isSubmitting ? t('d_fuel_submitting', 'Submitting...') : t('d_newreq_submit', 'Submit Request')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { marginRight: 16, padding: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  typeOption: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  typeOptionActive: { backgroundColor: '#EFF6FF', borderColor: '#043094' },
  typeText: { fontSize: 15, color: '#4B5563', fontWeight: '500' },
  typeTextActive: { color: '#043094', fontWeight: '700' },
  singleInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16, fontSize: 16, color: '#111827', marginBottom: 20 },
  urgencyGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  urgencyBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  urgencyBtnActive: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
  urgencyText: { color: '#4B5563', fontWeight: '600' },
  urgencyTextActive: { color: '#D97706', fontWeight: 'bold' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderStyle: 'dashed', borderRadius: 8, padding: 16, marginBottom: 24 },
  uploadText: { fontSize: 16, fontWeight: '600', color: '#043094', marginLeft: 8 },
  imageContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 16, borderRadius: 8, marginBottom: 24 },
  receiptText: { color: '#059669', fontWeight: '600', fontSize: 15 },
  removeText: { color: '#DC2626', fontWeight: '600', fontSize: 15 },
  textInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 16, fontSize: 16, color: '#111827', minHeight: 150, textAlignVertical: 'top' },
  footer: { flexDirection: 'row', gap: 12, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelBtnText: { color: '#4B5563', fontWeight: '600', fontSize: 16 },
  submitBtn: { flex: 1, paddingVertical: 16, borderRadius: 8, backgroundColor: '#043094', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
