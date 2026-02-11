import React, { useState, useContext, useEffect, useCallback } from 'react';
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
  const [signupStep, setSignupStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [signupToken, setSignupToken] = useState('');
  const [showCurtains, setShowCurtains] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({ length: false, upper: false, lower: false, number: false, special: false });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Initialize Google Sign In
  useEffect(() => {
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
        // Call init endpoint - doesn't create account yet
        const { data } = await api.googleSignUpInit(response.credential);
        
        // Store temporary token and Google data in localStorage
        localStorage.setItem('googleSignupTemp', JSON.stringify({
          tempToken: data.tempToken,
          googleData: data.googleData
        }));
        
        // Navigate to username page immediately
        navigate('/username');
        setIsLoading(false);
      } catch (err) {
        const errorMsg = err?.response?.data?.msg || 'Google Sign Up failed. Please try again.';
        const accountExists = err?.response?.data?.accountExists;
        
        setError(errorMsg);
        console.error('Google Sign Up error:', err);
        setIsLoading(false);
        
        // Redirect to login if account already exists
        if (accountExists) {
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      }
    }
  }, [navigate]);

  // Initialize Google Sign In button
  useEffect(() => {
    const initializeGoogleButton = () => {
      if (window.google && document.getElementById('googleSignUpButton')) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('googleSignUpButton'),
          { 
            theme: 'filled_black',
            size: 'large',
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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'password') {
      const checks = {
        length: value.length >= 8,
        upper: /[A-Z]/.test(value),
        lower: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[\W_]/.test(value),
      };
      setPasswordChecks(checks);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // basic validations
    if (!formData.name.trim() || !formData.age.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill out all fields.');
      return;
    }

    // Validate username length (5-15 characters)
    if (formData.username.trim().length < 5) {
      setError('Username must be at least 5 characters.');
      return;
    }
    if (formData.username.trim().length > 15) {
      setError('Username cannot be more than 15 characters.');
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

    // Password policy: min 8 chars, uppercase, lowercase, number, special
    const pwd = formData.password;
    const pwdPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!pwdPolicy.test(pwd)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number and special character.');
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

      await api.sendSignupOtp(payload);
      setSignupStep(2);
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send OTP.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.verifySignupOtp({ email: formData.email, otp });
      setSignupToken(data.signupToken);
      setSignupStep(3);
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSignup = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.completeSignup({ email: formData.email, signupToken });
      login(data, true);
      setShowCurtains(true);
      navigate('/interests');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to complete signup.');
      console.error(err);
    } finally {
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
        <motion.h2 variants={itemVariants} className="text-4xl font-bold mb-3 text-white">
          {signupStep === 1 ? 'Create Account' : signupStep === 2 ? 'Verify Email' : 'Complete Signup'}
        </motion.h2>
        <motion.p variants={itemVariants} className="text-gray-400 mb-6">
          {signupStep === 1 ? 'Join the community and start sharing your thoughts on film.' : signupStep === 2 ? 'Enter the 6-digit code sent to your email.' : 'Almost there! Complete your registration.'}
        </motion.p>

        {error && <motion.p variants={itemVariants} className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center font-medium">{error}</motion.p>}

        {signupStep === 1 && (
          <>
            {/* Maintenance Notice */}
            <motion.div variants={itemVariants} className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 p-4 rounded-lg text-center mb-6">
              <p className="font-semibold mb-1">⚠️ Traditional Sign Up Under Maintenance</p>
              <p className="text-sm">Please use Google Sign Up below for authentication.</p>
            </motion.div>

            {/* Google Sign Up Button - Primary Method */}
            <motion.div variants={itemVariants} className="mb-6">
              <div id="googleSignUpButton" className="flex justify-center"></div>
            </motion.div>

            {/* Divider */}
            <motion.div variants={itemVariants} className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-600"></div>
              <span className="px-4 text-gray-400 text-sm font-semibold">OR</span>
              <div className="flex-1 border-t border-gray-600"></div>
            </motion.div>
          </>
        )}

        {signupStep === 1 && (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md opacity-50 pointer-events-none">
          <motion.div variants={itemVariants} className="relative">
            <input id="name" name="name" type="text" onChange={handleChange} className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors" placeholder="Full name" disabled required />
            <label htmlFor="name" className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm">Full name</label>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <input id="age" name="age" type="text" inputMode="numeric" pattern="[0-9]*" onChange={handleChange} className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors" placeholder="Age" disabled required />
            <label htmlFor="age" className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm">Age</label>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <input id="username" name="username" type="text" onChange={handleChange} className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors" placeholder="Username" disabled required />
            <label htmlFor="username" className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm">Username</label>
          </motion.div>



          <motion.div variants={itemVariants} className="relative">
            <input id="email" name="email" type="email" onChange={handleChange} className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors" placeholder="Email" disabled required />
            <label htmlFor="email" className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm">Email</label>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors pr-10"
              placeholder="Password"
              disabled
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 h-12 w-10 flex items-center justify-center text-gray-300"
            >
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
            <div className="mt-2 text-sm text-gray-300">
              <ul className="space-y-1">
                <li className={passwordChecks.length ? 'text-green-400' : 'text-gray-500'}>Minimum 8 characters</li>
                <li className={passwordChecks.upper ? 'text-green-400' : 'text-gray-500'}>Uppercase letter (A-Z)</li>
                <li className={passwordChecks.lower ? 'text-green-400' : 'text-gray-500'}>Lowercase letter (a-z)</li>
                <li className={passwordChecks.number ? 'text-green-400' : 'text-gray-500'}>A number (0-9)</li>
                <li className={passwordChecks.special ? 'text-green-400' : 'text-gray-500'}>A special character (e.g. !@#$%)</li>
              </ul>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <input id="confirmPassword" name="confirmPassword" type="password" onChange={handleChange} className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors" placeholder="Retype password" disabled required />
            <label htmlFor="confirmPassword" className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm">Retype password</label>
          </motion.div>

          <motion.div variants={itemVariants}>
            <button type="submit" disabled={true} className="w-full bg-gray-600 text-gray-400 font-bold py-3 px-4 rounded-lg cursor-not-allowed">Sign Up (Under Maintenance)</button>
          </motion.div>
        </form>
        )}

        {signupStep === 2 && (
          <motion.div variants={itemVariants} className="space-y-6 max-w-md">
            <p className="text-sm text-gray-300 bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
              We've sent a 6-digit code to <strong className="text-white">{formData.email}</strong>. Please check your email and enter it below.
            </p>
            <div className="relative">
              <input 
                value={otp} 
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                placeholder="000000" 
                maxLength={6} 
                type="text" 
                className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors text-center text-2xl tracking-widest" 
              />
              <label className="absolute left-0 -top-4 text-gray-400 text-sm">
                6-Digit Code
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setSignupStep(1); setOtp(''); setError(''); }} className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors">Back</button>
              <button onClick={handleVerifyOtp} className="flex-1 px-4 py-3 bg-primary hover:bg-green-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500" disabled={isLoading || otp.trim().length !== 6}>{isLoading ? 'Verifying...' : 'Verify'}</button>
            </div>
          </motion.div>
        )}

        {signupStep === 3 && (
          <motion.div variants={itemVariants} className="space-y-6 max-w-md">
            <div className="text-center">
              <div className="text-green-400 text-6xl mb-4">✓</div>
              <p className="text-lg text-gray-300 mb-2">Email Verified Successfully!</p>
              <p className="text-sm text-gray-400">Click below to complete your account creation.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setSignupStep(2); setError(''); }} className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors">Back</button>
              <button onClick={handleCompleteSignup} className="flex-1 px-4 py-3 bg-primary hover:bg-green-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500" disabled={isLoading}>{isLoading ? 'Completing...' : 'Complete Signup'}</button>
            </div>
          </motion.div>
        )}

        <motion.p variants={itemVariants} className="text-center mt-6 text-sm text-gray-400">Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Log In</Link></motion.p>
      </motion.div>
    </AuthLayout>
  );
};

export default SignupPage;