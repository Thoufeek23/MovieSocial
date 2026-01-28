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
  // const [signupStep, setSignupStep] = useState(1); // Commented out: OTP flow disabled
  // const [otp, setOtp] = useState(''); // Commented out
  // const [signupToken, setSignupToken] = useState(''); // Commented out
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
        const { data } = await api.googleSignUp(response.credential);
        login(data, data.isNewUser);
        setShowCurtains(true);
        setTimeout(() => {
          if (data.isNewUser) {
            navigate('/username'); // Redirect to username page for new Google users
          } else {
            navigate('/');
          }
          setIsLoading(false);
        }, 100);
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
  }, [login, navigate, setShowCurtains]);

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

    // Validate username length (5-20 characters)
    if (formData.username.trim().length < 5) {
      setError('Username must be at least 5 characters.');
      return;
    }
    if (formData.username.trim().length > 20) {
      setError('Username cannot be more than 20 characters.');
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

      const { data } = await api.register(payload);
      login(data, true);
      setShowCurtains(true);
      navigate('/interests');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to sign up.');
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
        <motion.h2 variants={itemVariants} className="text-4xl font-bold mb-3 text-white">Create Account</motion.h2>
        <motion.p variants={itemVariants} className="text-gray-400 mb-6">Join the community and start sharing your thoughts on film.</motion.p>

        {error && <motion.p variants={itemVariants} className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center font-medium">{error}</motion.p>}

        {/* Google Sign In Button - Primary Method */}
        <motion.div variants={itemVariants} className="mb-6">
          <div id="googleSignUpButton" className="flex justify-center"></div>
        </motion.div>

        {/* Divider */}
        <motion.div variants={itemVariants} className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="px-4 text-gray-400 text-sm font-semibold">OR</span>
          <div className="flex-1 border-t border-gray-600"></div>
        </motion.div>

        {/* Old Signup Method - Disabled Notice */}
        <motion.div variants={itemVariants} className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-3 rounded-lg text-center mb-6">
          <p className="text-sm font-medium">⚠️ Use Google Sign Up (traditional registration is disabled)</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-md opacity-50 pointer-events-none">
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
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors pr-10"
              placeholder="Password"
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
            <input id="confirmPassword" name="confirmPassword" type="password" onChange={handleChange} className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors" placeholder="Retype password" required />
            <label htmlFor="confirmPassword" className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm">Retype password</label>
          </motion.div>

          <motion.div variants={itemVariants}>
            <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500">{isLoading ? 'Signing up...' : 'Sign Up'}</button>
          </motion.div>
        </form>

        {/* Commented out: OTP flow disabled
        {signupStep === 2 && (
          <div className="space-y-6 max-w-md">
            <p className="text-sm text-gray-400">We've sent an OTP to <strong>{formData.email}</strong>. Enter it below to verify your email.</p>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" maxLength={6} type="text" className="w-full p-2 bg-transparent border rounded" />
            <div className="flex gap-3">
              <button onClick={() => setSignupStep(1)} className="px-4 py-2 bg-gray-700 rounded">Back</button>
              <button onClick={handleVerifyOtp} className="px-4 py-2 bg-primary rounded text-white" disabled={isLoading || otp.trim().length === 0}>{isLoading ? 'Verifying...' : 'Verify'}</button>
            </div>
          </div>
        )}

        {signupStep === 3 && (
          <div className="space-y-6 max-w-md">
            <p className="text-sm text-gray-400">Verification successful. Click below to complete account creation.</p>
            <div className="flex gap-3">
              <button onClick={() => setSignupStep(2)} className="px-4 py-2 bg-gray-700 rounded">Back</button>
              <button onClick={handleCompleteSignup} className="px-4 py-2 bg-primary rounded text-white" disabled={isLoading}>{isLoading ? 'Completing...' : 'Complete Signup'}</button>
            </div>
          </div>
        )}
        */}

        <motion.p variants={itemVariants} className="text-center mt-6 text-sm text-gray-400">Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Log In</Link></motion.p>
      </motion.div>
    </AuthLayout>
  );
};

export default SignupPage;