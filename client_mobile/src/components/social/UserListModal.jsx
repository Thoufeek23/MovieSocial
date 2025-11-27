import React from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Avatar from '../Avatar';

const UserListModal = ({ isOpen, onClose, title = 'Users', users = [] }) => {
  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/60 justify-center items-center p-4" onPress={onClose}>
        <Pressable className="bg-card w-full max-w-sm rounded-xl border border-border p-4 shadow-lg h-96" onPress={(e) => e.stopPropagation()}>
          
          <View className="flex-row items-center justify-between mb-4 border-b border-border pb-2">
            <Text className="text-lg font-bold text-foreground">
              {title} <Text className="text-gray-400 font-normal">({users.length})</Text>
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {users.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-500">No users to show.</Text>
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item._id || item.username}
              renderItem={({ item }) => (
                <Link href={`/profile/${item.username}`} asChild>
                  <TouchableOpacity onPress={onClose} className="flex-row items-center gap-3 p-2 rounded-lg active:bg-zinc-800">
                    <Avatar username={item.username} avatar={item.avatar} sizeClass="w-10 h-10" />
                    <Text className="text-base font-medium text-gray-200">{item.username}</Text>
                  </TouchableOpacity>
                </Link>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default UserListModal;