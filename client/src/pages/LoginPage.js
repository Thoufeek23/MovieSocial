import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import * as api from '../api';
import AuthLayout from '../components/AuthLayout';
import Curtain from '../components/Curtain';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurtains] = useState(false);
  // Commented out: forgot password flow disabled
  // const [showForgot, setShowForgot] = useState(false);
  // const [forgotStep, setForgotStep] = useState(1);
  // const [forgotEmail, setForgotEmail] = useState('');
  // const [otp, setOtp] = useState('');
  // const [resetToken, setResetToken] = useState('');
  // const [newPassword, setNewPassword] = useState('');
  // const [forgotError, setForgotError] = useState('');
  // const [forgotLoading, setForgotLoading] = useState(false);
  // const [forgotShowPassword, setForgotShowPassword] = useState(false);
  // const [forgotPasswordChecks, setForgotPasswordChecks] = useState({ length: false, upper: false, lower: false, number: false, special: false });
  // const canForgotReset = Object.values(forgotPasswordChecks).every(Boolean);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Initialize Google Sign In
  useEffect(() => {
    // Load Google Sign In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleSignIn = useCallback(async (response) => {
    if (response.credential) {
      setIsLoading(true);
      setError('');
      try {
        const { data } = await api.googleSignIn(response.credential);
        login(data, data.isNewUser);
        setTimeout(() => {
          if (data.isNewUser) {
            navigate('/interests');
          } else {
            navigate('/');
          }
          setIsLoading(false);
        }, 100);
      } catch (err) {
        const errorMsg = err?.response?.data?.msg || 'Google Sign In failed. Please try again.';
        const accountNotFound = err?.response?.data?.accountNotFound;
        
        setError(errorMsg);
        console.error('Google Sign In error:', err);
        setIsLoading(false);
        
        // Redirect to signup if account doesn't exist
        if (accountNotFound) {
          setTimeout(() => {
            navigate('/signup');
          }, 2000);
        }
      }
    }
  }, [login, navigate]);

  // Initialize Google Sign In button
  useEffect(() => {
    const initializeGoogleButton = () => {
      if (window.google && document.getElementById('googleSignInButton')) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          { 
            theme: 'filled_black',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'rectangular'
          }
        );
      }
    };

    // Try to initialize immediately if Google is already loaded
    if (window.google) {
      initializeGoogleButton();
    }

    // Also try after a short delay to ensure script is loaded
    const timer = setTimeout(initializeGoogleButton, 500);

    return () => clearTimeout(timer);
  }, [handleGoogleSignIn]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // clear any global success when user starts interacting with the form
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
        const { data } = await api.login(formData);
        login(data); // This now sets isJustLoggedIn to true in the context
        
        // Small delay to ensure user state is updated before navigation
        setTimeout(() => {
          navigate('/');
          setIsLoading(false);
        }, 100);
    } catch (err) {
        const errorMsg = err.response?.data?.msg || 'Invalid credentials. Please try again.';
        const accountNotFound = err.response?.data?.accountNotFound;
        
        setError(errorMsg);
        console.error(err);
        setIsLoading(false);
        
        // Redirect to signup if account doesn't exist
        if (accountNotFound) {
          setTimeout(() => {
            navigate('/signup');
          }, 2000);
        }
    }
};

  // forgot-password handlers removed

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
        <motion.p variants={itemVariants} className="text-gray-400 mb-6">Login to continue your movie journey.</motion.p>

        {error && <motion.p variants={itemVariants} className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center font-medium mb-4">{error}</motion.p>}
        {success && <motion.p variants={itemVariants} className="bg-green-500/20 text-green-400 p-3 rounded-lg text-center font-medium mb-4">{success}</motion.p>}

        {/* Maintenance Notice */}
        <motion.div variants={itemVariants} className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 p-4 rounded-lg text-center mb-6">
          <p className="font-semibold mb-1">⚠️ Traditional Login Under Maintenance</p>
          <p className="text-sm">Please use Google Sign In below for authentication.</p>
        </motion.div>

        {/* Google Sign In Button - Primary Method */}
        <motion.div variants={itemVariants} className="mb-6">
          <div id="googleSignInButton" className="flex justify-center"></div>
        </motion.div>

        {/* Divider */}
        <motion.div variants={itemVariants} className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="px-4 text-gray-400 text-sm font-semibold">OR</span>
          <div className="flex-1 border-t border-gray-600"></div>
        </motion.div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-8 opacity-50 pointer-events-none">
          <motion.div variants={itemVariants} className="relative">
            <input
              id="email"
              name="email"
              type="email"
              onChange={handleChange}
              className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors"
              placeholder="Email"
              disabled
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
              type={showPassword ? 'text' : 'password'}
              onChange={handleChange}
              className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors pr-10"
              placeholder="Password"
              disabled
              required
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-0 h-12 w-10 flex items-center justify-center text-gray-300">
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-5 0-9.27-3.11-11-7.5A17.28 17.28 0 0 1 6.3 4.1M3 3l18 18"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.056-5.064 7-9.542 7-4.477 0-8.268-2.944-9.542-7z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
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
              disabled={true}
              className="w-full bg-gray-600 text-gray-400 font-bold py-3 px-4 rounded-lg cursor-not-allowed"
            >
              Login (Under Maintenance)
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