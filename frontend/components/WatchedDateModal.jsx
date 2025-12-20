import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const WatchedDateModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  onRemove,
  isWatched = false,
  movieTitle = ''
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleTodayPress = () => {
    onConfirm(null);
  };

  const handleCustomDateConfirm = () => {
    const dateString = selectedDate.toISOString().split('T')[0];
    onConfirm(dateString);
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
          <View style={styles.header}>
            <Ionicons name="calendar" size={24} color="#10b981" />
            <Text style={styles.title}>
              {isWatched ? 'Edit Watch History' : 'When did you watch this?'}
            </Text>
          </View>

          <View style={styles.content}>
            {/* Today Button */}
            <TouchableOpacity 
              style={styles.todayButton}
              onPress={handleTodayPress}
            >
              <View style={styles.todayButtonContent}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#9ca3af" />
                <Text style={styles.todayButtonText}>
                  {isWatched ? 'Log Rewatch Today' : 'I Watched it Today'}
                </Text>
              </View>
              <Text style={styles.todayButtonDate}>
                {formatDate(new Date())}
              </Text>
            </TouchableOpacity>

            {/* Date Picker Section */}
            <View style={styles.datePickerSection}>
              <Text style={styles.datePickerLabel}>
                {isWatched ? 'Or log rewatch on past date:' : 'Or pick a past date:'}
              </Text>
              
              <View style={styles.datePickerRow}>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.datePickerButtonText}>
                    {formatDate(selectedDate)}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleCustomDateConfirm}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  textColor="#fff"
                />
              )}
            </View>

            {/* Remove Option (Only if watched) */}
            {isWatched && onRemove && (
              <View style={styles.removeSection}>
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={onRemove}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  <Text style={styles.removeButtonText}>
                    Remove from Watch History
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  content: {
    gap: 16,
  },
  todayButton: {
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  todayButtonDate: {
    color: '#6b7280',
    fontSize: 12,
  },
  datePickerSection: {
    gap: 8,
  },
  datePickerLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginLeft: 4,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  datePickerButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  removeSection: {
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  removeButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WatchedDateModal;
