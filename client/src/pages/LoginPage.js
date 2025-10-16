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
  // forgot-password feature removed; simple login only
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Forgot password flow state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: enter email, 2: enter otp, 3: set new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

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
        <div className="mt-4 text-right">
          <button onClick={() => { setShowForgot(true); setForgotStep(1); }} className="text-sm text-primary hover:underline">Forgot password?</button>
        </div>

        {showForgot && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Reset Password</h3>
              {forgotError && <div className="bg-red-500/20 text-red-300 p-2 rounded mb-3">{forgotError}</div>}

              {forgotStep === 1 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Enter the email associated with your account and we'll send a one-time code.</p>
                  <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="Email" className="w-full p-2 bg-transparent border rounded mb-3" />
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setShowForgot(false)} className="px-4 py-2 bg-gray-700 rounded">Cancel</button>
                    <button onClick={async () => {
                      setForgotError(''); setForgotLoading(true);
                      try {
                        await api.forgotPassword({ email: forgotEmail });
                        setForgotStep(2);
                      } catch (err) {
                        setForgotError('Failed to send OTP. Try again.');
                        console.error(err);
                      } finally { setForgotLoading(false); }
                    }} className="px-4 py-2 bg-primary rounded text-white" disabled={forgotLoading}>{forgotLoading ? 'Sending...' : 'Send OTP'}</button>
                  </div>
                </div>
              )}

              {forgotStep === 2 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Enter the code sent to your email.</p>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" className="w-full p-2 bg-transparent border rounded mb-3" />
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => { setForgotStep(1); setOtp(''); }} className="px-4 py-2 bg-gray-700 rounded">Back</button>
                    <button onClick={async () => {
                      setForgotError(''); setForgotLoading(true);
                      try {
                        const { data } = await api.verifyResetOtp({ email: forgotEmail, otp });
                        // server returns resetToken
                        setResetToken(data.resetToken);
                        setForgotStep(3);
                      } catch (err) {
                        setForgotError(err?.response?.data?.msg || 'Invalid code');
                        console.error(err);
                      } finally { setForgotLoading(false); }
                    }} className="px-4 py-2 bg-primary rounded text-white" disabled={forgotLoading}>{forgotLoading ? 'Verifying...' : 'Verify'}</button>
                  </div>
                </div>
              )}

              {forgotStep === 3 && (
                <div>
                  <p className="text-sm text-gray-400 mb-3">Enter a new password for your account.</p>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="w-full p-2 bg-transparent border rounded mb-3" />
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => { setForgotStep(2); setNewPassword(''); }} className="px-4 py-2 bg-gray-700 rounded">Back</button>
                    <button onClick={async () => {
                      setForgotError(''); setForgotLoading(true);
                      try {
                        await api.resetPassword({ email: forgotEmail, resetToken, newPassword });
                        // success - close and show a small success message
                        setShowForgot(false);
                        setForgotStep(1);
                        setForgotEmail(''); setOtp(''); setResetToken(''); setNewPassword('');
                        setError('Password reset successful. You can now login.');
                      } catch (err) {
                        setForgotError(err?.response?.data?.msg || 'Failed to reset password');
                        console.error(err);
                      } finally { setForgotLoading(false); }
                    }} className="px-4 py-2 bg-primary rounded text-white" disabled={forgotLoading}>{forgotLoading ? 'Resetting...' : 'Reset Password'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <motion.p variants={itemVariants} className="text-center mt-8 text-sm text-gray-400">
          Don't have an account? <Link to="/signup" className="font-semibold text-primary hover:underline">Sign Up</Link>
        </motion.p>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginPage;