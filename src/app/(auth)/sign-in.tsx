import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSignIn, useClerk, useOAuth } from '@clerk/expo';
import * as Linking from 'expo-linking';

const { width } = Dimensions.get('window');

export default function SignInScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signIn } = useSignIn() as any;
  const { setActive } = useClerk() as any;
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(40))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleSignIn = async () => {
    if (!signIn) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      // Handle non-throwing clerk errors
      if (result.error) {
        const errObj = result.error.errors?.[0];
        const msg = errObj?.longMessage || errObj?.message || result.error.message || 'An unknown error occurred.';
        setErrorMsg(msg);
        setIsLoading(false);
        return;
      }

      let signedIn = false;
      // If there's no error (or error is null/undefined) and status is either complete or not present
      if (result.status === 'complete' || !result.error) {
        if (result.createdSessionId) {
          signedIn = true;
          await setActive({ session: result.createdSessionId });
          return;
        } else {
          // In some older versions or specific environments, the session ID might be missing from the result.
          // Since we know the login was successful (error is null), we can force a page reload on the web 
          // to let Clerk automatically pick up the new session cookie!
          if (Platform.OS === 'web') {
            window.location.href = '/';
            return;
          }
        }
      } else if (result.status === 'needs_first_factor') {
        const factorResult = await signIn.attemptFirstFactor({
          strategy: 'password',
          password,
        });
        if (factorResult.status === 'complete' || factorResult.error === null) {
          if (factorResult.createdSessionId) {
            signedIn = true;
            await setActive({ session: factorResult.createdSessionId });
            return;
          }
        }
      } else {
        const factors = result.supportedFirstFactors?.map((f: any) => f.strategy).join(', ') || 'none';
        setErrorMsg(`Sign in requires further verification. Status: ${result.status || 'unknown'}. Available factors: ${factors}`);
        console.log("SignIn Result:", JSON.stringify(result));
      }
      if (!signedIn) {
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message;
      if (msg) {
        setErrorMsg(msg);
      } else if (err.message) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unknown error occurred.');
      }
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(driver)/dashboard', { scheme: 'aviance' }),
      });

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        return;
      }
      setIsLoading(false);
    } catch (err: any) {
      console.error('OAuth error', err);
      setErrorMsg(err.message || 'Google Sign-In failed.');
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Decorative Background Elements */}
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
            <Text style={styles.title}>{t('auth_welcome', 'Welcome Back')}</Text>
            <Text style={styles.description}>{t('auth_signin_desc', 'Enter your credentials to access your fleet dashboard.')}</Text>

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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth_password', 'Password')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotPasswordText}>{t('auth_forgot', 'Forgot Password?')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.signInButton, isLoading && styles.signInButtonDisabled]} 
              onPress={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.signInText}>Signing In...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={styles.signInText}>{t('auth_signin_btn', 'Sign In')}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity 
              style={[styles.googleBtn, isLoading && styles.signInButtonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
              <Text style={styles.googleBtnText}>{t('auth_continue_google', 'Continue with Google')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth_no_account', "Don't have an account? ")}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={styles.signUpText}>{t('auth_signup_btn', 'Apply to Drive')}</Text>
            </TouchableOpacity>
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
  title: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 8, letterSpacing: -1 },
  description: { fontSize: 15, color: '#6B7280', marginBottom: 32, lineHeight: 24 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FCA5A5' },
  errorText: { color: '#DC2626', fontSize: 14, fontWeight: '500', marginLeft: 8, flex: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, height: 60 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#111827', height: '100%', outlineStyle: 'none' as any },
  eyeIcon: { padding: 4 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 28 },
  forgotPasswordText: { color: '#2563EB', fontWeight: '700', fontSize: 14 },
  signInButton: { flexDirection: 'row', backgroundColor: '#043094', borderRadius: 16, height: 60, justifyContent: 'center', alignItems: 'center', shadowColor: '#043094', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  signInButtonDisabled: { opacity: 0.7 },
  signInText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  divider: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 16, color: '#9CA3AF', fontWeight: '600', fontSize: 14 },
  googleBtn: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 16, height: 60, justifyContent: 'center', alignItems: 'center' },
  googleBtnText: { color: '#374151', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  footerText: { color: '#6B7280', fontSize: 15 },
  signUpText: { color: '#2563EB', fontSize: 15, fontWeight: '700' },
});
