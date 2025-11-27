import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, Pressable } from 'react-native';
import { useRouter, Link } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Feather, Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import Avatar from '../Avatar';
import ModleSummary from '../modle/ModleSummary';
import * as api from '../../api';

const ProfileHeader = ({ profile, isFollowing, onFollowToggle, onEditClick, onUserListClick, onImportClick }) => {
    const { user, logout } = useContext(AuthContext);
    const [showDropdown, setShowDropdown] = useState(false);
    const router = useRouter();

    const handleCopyLink = async () => {
        // Construct web URL manually since we are on mobile
        const url = `https://moviesocial.com/profile/${profile.username}`;
        await Clipboard.setStringAsync(url);
        Alert.alert("Copied", "Profile link copied to clipboard");
        setShowDropdown(false);
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to permanently delete your account? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await api.deleteMyAccount();
                            if (logout) logout();
                            router.replace('/signup');
                        } catch (err) {
                            Alert.alert("Error", "Failed to delete account");
                        }
                    }
                }
            ]
        );
        setShowDropdown(false);
    };

    return (
        <View className="mb-6 px-4 pt-2">
            <View className="flex-row items-start gap-4">
                {/* Avatar */}
                <Avatar 
                    username={profile.username} 
                    avatar={profile.avatar} 
                    sizeClass="w-24 h-24" 
                    className="border-2 border-border" 
                />

                {/* Info */}
                <View className="flex-1">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-2">
                            <Text className="text-2xl font-bold text-white mb-1" numberOfLines={1}>
                                {profile.username}
                            </Text>
                            
                            {/* Badges */}
                            <View className="flex-row flex-wrap gap-1 mb-2">
                                {(profile.badges || []).map(b => (
                                    <View key={b.id || b.name} className="bg-zinc-800 px-2 py-0.5 rounded">
                                        <Text className="text-[10px] font-bold text-gray-300 uppercase">
                                            {(b.name || b.id || '').replace(/_/g, ' ')}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Options Menu Button */}
                        {user && user.username === profile.username && (
                            <TouchableOpacity onPress={() => setShowDropdown(true)} className="p-1">
                                <Feather name="more-vertical" size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Bio */}
                    <Text className="text-gray-400 text-sm mb-3 leading-5">
                        {profile.bio || "This user has not set a bio."}
                    </Text>
                </View>
            </View>

            {/* Stats Row */}
            <View className="flex-row flex-wrap gap-x-4 gap-y-2 mt-2 mb-4">
                <TouchableOpacity onPress={() => onUserListClick('Followers', profile.followers || [])}>
                    <Text className="text-gray-400 text-sm">
                        <Text className="text-white font-bold">{profile.followersCount || 0}</Text> Followers
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => onUserListClick('Following', profile.following || [])}>
                    <Text className="text-gray-400 text-sm">
                        <Text className="text-white font-bold">{profile.followingCount || 0}</Text> Following
                    </Text>
                </TouchableOpacity>

                <Text className="text-gray-400 text-sm">
                    <Text className="text-white font-bold">{profile.discussionsStarted || 0}</Text> Disc.
                </Text>

                {user && user.username === profile.username && (
                    <ModleSummary username={profile.username} />
                )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2">
                {user ? (
                    user.username === profile.username ? (
                        <TouchableOpacity 
                            onPress={onEditClick}
                            className="flex-1 bg-zinc-800 py-2 rounded-lg items-center border border-zinc-700"
                        >
                            <Text className="text-white font-bold">Edit Profile</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity 
                                onPress={() => router.push(`/messages?user=${profile.username}`)}
                                className="flex-1 bg-zinc-800 py-2 rounded-lg items-center border border-zinc-700 flex-row justify-center gap-2"
                            >
                                <Feather name="message-circle" size={18} color="white" />
                                <Text className="text-white font-bold">Message</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={onFollowToggle}
                                className={`flex-1 py-2 rounded-lg items-center ${isFollowing ? 'bg-zinc-800 border border-red-900' : 'bg-primary'}`}
                            >
                                <Text className={`font-bold ${isFollowing ? 'text-red-500' : 'text-primary-foreground'}`}>
                                    {isFollowing ? 'Unfollow' : 'Follow'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )
                ) : (
                    <TouchableOpacity 
                        onPress={() => router.push('/login')}
                        className="flex-1 bg-zinc-800 py-2 rounded-lg items-center"
                    >
                        <Text className="text-white font-bold">Log in to follow</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Dropdown Modal */}
            <Modal
                transparent={true}
                visible={showDropdown}
                animationType="fade"
                onRequestClose={() => setShowDropdown(false)}
            >
                <Pressable className="flex-1 bg-black/50" onPress={() => setShowDropdown(false)}>
                    <View className="absolute top-20 right-4 bg-card w-56 rounded-lg border border-border shadow-xl overflow-hidden p-1">
                        <TouchableOpacity onPress={handleCopyLink} className="p-3 hover:bg-zinc-800 rounded">
                            <Text className="text-white">Share Profile</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => { onEditClick(); setShowDropdown(false); }} className="p-3 hover:bg-zinc-800 rounded">
                            <Text className="text-white">Edit Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => { if(onImportClick) onImportClick(); setShowDropdown(false); }} className="p-3 hover:bg-zinc-800 rounded">
                            <Text className="text-white">Import from Letterboxd</Text>
                        </TouchableOpacity>

                        <View className="h-[1px] bg-border my-1" />

                        <TouchableOpacity onPress={() => { logout(); setShowDropdown(false); }} className="p-3 hover:bg-zinc-800 rounded">
                            <Text className="text-white">Logout</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleDeleteAccount} className="p-3 hover:bg-zinc-800 rounded">
                            <Text className="text-red-500 font-bold">Delete Account</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
};

export default ProfileHeader;