import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as api from '../api';
import AuthLayout from '../components/AuthLayout';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError('');

    if (name === 'newPassword') {
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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.forgotPassword({ email: formData.email });
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.verifyResetOtp({
        email: formData.email,
        otp: formData.otp,
      });
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.msg || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const isValidPassword = Object.values(passwordChecks).every(Boolean);

    if (!isValidPassword) {
      setError('Password does not meet all requirements.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.resetPassword({
        email: formData.email,
        resetToken,
        newPassword: formData.newPassword,
      });
      setStep(4);
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <AuthLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.h2 variants={itemVariants} className="text-4xl font-bold mb-3 text-white">
          {step === 4 ? 'Success!' : 'Reset Password'}
        </motion.h2>
        <motion.p variants={itemVariants} className="text-gray-400 mb-6">
          {step === 1 && "Enter your email to receive a reset code."}
          {step === 2 && "Enter the 6-digit code sent to your email."}
          {step === 3 && "Create a new password for your account."}
          {step === 4 && "Your password has been reset successfully!"}
        </motion.p>

        {error && (
          <motion.p
            variants={itemVariants}
            className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center font-medium mb-4"
          >
            {error}
          </motion.p>
        )}

        {/* Step 1: Email Input */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-8">
            <motion.div variants={itemVariants} className="relative">
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
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

            <motion.div variants={itemVariants}>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </motion.div>
          </form>
        )}

        {/* Step 2: OTP Input */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-8">
            <motion.div variants={itemVariants} className="relative">
              <input
                id="otp"
                name="otp"
                type="text"
                value={formData.otp}
                onChange={handleChange}
                maxLength={6}
                className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors text-center text-2xl tracking-widest"
                placeholder="000000"
                required
              />
              <label
                htmlFor="otp"
                className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm"
              >
                6-Digit Code
              </label>
            </motion.div>

            <motion.div variants={itemVariants}>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setFormData({ ...formData, otp: '' });
                }}
                className="text-sm text-primary hover:underline"
              >
                Back to email
              </button>
            </motion.div>
          </form>
        )}

        {/* Step 3: New Password Input */}
        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <motion.div variants={itemVariants} className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors pr-10"
                placeholder="New Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-12 w-10 flex items-center justify-center text-gray-300"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-5 0-9.27-3.11-11-7.5A17.28 17.28 0 0 1 6.3 4.1M3 3l18 18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.056-5.064 7-9.542 7-4.477 0-8.268-2.944-9.542-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
              <label
                htmlFor="newPassword"
                className="absolute left-0 -top-4 text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-primary peer-focus:text-sm"
              >
                New Password
              </label>
            </motion.div>

            {/* Password Requirements */}
            <motion.div variants={itemVariants} className="text-sm text-gray-300">
              <p className="mb-2 font-semibold">Password must contain:</p>
              <ul className="space-y-1">
                <li className={passwordChecks.length ? 'text-green-400' : 'text-gray-500'}>
                  ✓ Minimum 8 characters
                </li>
                <li className={passwordChecks.upper ? 'text-green-400' : 'text-gray-500'}>
                  ✓ Uppercase letter (A-Z)
                </li>
                <li className={passwordChecks.lower ? 'text-green-400' : 'text-gray-500'}>
                  ✓ Lowercase letter (a-z)
                </li>
                <li className={passwordChecks.number ? 'text-green-400' : 'text-gray-500'}>
                  ✓ A number (0-9)
                </li>
                <li className={passwordChecks.special ? 'text-green-400' : 'text-gray-500'}>
                  ✓ A special character (e.g. !@#$%)
                </li>
              </ul>
            </motion.div>

            <motion.div variants={itemVariants}>
              <button
                type="submit"
                disabled={loading || !Object.values(passwordChecks).every(Boolean)}
                className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </motion.div>
          </form>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <motion.div variants={itemVariants} className="text-center space-y-6">
            <div className="text-green-400 text-6xl mb-4">✓</div>
            <p className="text-gray-300">
              Your password has been reset successfully. You can now login with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
            >
              Go to Login
            </button>
          </motion.div>
        )}

        {step !== 4 && (
          <motion.p variants={itemVariants} className="text-center mt-8 text-sm text-gray-400">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Back to Login
            </Link>
          </motion.p>
        )}
      </motion.div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
