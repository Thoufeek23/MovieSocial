// frontend/app/styles/loginStyles.js

import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const loginStyles = StyleSheet.create({
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 10,
    flex: 0.25,
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
    width: 200,
    height: 200,
  },
  taglineContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderRadius: 15,
    maxWidth: width - 60,
    marginTop: -5,
  },
  taglineText: {
    fontSize: 15,
    color: '#f3f4f6',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  formContainer: {
    flex: 0.75,
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 10,
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
    fontSize: 26,
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
    marginBottom: 18,
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
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: 10,
  },
  loginButton: {
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
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  forgotPasswordContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  forgotPasswordButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  signupContainer: {
    marginTop: 12,
    marginBottom: 5,
    alignItems: 'center',
  },
  signupBox: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  signupText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#f3f4f6',
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupLink: {
    fontWeight: 'bold',
    color: '#10b981',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});