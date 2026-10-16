import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSignIn, useClerk } from '@clerk/expo';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signIn } = useSignIn() as any;
  const { setActive } = useClerk() as any;

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(40))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true })
    ]).start();
  }, []);

  const handleReset = async () => {
    if (!email || !signIn) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      await signIn.create({ identifier: email });

      const emailCodeFactor = signIn.supportedFirstFactors?.find(
        (factor: any) => factor.strategy === 'reset_password_email_code'
      ) as any;

      if (emailCodeFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'reset_password_email_code',
          emailAddressId: emailCodeFactor.emailAddressId,
        });
        setSubmitted(true);
        setErrorMsg('');
      } else {
        setErrorMsg('Password reset is not supported for this email.');
      }
    } catch (err: any) {
      setErrorMsg(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!signIn || !code || !newPassword) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });

      if (signIn.status === 'complete') {
        await setActive({ session: signIn.createdSessionId });
        router.replace('/');
      } else {
        setErrorMsg('Further verification is required.');
      }
    } catch (err: any) {
      setErrorMsg(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid code or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: '100%', alignItems: 'center' }}>
          
          <View style={styles.header}>
            <Image source={require('../../../assets/images/logo/logo.png')} style={styles.logo} resizeMode="contain" />
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>Driver Portal</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <TouchableOpacity style={styles.backBtn} onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(auth)/sign-in');
            }}>
              <Ionicons name="arrow-back" size={24} color="#6B7280" />
            </TouchableOpacity>
            
            {!submitted ? (
              <View style={styles.contentWrapper}>             
                <Text style={styles.title}>{t('auth_reset', 'Reset Password')}</Text>
                <Text style={styles.description}>{t('auth_reset_desc', 'Enter your email address and we will send you a link to reset your password.')}</Text>

                {errorMsg ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={20} color="#DC2626" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth_email', 'Email Address')}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('auth_email_ph', 'driver@aviance.com')}
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]} 
                  onPress={handleReset}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryButtonText}>Sending Link...</Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={styles.primaryButtonText}>{t('auth_send_link', 'Send Reset Link')}</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.contentWrapper}>
                <Text style={styles.title}>{t('auth_new_password', 'New Password')}</Text>
                <Text style={styles.description}>{t('auth_new_password_desc', 'Enter the code sent to your email and your new password.')}</Text>

                {errorMsg ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={20} color="#DC2626" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth_code', 'Reset Code')}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="keypad-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="123456"
                      placeholderTextColor="#9CA3AF"
                      value={code}
                      onChangeText={setCode}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth_new_password_label', 'New Password')}</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]} 
                  onPress={handleUpdatePassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.primaryButtonText}>Updating...</Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={styles.primaryButtonText}>{t('auth_update_password', 'Update Password')}</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', overflow: 'hidden' },
  bgCircle1: { position: 'absolute', width: width * 1.2, height: width * 1.2, borderRadius: width * 0.6, backgroundColor: '#DBEAFE', top: -width * 0.4, left: -width * 0.2, opacity: 0.6 },
  bgCircle2: { position: 'absolute', width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, backgroundColor: '#E0E7FF', bottom: -width * 0.2, right: -width * 0.2, opacity: 0.6 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 220, height: 70, marginBottom: 12 },
  badgeContainer: { backgroundColor: '#1E40AF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  formContainer: { 
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    borderRadius: 28, 
    padding: 32, 
    shadowColor: '#1E3A8A', 
    shadowOffset: { width: 0, height: 20 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 40, 
    elevation: 8,
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
  },
  contentWrapper: { width: '100%' },
  backBtn: { marginBottom: 16, width: 40, height: 40, justifyContent: 'center', borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 8, letterSpacing: -1 },
  description: { fontSize: 15, color: '#6B7280', marginBottom: 32, lineHeight: 24 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FCA5A5' },
  errorText: { color: '#DC2626', fontSize: 14, fontWeight: '500', marginLeft: 8, flex: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, height: 60 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#111827', height: '100%', outlineStyle: 'none' as any },
  primaryButton: { flexDirection: 'row', backgroundColor: '#043094', borderRadius: 16, height: 60, justifyContent: 'center', alignItems: 'center', shadowColor: '#043094', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8, marginTop: 12 },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
});
