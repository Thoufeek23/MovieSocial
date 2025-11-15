import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DiscussionCard from './DiscussionCard';
import EmptyState from './EmptyState';

const DiscussionListSection = ({ 
  title, 
  discussions = [], 
  emptyMessage = 'No discussions found', 
  emptyIcon = 'chatbubble-outline',
  showDelete = false, 
  onDelete,
  onEdit,
  showRedirectButton = false,
  redirectButtonText = 'View Discussions',
  redirectButtonIcon = 'chatbubbles',
  redirectPath = '/(tabs)/discussions'
}) => {
  const router = useRouter();
  const renderDiscussion = ({ item }) => (
    <View style={styles.discussionContainer}>
      <DiscussionCard
        discussion={item}
        onDelete={showDelete ? onDelete : undefined}
        onEdit={showDelete ? onEdit : undefined}
        showActions={showDelete}
      />
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      icon={emptyIcon}
      title={emptyMessage}
      subtitle="Discussions will appear here when available"
      style={styles.emptyState}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {showRedirectButton && (
          <TouchableOpacity 
            style={styles.redirectButton}
            onPress={() => router.push(redirectPath)}
          >
            <Ionicons name={redirectButtonIcon} size={16} color="#10b981" />
            <Text style={styles.redirectButtonText}>{redirectButtonText}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {discussions.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={discussions}
          renderItem={renderDiscussion}
          keyExtractor={(item) => `discussion-${item._id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false} // Disable scroll since it's inside a ScrollView
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  redirectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  redirectButtonText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 8,
  },
  discussionContainer: {
    marginBottom: 8,
  },
  emptyState: {
    minHeight: 200,
    paddingVertical: 32,
  },
});

export default DiscussionListSection;