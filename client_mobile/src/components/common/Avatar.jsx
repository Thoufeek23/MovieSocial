import React, { useState } from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

const Avatar = ({ username, avatar, sizeClass = 'w-10 h-10', className = '', linkTo }) => {
  const [imgSrc, setImgSrc] = useState(
    avatar ? { uri: avatar } : require('../../assets/images/default_dp.png')
  );

  const AvatarImage = (
    <Image
      source={imgSrc}
      className={`rounded-full ${sizeClass} ${className}`}
      resizeMode="cover"
      onError={() => setImgSrc(require('../../assets/images/default_dp.png'))}
      accessibilityLabel={`${username || 'user'} avatar`}
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