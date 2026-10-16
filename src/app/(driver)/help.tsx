import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function HelpScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const faqs = [
    { q: t('d_help_q1', 'How do I log fuel?'), a: t('d_help_a1', 'Navigate to the "Fuel Log" screen from the menu and enter your receipt details.') },
    { q: t('d_help_q2', 'What if I break down?'), a: t('d_help_a2', 'Use the "Report Issue" screen and mark the severity as High. Dispatch will be notified immediately.') },
    { q: t('d_help_q3', 'How do I request time off?'), a: t('d_help_a3', 'Go to the "Requests" screen and tap "+ New Request", then select "Time Off".') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('d_help_title', 'Help & Support')}</Text>
      </View>

      <View style={styles.contactCard}>
        <Ionicons name="call" size={32} color="#fff" />
        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>{t('d_help_dispatch', 'Emergency Dispatch')}</Text>
          <Text style={styles.contactNumber}>1-800-FLEET-99</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('d_help_faq', 'Frequently Asked Questions')}</Text>
      {faqs.map((faq, index) => (
        <View key={index} style={styles.faqItem}>
          <Text style={styles.faqQ}>{faq.q}</Text>
          <Text style={styles.faqA}>{faq.a}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.ticketBtn}>
        <Ionicons name="mail" size={20} color="#043094" />
        <Text style={styles.ticketText}>{t('d_help_ticket', 'Submit a Support Ticket')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { marginRight: 16, padding: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', padding: 20, borderRadius: 12, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  contactInfo: { marginLeft: 16 },
  contactTitle: { color: '#FEE2E2', fontSize: 14, fontWeight: '500' },
  contactNumber: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  faqItem: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  faqQ: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  faqA: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  ticketBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF6FF', padding: 16, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#BFDBFE' },
  ticketText: { fontSize: 16, fontWeight: '600', color: '#043094', marginLeft: 8 },
});
