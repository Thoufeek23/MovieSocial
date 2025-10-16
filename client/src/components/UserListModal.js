import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';

const UserListModal = ({ isOpen, onClose, title = 'Users', users = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card w-full max-w-md mx-4 rounded shadow-lg p-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title} ({users.length})</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">Close</button>
        </div>
        <div className="max-h-80 overflow-auto">
          {users.length === 0 ? (
            <div className="text-gray-400">No users to show.</div>
          ) : (
            users.map(u => (
              <Link to={`/profile/${u.username}`} key={u._id || u.username} className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 transition-colors">
                <Avatar username={u.username} avatar={u.avatar} sizeClass="w-10 h-10" />
                <div className="text-sm font-medium">{u.username}</div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListModal;
