import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as api from '../../api';

const LetterboxdImportModal = ({ isOpen, onClose, onImportComplete, defaultTab = 'reviews' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setInputValue('');
    }
  }, [isOpen, defaultTab]);

  const handleImport = async () => {
    if (!inputValue.trim()) {
      Alert.alert("Required", "Please enter a username");
      return;
    }

    setLoading(true);
    try {
      let data;
      
      if (activeTab === 'reviews') {
        const res = await api.importLetterboxd(inputValue.trim());
        data = res.data;
        Alert.alert("Import Complete", data.count === 0 ? (data.msg || 'No new reviews found.') : `Imported ${data.imported} reviews!`);
      } else {
        const username = inputValue.trim();
        const constructedUrl = `https://letterboxd.com/${username}`;
        const res = await api.importLetterboxdRank(constructedUrl);
        data = res.data;
        Alert.alert("Import Complete", data.msg);
      }

      if (onImportComplete) onImportComplete();
      onClose();
      setInputValue('');
    } catch (error) {
      const msg = error.response?.data?.msg || 'Failed to import.';
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-center items-center p-4">
        <View className="bg-card w-full max-w-sm rounded-2xl border border-border overflow-hidden">
          
          {/* Header */}
          <View className="p-4 border-b border-border bg-background flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
               <View className="flex-row gap-1">
                  <View className="w-2.5 h-2.5 rounded-full bg-[#40bcf4]" />
                  <View className="w-2.5 h-2.5 rounded-full bg-[#00e054]" />
                  <View className="w-2.5 h-2.5 rounded-full bg-[#ff8000]" />
               </View>
               <Text className="text-white font-bold text-lg">Letterboxd Import</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View className="flex-row border-b border-border">
            <TouchableOpacity 
                onPress={() => setActiveTab('reviews')}
                className={`flex-1 py-3 items-center justify-center border-b-2 ${activeTab === 'reviews' ? 'border-primary bg-zinc-800' : 'border-transparent'}`}
            >
                <View className="flex-row gap-2 items-center">
                    <Feather name="book-open" size={16} color={activeTab === 'reviews' ? 'white' : 'gray'} />
                    <Text className={activeTab === 'reviews' ? 'text-white font-bold' : 'text-gray-400'}>Reviews</Text>
                </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
                onPress={() => setActiveTab('list')}
                className={`flex-1 py-3 items-center justify-center border-b-2 ${activeTab === 'list' ? 'border-primary bg-zinc-800' : 'border-transparent'}`}
            >
                 <View className="flex-row gap-2 items-center">
                    <Feather name="list" size={16} color={activeTab === 'list' ? 'white' : 'gray'} />
                    <Text className={activeTab === 'list' ? 'text-white font-bold' : 'text-gray-400'}>List</Text>
                </View>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View className="p-6">
             <Text className="text-sm font-medium text-gray-400 mb-2">Letterboxd Username</Text>
             <TextInput
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="username"
                placeholderTextColor="#666"
                autoCapitalize="none"
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-white text-lg mb-4"
             />

             <View className="bg-zinc-800/50 rounded-lg p-3 mb-6">
                <Text className="text-xs text-gray-400 text-center">
                    {activeTab === 'reviews' 
                        ? "Imports your latest star rated films as Reviews." 
                        : "Imports the first 10 films of your lists."
                    }
                </Text>
             </View>

             <TouchableOpacity
                onPress={handleImport}
                disabled={loading}
                className={`w-full bg-green-600 py-3 rounded-xl flex-row justify-center items-center ${loading ? 'opacity-70' : ''}`}
             >
                {loading ? (
                    <ActivityIndicator color="white" size="small" />
                ) : (
                    <Text className="text-white font-bold text-lg">
                        {activeTab === 'reviews' ? 'Import Reviews' : 'Import Lists'}
                    </Text>
                )}
             </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

export default LetterboxdImportModal;