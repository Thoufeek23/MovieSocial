import React, { useState, useEffect } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';

const Avatar = ({ user, username, avatar, sizeClass = 'w-10 h-10', className = '', linkTo }) => {
  // 1. Handle inputs: Support both direct props and 'user' object from API
  const imageUri = avatar || user?.profileImage || user?.avatar;
  const displayUsername = username || user?.username || 'user';
  
  // 2. CHANGED: Fixed path to point to client_mobile/assets/images/
  // Go up 3 levels: common -> components -> src -> client_mobile
  const defaultImage = require('../../../assets/images/default_dp.png');

  const [isError, setIsError] = useState(false);

  // Reset error if the image source changes (e.g. reused in FlatList)
  useEffect(() => {
    setIsError(false);
  }, [imageUri]);

  const AvatarImage = (
    <Image
      source={imageUri && !isError ? { uri: imageUri } : defaultImage}
      className={`rounded-full ${sizeClass} ${className} bg-zinc-800`}
      resizeMode="cover"
      onError={() => setIsError(true)}
      accessibilityLabel={`${displayUsername} avatar`}
    />
  );

  if (linkTo) {
    return (
      <Link href={linkTo} asChild>
        <TouchableOpacity activeOpacity={0.8}>
          {AvatarImage}
        </TouchableOpacity>
      </Link>
    );
  }

  return AvatarImage;
};

export default Avatar;