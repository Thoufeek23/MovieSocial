// frontend/app/styles/signupStyles.js

import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const signupStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 10,
    flex: 0.2,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 25,
    paddingVertical: 5,
    borderRadius: 25,
    marginBottom: 0,
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  formContainer: {
    flex: 0.8,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  formCard: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 28,
    borderWidth: 0,
    borderColor: 'transparent',
    marginHorizontal: 5,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#fecaca',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 14,
  },
  inputsContainer: {
    marginBottom: 10,
  },
  inputWrapper: {
    backgroundColor: 'transparent',
    borderRadius: 15,
    marginBottom: 3,
  },
  passwordChecks: {
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  passwordCheckText: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 15,
  },
  signupButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  otpContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  otpText: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailText: {
    fontWeight: 'bold',
    color: 'white',
  },
  otpButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#374151',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeContainer: {
    marginTop: 10,
  },
  completeText: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  completeButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    marginTop: 20,
    marginBottom: 5,
    alignItems: 'center',
  },
  loginBox: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  loginText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#f3f4f6',
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginLink: {
    fontWeight: 'bold',
    color: '#10b981',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export { signupStyles };
export default signupStyles;