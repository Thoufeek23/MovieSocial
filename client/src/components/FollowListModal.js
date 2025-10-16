import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as api from '../api';
import { AuthContext } from '../context/AuthContext';

const FollowListModal = ({ isOpen, onClose, title = 'Users', users = [], currentUser = null }) => {
  // Build a quick lookup of usernames and ids the current user already follows.
  // currentUser.following can be populated objects ({ _id, username }) or id strings.
  const buildFollowingKeys = (following = []) => {
    const keys = [];
    (following || []).forEach(f => {
      if (!f) return;
      if (typeof f === 'string') {
        keys.push(String(f)); // id string
      } else {
        if (f._id) keys.push(String(f._id));
        if (f.username) keys.push(f.username);
      }
    });
    return keys.filter(Boolean);
  };

  const [localFollowing, setLocalFollowing] = useState(() => new Set(buildFollowingKeys((currentUser && currentUser.following) || [])));
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card w-full max-w-md mx-4 rounded-lg shadow-xl p-4 z-10">
        <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
            <div className="text-xs text-gray-400">{users.length} {users.length === 1 ? 'user' : 'users'}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-800"><X size={18} /></button>
        </div>

        <div className="max-h-80 overflow-auto divide-y divide-gray-800">
          {users.length === 0 ? (
            <div className="text-gray-400 p-4">No users to show.</div>
          ) : (
            users.map(u => (
              <Link
                to={`/profile/${u.username}`}
                key={u._id || u.username}
                className="group block p-3"
                aria-label={`View profile of ${u.username}`}
              >
                <div className="card card-hover pop-on-hover flex items-center gap-3 p-3">
                  <Avatar username={u.username} avatar={u.avatar} sizeClass="w-10 h-10" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold group-hover:text-green-400 transition-colors">{u.username}</div>
                    <div className="text-xs text-gray-400">@{u.username}</div>
                  </div>
                  {/* optional placeholder for follow button; hide when viewing the Following list */}
                  {title === 'Followers' && !localFollowing.has(u.username) && !localFollowing.has(String(u._id)) && (
                    <div className="opacity-80 text-sm">
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // If not logged in, send them to login
                          if (!currentUser) {
                            toast('Log in to follow users');
                            navigate('/login');
                            return;
                          }
                          try {
                            await api.followUser(u.username);
                            // optimistically hide the button for this user (track both id and username)
                            setLocalFollowing(prev => {
                              const nxt = new Set(prev);
                              if (u.username) nxt.add(u.username);
                              if (u._id) nxt.add(String(u._id));
                              return nxt;
                            });
                            // Update global auth cache so the change persists across navigation
                            if (setUser && currentUser) {
                              const updated = { ...currentUser };
                              updated.following = updated.following ? [...updated.following] : [];
                              // push id if not present
                              const idKey = u._id ? String(u._id) : null;
                              if (idKey && !updated.following.map(String).includes(idKey)) {
                                updated.following.push(idKey);
                              }
                              setUser(updated);
                            }
                            toast.success(`Followed ${u.username}`);
                          } catch (err) {
                            console.error('Failed to follow', err);
                            toast.error('Failed to follow user');
                          }
                        }}
                        className="px-3 py-1 rounded-full bg-transparent hover:bg-green-700 hover:text-white transition-colors text-green-500"
                      >
                        Follow
                      </button>
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowListModal;
