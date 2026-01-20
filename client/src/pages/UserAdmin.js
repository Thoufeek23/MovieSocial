import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api';
import Avatar from '../components/Avatar';
import { Trash2, Search, UserCheck, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const UserAdmin = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userToDelete) => {
        if (!window.confirm(`Are you extremely sure you want to delete ${userToDelete.username}? This removes all their data forever.`)) {
            return;
        }
        try {
            await api.adminDeleteUser(userToDelete._id);
            toast.success(`${userToDelete.username} deleted successfully`);
            setUsers(users.filter(u => u._id !== userToDelete._id));
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.msg || 'Failed to delete user');
        }
    };

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <UserCheck className="text-green-500" /> 
                        User Administration
                    </h1>
                    <p className="text-gray-400 mt-1">Manage platform users ({users.length} total)</p>
                </div>
                
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-900 border border-gray-800 rounded-full pl-10 pr-4 py-2 w-full md:w-64 focus:border-green-500 focus:outline-none text-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading users...</div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            No users found matching "{searchTerm}"
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user._id} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar username={user.username} avatar={user.avatar} sizeClass="w-8 h-8" />
                                                    <Link to={`/profile/${user.username}`} className="font-medium text-gray-200 hover:text-green-400">
                                                        {user.username}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} className="opacity-50" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.isAdmin ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-900/50 text-purple-300 text-xs font-bold border border-purple-800">
                                                        Admin
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500 text-xs">User</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!user.isAdmin && (
                                                    <button 
                                                        onClick={() => handleDelete(user)}
                                                        className="text-gray-500 hover:text-red-500 hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserAdmin;