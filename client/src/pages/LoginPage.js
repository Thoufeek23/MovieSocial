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
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotPasswordChecks, setForgotPasswordChecks] = useState({ length: false, upper: false, lower: false, number: false, special: false });
  const canForgotReset = Object.values(forgotPasswordChecks).every(Boolean);

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
          {success && <p className="bg-green-500/20 text-green-400 p-3 rounded-lg text-center font-medium">{success}</p>}
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
              type={showPassword ? 'text' : 'password'}
              onChange={handleChange}
              className="peer h-12 w-full border-b-2 border-gray-600 text-white bg-transparent placeholder-transparent focus:outline-none focus:border-primary transition-colors pr-10"
              placeholder="Password"
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
              disabled={isLoading}
              className="w-full bg-primary hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-gray-500"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </motion.div>
        </form>
        <div className="mt-4 text-right">
          <button onClick={() => { setShowForgot(true); setForgotStep(1); setSuccess(''); }} className="text-sm text-primary hover:underline">Forgot password?</button>
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
                        const msg = err?.response?.data?.msg || 'Failed to send OTP. Try again.';
                        setForgotError(msg);
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
                  <div className="relative mb-2">
                    <input
                      type={forgotShowPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNewPassword(v);
                        const checks = {
                          length: v.length >= 8,
                          upper: /[A-Z]/.test(v),
                          lower: /[a-z]/.test(v),
                          number: /\d/.test(v),
                          special: /[\W_]/.test(v),
                        };
                        setForgotPasswordChecks(checks);
                      }}
                      placeholder="New password"
                      className="w-full p-2 bg-transparent border rounded"
                    />
                    <button type="button" onClick={() => setForgotShowPassword(!forgotShowPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300">
                      {forgotShowPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-5 0-9.27-3.11-11-7.5A17.28 17.28 0 0 1 6.3 4.1M3 3l18 18"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.056-5.064 7-9.542 7-4.477 0-8.268-2.944-9.542-7z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>

                  <div className="mb-3 text-sm text-gray-300">
                    <ul className="space-y-1">
                      <li className={forgotPasswordChecks.length ? 'text-green-400' : 'text-gray-500'}>Minimum 8 characters</li>
                      <li className={forgotPasswordChecks.upper ? 'text-green-400' : 'text-gray-500'}>Uppercase letter (A-Z)</li>
                      <li className={forgotPasswordChecks.lower ? 'text-green-400' : 'text-gray-500'}>Lowercase letter (a-z)</li>
                      <li className={forgotPasswordChecks.number ? 'text-green-400' : 'text-gray-500'}>A number (0-9)</li>
                      <li className={forgotPasswordChecks.special ? 'text-green-400' : 'text-gray-500'}>A special character (e.g. !@#$%)</li>
                    </ul>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => { setForgotStep(2); setNewPassword(''); }} className="px-4 py-2 bg-gray-700 rounded">Back</button>
                    <button onClick={async () => {
                      setForgotError('');
                      if (!canForgotReset) {
                        setForgotError('Password does not meet requirements.');
                        return;
                      }
                      setForgotLoading(true);
                      try {
                        await api.resetPassword({ email: forgotEmail, resetToken, newPassword });
                        // success - close and show a small success message
                        setShowForgot(false);
                        setForgotStep(1);
                        setForgotEmail(''); setOtp(''); setResetToken(''); setNewPassword('');
                        setForgotPasswordChecks({ length: false, upper: false, lower: false, number: false, special: false });
                        setSuccess('Password reset successful. You can now login.');
                      } catch (err) {
                        setForgotError(err?.response?.data?.msg || 'Failed to reset password');
                        console.error(err);
                      } finally { setForgotLoading(false); }
                    }} className="px-4 py-2 bg-primary rounded text-white" disabled={forgotLoading || !canForgotReset}>{forgotLoading ? 'Resetting...' : 'Reset Password'}</button>
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