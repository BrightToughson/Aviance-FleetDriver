import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORE_KEY = '@app_language';

const languages = [
  { code: 'en', label: 'English', icon: '🇺🇸' },
  { code: 'tw', label: 'Twi (Akan)', icon: '🇬🇭' },
  { code: 'ga', label: 'Ga', icon: '🇬🇭' },
  { code: 'ha', label: 'Hausa', icon: '🇳🇬' },
  { code: 'fr', label: 'Français', icon: '🇫🇷' },
  { code: 'ar', label: 'العربية', icon: '🇸🇦' },
  { code: 'es', label: 'Español', icon: '🇪🇸' },
];

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = async (langCode: string) => {
    await AsyncStorage.setItem(LANGUAGE_STORE_KEY, langCode);
    i18n.changeLanguage(langCode);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="globe-outline" size={20} color="#333" />
        <Text style={styles.selectorText}>{currentLanguage.label}</Text>
        <Ionicons name="chevron-down" size={16} color="#333" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('select_language')}</Text>
            
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    i18n.language === item.code && styles.languageItemSelected
                  ]}
                  onPress={() => handleLanguageChange(item.code)}
                >
                  <Text style={styles.languageIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.languageLabel,
                      i18n.language === item.code && styles.languageLabelSelected
                    ]}
                  >
                    {item.label}
                  </Text>
                  {i18n.language === item.code && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  selectorText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  languageItemSelected: {
    backgroundColor: '#f8f9fa',
  },
  languageIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  languageLabel: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  languageLabelSelected: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
