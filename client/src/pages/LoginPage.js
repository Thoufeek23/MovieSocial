import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import * as api from '../api';
import AuthLayout from '../components/AuthLayout';
import Curtain from '../components/Curtain';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurtains] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
        const { data } = await api.login(formData);
        login(data); // This now sets isJustLoggedIn to true in the context
        navigate('/'); // Navigate immediately
    } catch (err) {
        setError('Invalid credentials. Please try again.');
        console.error(err);
        setIsLoading(false);
    }
};

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <AuthLayout>
      <AnimatePresence>
        {showCurtains && <Curtain onAnimationComplete={() => navigate('/')} />}
      </AnimatePresence>

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.h2 variants={itemVariants} className="text-4xl font-bold mb-3 text-white">Welcome Back!</motion.h2>
        <motion.p variants={itemVariants} className="text-gray-400 mb-10">Login to continue your movie journey.</motion.p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center font-medium">{error}</p>}
          
          <motion.div variants={itemVariants} className="relative">
            <input
              id="email"
              name="email"
              type="email"
              onChange={handleChange}
              className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors"
              placeholder="Email"
              required
            />
            <label
              htmlFor="email"
              className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm"
            >
              Email
            </label>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <input
              id="password"
              name="password"
              type="password"
              onChange={handleChange}
              className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors"
              placeholder="Password"
              required
            />
            <label
              htmlFor="password"
              className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm"
            >
              Password
            </label>
          </motion.div>

          <motion.div variants={itemVariants}>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </motion.div>
        </form>

        <motion.p variants={itemVariants} className="text-center mt-8 text-sm text-gray-400">
          Don't have an account? <Link to="/signup" className="font-semibold text-primary hover:underline">Sign Up</Link>
        </motion.p>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginPage;