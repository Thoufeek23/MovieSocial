import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../src/api';

const LetterboxdImportModal = ({ visible, onClose, onImportComplete, defaultTab = 'reviews' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setActiveTab(defaultTab);
      setInputValue('');
    }
  }, [visible, defaultTab]);

  const handleImport = async () => {
    if (!inputValue.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setLoading(true);

    try {
      let data;
      
      if (activeTab === 'reviews') {
        // Import Reviews
        const res = await api.importLetterboxd(inputValue.trim());
        data = res.data;
        
        if (data.count === 0) {
          Alert.alert('Success', data.msg || 'No new reviews found.');
        } else {
          Alert.alert('Success', `Imported ${data.imported} reviews!`);
        }
      } else {
        // Import Rank (List)
        const username = inputValue.trim();
        const constructedUrl = `https://letterboxd.com/${username}`;
        
        const res = await api.importLetterboxdRank(constructedUrl);
        data = res.data;
        
        Alert.alert('Success', data.msg);
        if (data.note) {
          setTimeout(() => Alert.alert('Note', data.note), 500);
        }
      }

      onImportComplete?.();
      onClose();
      setInputValue('');
    } catch (error) {
      const msg = error.response?.data?.msg || 'Failed to import.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <TouchableOpacity 
            style={styles.modalContainer} 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={[styles.logoDot, { backgroundColor: '#40bcf4' }]} />
                <View style={[styles.logoDot, { backgroundColor: '#00e054' }]} />
                <View style={[styles.logoDot, { backgroundColor: '#ff8000' }]} />
              </View>
              <Text style={styles.title}>Letterboxd Import</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
                onPress={() => setActiveTab('reviews')}
              >
                <Ionicons 
                  name="book-outline" 
                  size={16} 
                  color={activeTab === 'reviews' ? '#fff' : '#9ca3af'} 
                />
                <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
                  Import Reviews
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.tab, activeTab === 'list' && styles.tabActive]}
                onPress={() => setActiveTab('list')}
              >
                <Ionicons 
                  name="list-outline" 
                  size={16} 
                  color={activeTab === 'list' ? '#fff' : '#9ca3af'} 
                />
                <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>
                  Import List
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Letterboxd Username</Text>
                <TextInput
                  style={styles.input}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder="username"
                  placeholderTextColor="#4b5563"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  {activeTab === 'reviews' 
                    ? "Imports your latest star rated films as Reviews. Perfect for keeping your feed up to date." 
                    : "Imports the first 10 films of your lists. Perfect for keeping your feed up to date."
                  }
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.importButton, loading && styles.importButtonDisabled]}
                onPress={handleImport}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.importButtonText}>
                    {activeTab === 'reviews' ? 'Import Reviews' : 'Import Lists'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#111827',
  },
  logoContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#374151',
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  infoBox: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  infoText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
  importButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importButtonDisabled: {
    opacity: 0.7,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default LetterboxdImportModal;
