import React from 'react';
import { Link } from 'react-router-dom';

// Avatar component
// Props:
// - username (string)
// - avatar (url)
// - sizeClass (tailwind classes for sizing, default w-10 h-10)
// - className (additional classes)
// - linkTo (optional string) if provided, wrap avatar in a Link
const Avatar = ({ username, avatar, sizeClass = 'w-10 h-10', className = '', linkTo }) => {
    const src = avatar || '/default_dp.png';
    const img = (
        <img
            src={src}
            alt={`${username || 'user'} avatar`}
            className={`rounded-full object-cover ${sizeClass} ${className}`}
            loading="lazy"
        />
    );

    if (linkTo) return <Link to={linkTo}>{img}</Link>;
    return img;
};

export default Avatar;
