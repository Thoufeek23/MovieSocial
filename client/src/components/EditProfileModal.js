import React, { useState, useRef } from 'react';
import Avatar from './Avatar';
import toast from 'react-hot-toast';
import * as api from '../api';

const EditProfileModal = ({ isOpen, onClose, profile, onUpdated }) => {
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || '');
  const avatarRef = useRef(null);

  if (!isOpen) return null;

  const handleFile = (file, setter, maxSize = 2 * 1024 * 1024) => {
    if (!file) return;
    if (file.size > maxSize) { toast.error('File too large (max 2MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result);
    reader.onerror = () => toast.error('Failed to read file');
    reader.readAsDataURL(file);
  };

  const save = async () => {
    try {
  const payload = { bio };
  if (avatarPreview) payload.avatar = avatarPreview;
      await api.updateMyProfile(payload);
      const { data } = await api.getUserProfile(profile.username);
      toast.success('Profile updated');
      onUpdated && onUpdated(data);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card w-full max-w-2xl mx-4 rounded shadow-lg p-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Edit Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">Close</button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar username={profile.username} avatar={avatarPreview} sizeClass="w-16 h-16" />
            <div>
              <label className="block text-sm text-gray-300 mb-1">Avatar</label>
              <input ref={avatarRef} type="file" accept="image/*" onChange={(e) => handleFile(e.target.files[0], setAvatarPreview)} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Bio</label>
            <textarea className="w-full bg-card p-2 rounded" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="bg-gray-700 px-4 py-2 rounded">Cancel</button>
            <button onClick={save} className="bg-green-600 px-4 py-2 rounded">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
