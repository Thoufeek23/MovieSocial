// src/pages/SignupPage.js
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import * as api from '../api';

const SignupPage = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    try {
      const { data } = await api.register(formData);
      login(data); // Log the user in immediately after successful registration
      navigate('/');
    } catch (err) {
      setError('Failed to create account. Email or username may be taken.');
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-3xl font-bold mb-6 text-center">Create an Account</h2>
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg">
        {error && <p className="bg-red-500 text-white p-3 rounded mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Username</label>
          <input type="text" name="username" onChange={handleChange} className="w-full p-2 bg-gray-700 rounded text-white" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-300 mb-2">Email</label>
          <input type="email" name="email" onChange={handleChange} className="w-full p-2 bg-gray-700 rounded text-white" required />
        </div>
        <div className="mb-6">
          <label className="block text-gray-300 mb-2">Password</label>
          <input type="password" name="password" onChange={handleChange} className="w-full p-2 bg-gray-700 rounded text-white" required />
        </div>
        <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">Sign Up</button>
      </form>
      <p className="text-center mt-4">
        Already have an account? <Link to="/login" className="text-green-400 hover:underline">Log In</Link>
      </p>
    </div>
  );
};

export default SignupPage;