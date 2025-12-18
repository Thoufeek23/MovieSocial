import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, FileText, Trophy } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const MSLogoModal = ({ visible, onClose }) => {
  const router = useRouter();

  const menuItems = [
    {
      id: 'discussions',
      title: 'Discussions',
      icon: BookOpen,
      route: '/(tabs)/discussions',
      description: 'Join movie conversations'
    },
    {
      id: 'reviews',
      title: 'Reviews',
      icon: FileText,
      route: '/(tabs)/reviews',
      description: 'Read and write reviews'
    },
    {
      id: 'ranks',
      title: 'Ranks',
      icon: Trophy,
      route: '/(tabs)/ranks',
      description: 'Create and view movie rankings'
    },
  ];

  const handleItemPress = (route) => {
    onClose();
    router.push(route);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <BlurView intensity={20} tint="dark" style={styles.blurView}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>MovieSocial</Text>
              <Text style={styles.headerSubtitle}>Explore Content</Text>
            </View>
            
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      index !== menuItems.length - 1 && styles.menuItemBorder
                    ]}
                    onPress={() => handleItemPress(item.route)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconContainer}>
                      <Icon color="#10b981" size={28} strokeWidth={2} />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </BlurView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  blurView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  menuContainer: {
    gap: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fafafa',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 13,
    color: '#9ca3af',
  },
});

export default MSLogoModal;
