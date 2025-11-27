import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PostButton = ({ onChoose }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleOption = (option) => {
    setModalVisible(false);
    onChoose(option);
  };

  return (
    <View>
      <TouchableOpacity 
        onPress={() => setModalVisible(true)} 
        className="flex-row items-center justify-center bg-card border border-border px-4 py-2 rounded-full active:bg-zinc-800"
      >
        <Ionicons name="add-circle-outline" size={20} color="#16a34a" style={{ marginRight: 6 }} />
        <Text className="text-primary font-bold text-base">Post</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setModalVisible(false)}
        >
          <View className="bg-card w-64 rounded-xl border border-border p-2 shadow-xl">
            <Text className="text-gray-400 text-xs font-bold uppercase ml-3 mt-2 mb-1">
              Create New
            </Text>
            
            <TouchableOpacity 
              onPress={() => handleOption('review')}
              className="flex-row items-center p-3 rounded-lg active:bg-zinc-800"
            >
              <Ionicons name="star-outline" size={20} color="#fafafa" style={{ marginRight: 10 }} />
              <Text className="text-foreground text-base font-medium">Review</Text>
            </TouchableOpacity>

            <View className="h-[1px] bg-border my-1 mx-2" />

            <TouchableOpacity 
              onPress={() => handleOption('discussion')}
              className="flex-row items-center p-3 rounded-lg active:bg-zinc-800"
            >
              <Ionicons name="chatbubbles-outline" size={20} color="#fafafa" style={{ marginRight: 10 }} />
              <Text className="text-foreground text-base font-medium">Discussion</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default PostButton;