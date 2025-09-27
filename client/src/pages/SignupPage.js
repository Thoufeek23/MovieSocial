import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import * as api from '../api';
import AuthLayout from '../components/AuthLayout';
import Curtain from '../components/Curtain';

const SignupPage = () => {
  const [formData, setFormData] = useState({ name: '', age: '', username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurtains, setShowCurtains] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // basic validations
    if (!formData.name.trim() || !formData.age.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill out all fields.');
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const ageNum = Number(formData.age);
    if (!Number.isInteger(ageNum) || ageNum < 8 || ageNum > 120) {
      setError('Please enter a valid age (must be at least 8).');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please retype your password.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        age: ageNum,
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      const { data } = await api.register(payload);
      // login will set token in localStorage and update context
      login(data);
      // show curtain animation then navigate
      setShowCurtains(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create account.');
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
        <motion.h2 variants={itemVariants} className="text-4xl font-bold mb-3 text-white">Create Account</motion.h2>
        <motion.p variants={itemVariants} className="text-gray-400 mb-6">Join the community and start sharing your thoughts on film.</motion.p>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
          {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center font-medium">{error}</p>}

          <motion.div variants={itemVariants} className="relative">
            <input id="name" name="name" type="text" onChange={handleChange} className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors" placeholder="Full name" required />
            <label htmlFor="name" className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm">Full name</label>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <input id="age" name="age" type="text" inputMode="numeric" pattern="[0-9]*" onChange={handleChange} className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors" placeholder="Age" required />
            <label htmlFor="age" className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm">Age</label>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <input id="username" name="username" type="text" onChange={handleChange} className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors" placeholder="Username" required />
            <label htmlFor="username" className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm">Username</label>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <input id="email" name="email" type="email" onChange={handleChange} className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors" placeholder="Email" required />
            <label htmlFor="email" className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm">Email</label>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <input id="password" name="password" type="password" onChange={handleChange} className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors" placeholder="Password" required />
            <label htmlFor="password" className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm">Password</label>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <input id="confirmPassword" name="confirmPassword" type="password" onChange={handleChange} className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors" placeholder="Retype password" required />
            <label htmlFor="confirmPassword" className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm">Retype password</label>
          </motion.div>

          <motion.div variants={itemVariants}>
            <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500">{isLoading ? 'Creating Account...' : 'Sign Up'}</button>
          </motion.div>
        </form>

        <motion.p variants={itemVariants} className="text-center mt-6 text-sm text-gray-400">Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Log In</Link></motion.p>
      </motion.div>
    </AuthLayout>
  );
};

export default SignupPage;