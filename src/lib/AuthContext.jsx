import React, { createContext, useState, useContext, useEffect } from 'react';
import { synkify } from '@/api/synkifyClient';

const AuthContext = createContext();

export const SynkifyAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    if (synkify.isFirebase && synkify.auth.onAuthStateChanged) {
      setIsLoadingPublicSettings(false);
      setAppPublicSettings({ id: 'firebase', public_settings: {} });
      const unsubscribe = synkify.auth.onAuthStateChanged(async (firebaseUser) => {
        setIsLoadingAuth(true);
        setAuthError(null);
        if (!firebaseUser) {
          setUser(null);
          setIsAuthenticated(false);
          setAuthChecked(true);
          setIsLoadingAuth(false);
          return;
        }
        try {
          const currentUser = await synkify.auth.me();
          setUser(currentUser);
          setIsAuthenticated(true);
          setAuthChecked(true);
        } catch (error) {
          console.error('Firebase user profile check failed:', error);
          setAuthError({
            type: 'unknown',
            message: error.message || 'Failed to load user profile',
          });
          setIsAuthenticated(false);
          setAuthChecked(true);
        } finally {
          setIsLoadingAuth(false);
        }
      });
      return unsubscribe;
    }

    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      if (synkify.isMissingFirebaseConfig) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
        setAppPublicSettings({ id: 'missing-firebase', public_settings: {} });
        setAuthError({
          type: 'missing_firebase_config',
          message: 'Production Firebase config is missing. Add the VITE_FIREBASE_* build variables in Cloudflare.',
        });
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
        return;
      }

      if (synkify.isLocal) {
        const currentUser = await synkify.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
        setAuthChecked(true);
        setAppPublicSettings({ id: 'local', public_settings: {} });
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
        return;
      }

      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setAppPublicSettings({ id: 'synkify', public_settings: {} });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await synkify.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);

    if (synkify.isFirebase) {
      await synkify.auth.logout();
      return;
    }
    
    await synkify.auth.logout();
  };

  const navigateToLogin = async () => {
    try {
      await synkify.auth.redirectToLogin(window.location.href);
      if (synkify.isFirebase) return;
      await checkUserAuth();
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError({
        type: 'login_failed',
        message: error.message || 'Login failed',
      });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a SynkifyAuthProvider');
  }
  return context;
};
