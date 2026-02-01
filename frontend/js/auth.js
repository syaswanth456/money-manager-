// ============================================
// AUTH.JS - Authentication & User Management
// ============================================

// Configuration
const CONFIG = {
    supabaseUrl: window.location.hostname === 'localhost' 
        ? 'http://localhost:54321' 
        : 'https://your-project-ref.supabase.co',
    supabaseKey: 'your-anon-key',
    backendUrl: window.location.hostname === 'localhost'
        ? 'http://localhost:10000'
        : 'https://your-app.onrender.com'
};

// Supabase Client (will be initialized after config loads)
let supabase = null;
let currentUser = null;
let authState = {
    isAuthenticated: false,
    isLoading: true,
    token: null,
    userData: null
};

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const authContainer = document.getElementById('auth-container');
const googleSignInBtn = document.getElementById('google-signin-btn');
const emailLoginForm = document.getElementById('email-login-form');
const signupLink = document.getElementById('signup-link');

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize authentication system
 */
async function initAuth() {
    console.log('🔐 Initializing authentication system...');
    
    try {
        // Load configuration from environment
        await loadConfig();
        
        // Initialize Supabase client
        initSupabase();
        
        // Check existing session
        await checkSession();
        
        // Setup event listeners
        setupEventListeners();
        
        console.log('✅ Authentication system initialized');
    } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        showError('Failed to initialize authentication. Please refresh the page.');
    } finally {
        // Hide loading screen after initialization
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 300);
            }
            
            // Show auth container if not authenticated
            if (!authState.isAuthenticated && authContainer) {
                authContainer.style.display = 'block';
                setTimeout(() => {
                    authContainer.style.opacity = '1';
                }, 50);
            }
        }, 1000);
    }
}

/**
 * Load configuration from environment/API
 */
async function loadConfig() {
    try {
        // Try to load from environment first
        if (window.ENV && window.ENV.SUPABASE_URL) {
            CONFIG.supabaseUrl = window.ENV.SUPABASE_URL;
            CONFIG.supabaseKey = window.ENV.SUPABASE_ANON_KEY;
            CONFIG.backendUrl = window.ENV.BACKEND_URL;
        }
        
        // Fallback: Try to load from config endpoint
        const response = await fetch(`${CONFIG.backendUrl}/api/config`);
        if (response.ok) {
            const config = await response.json();
            CONFIG.supabaseUrl = config.supabaseUrl || CONFIG.supabaseUrl;
            CONFIG.supabaseKey = config.supabaseKey || CONFIG.supabaseKey;
        }
        
        console.log('📋 Configuration loaded:', {
            supabaseUrl: CONFIG.supabaseUrl,
            backendUrl: CONFIG.backendUrl
        });
    } catch (error) {
        console.warn('⚠️ Using default configuration');
    }
}

/**
 * Initialize Supabase client
 */
function initSupabase() {
    // Dynamically load Supabase client if not already loaded
    if (typeof createClient === 'undefined') {
        console.error('Supabase client not loaded. Make sure to include Supabase CDN.');
        return;
    }
    
    supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
        auth: {
            storage: localStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });
    
    console.log('✅ Supabase client initialized');
}

/**
 * Check for existing session
 */
async function checkSession() {
    if (!supabase) {
        console.warn('Supabase not initialized');
        return;
    }
    
    try {
        // Check for stored token first
        const token = localStorage.getItem('wealthflow_token');
        if (token) {
            authState.token = token;
            authState.isAuthenticated = true;
            await validateToken(token);
            return;
        }
        
        // Check Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.warn('Session check error:', error.message);
            clearAuth();
            return;
        }
        
        if (session) {
            console.log('🔄 Valid session found');
            await handleSuccessfulAuth(session.access_token, session.user);
        } else {
            console.log('👤 No active session');
            clearAuth();
        }
    } catch (error) {
        console.error('Session check failed:', error);
        clearAuth();
    }
}

// ============================================
// AUTHENTICATION METHODS
// ============================================

/**
 * Google OAuth Sign In
 */
async function signInWithGoogle() {
    if (!supabase) {
        showError('Authentication service not ready. Please refresh.');
        return;
    }
    
    try {
        // Show loading state
        setButtonLoading(googleSignInBtn, true);
        
        // Start Google OAuth flow
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard.html`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
        
        if (error) {
            throw error;
        }
        
        console.log('🔄 Redirecting to Google OAuth...');
        // Supabase will handle the redirect
        
    } catch (error) {
        console.error('Google sign-in failed:', error);
        showError(`Google sign-in failed: ${error.message}`);
        setButtonLoading(googleSignInBtn, false);
    }
}

/**
 * Email/Password Sign In
 */
async function signInWithEmail(email, password, rememberMe = false) {
    if (!supabase) {
        showError('Authentication service not ready. Please refresh.');
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = emailLoginForm?.querySelector('button[type="submit"]');
        if (submitBtn) setButtonLoading(submitBtn, true);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        console.log('✅ Email sign-in successful');
        await handleSuccessfulAuth(data.session.access_token, data.user);
        
    } catch (error) {
        console.error('Email sign-in failed:', error);
        
        // Handle specific error cases
        let errorMessage = 'Sign-in failed. Please check your credentials.';
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid email or password.';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Please verify your email address first.';
        } else if (error.message.includes('Too many requests')) {
            errorMessage = 'Too many attempts. Please try again later.';
        }
        
        showError(errorMessage);
        
        // Reset button loading state
        const submitBtn = emailLoginForm?.querySelector('button[type="submit"]');
        if (submitBtn) setButtonLoading(submitBtn, false);
    }
}

/**
 * Sign Up with Email
 */
async function signUpWithEmail(email, password, name) {
    if (!supabase) {
        showError('Authentication service not ready. Please refresh.');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
                data: {
                    name: name,
                    app_metadata: {
                        provider: 'email'
                    }
                },
                emailRedirectTo: `${window.location.origin}/dashboard.html`
            }
        });
        
        if (error) {
            throw error;
        }
        
        if (data.user?.identities?.length === 0) {
            throw new Error('User already registered');
        }
        
        console.log('✅ Sign-up successful, verification email sent');
        
        // Show success message
        showSuccess('Please check your email to verify your account.');
        
        // Optional: Auto-sign in after verification
        if (data.session) {
            await handleSuccessfulAuth(data.session.access_token, data.user);
        }
        
    } catch (error) {
        console.error('Sign-up failed:', error);
        
        let errorMessage = 'Sign-up failed. Please try again.';
        if (error.message.includes('User already registered')) {
            errorMessage = 'This email is already registered. Please sign in.';
        } else if (error.message.includes('Password should be at least')) {
            errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('Invalid email')) {
            errorMessage = 'Please enter a valid email address.';
        }
        
        showError(errorMessage);
    }
}

/**
 * Sign Out
 */
async function signOut() {
    if (!supabase) return;
    
    try {
        // Clear local storage
        clearAuth();
        
        // Sign out from Supabase
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.warn('Sign out error:', error);
        }
        
        console.log('👋 User signed out');
        
        // Redirect to login page
        window.location.href = '/index.html';
        
    } catch (error) {
        console.error('Sign out failed:', error);
        // Still clear local state
        clearAuth();
        window.location.href = '/index.html';
    }
}

/**
 * Validate JWT token with backend
 */
async function validateToken(token) {
    try {
        const response = await fetch(`${CONFIG.backendUrl}/api/auth/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Token validation failed');
        }
        
        const data = await response.json();
        authState.userData = data.user;
        authState.isAuthenticated = true;
        
        console.log('✅ Token validated, user:', data.user.email);
        
        // Redirect to dashboard if not already there
        if (!window.location.pathname.includes('dashboard')) {
            window.location.href = '/dashboard.html';
        }
        
        return data.user;
        
    } catch (error) {
        console.error('Token validation failed:', error);
        clearAuth();
        return null;
    }
}

// ============================================
// AUTH HANDLERS
// ============================================

/**
 * Handle successful authentication
 */
async function handleSuccessfulAuth(token, user) {
    try {
        // Store token
        localStorage.setItem('wealthflow_token', token);
        localStorage.setItem('wealthflow_user', JSON.stringify(user));
        
        // Update auth state
        authState.token = token;
        authState.userData = user;
        authState.isAuthenticated = true;
        authState.isLoading = false;
        
        // Validate token with backend
        const validatedUser = await validateToken(token);
        if (!validatedUser) {
            throw new Error('Token validation failed');
        }
        
        // Update current user
        currentUser = validatedUser;
        
        // Emit auth change event
        emitAuthChange();
        
        // Redirect to dashboard
        window.location.href = '/dashboard.html';
        
    } catch (error) {
        console.error('Auth handling failed:', error);
        clearAuth();
        showError('Authentication failed. Please try again.');
    }
}

/**
 * Clear authentication data
 */
function clearAuth() {
    // Clear localStorage
    localStorage.removeItem('wealthflow_token');
    localStorage.removeItem('wealthflow_user');
    localStorage.removeItem('supabase.auth.token');
    
    // Reset auth state
    authState = {
        isAuthenticated: false,
        isLoading: false,
        token: null,
        userData: null
    };
    
    currentUser = null;
    
    // Emit auth change event
    emitAuthChange();
    
    console.log('🧹 Auth data cleared');
}

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Get current user
 */
function getCurrentUser() {
    return currentUser || authState.userData;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return authState.isAuthenticated;
}

/**
 * Get authentication token
 */
function getToken() {
    return authState.token || localStorage.getItem('wealthflow_token');
}

/**
 * Update user profile
 */
async function updateUserProfile(updates) {
    if (!supabase || !isAuthenticated()) {
        throw new Error('Not authenticated');
    }
    
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: updates
        });
        
        if (error) throw error;
        
        // Update local storage
        const storedUser = JSON.parse(localStorage.getItem('wealthflow_user') || '{}');
        const updatedUser = { ...storedUser, ...data.user };
        localStorage.setItem('wealthflow_user', JSON.stringify(updatedUser));
        
        // Update auth state
        authState.userData = updatedUser;
        currentUser = updatedUser;
        
        emitAuthChange();
        
        console.log('✅ Profile updated');
        return updatedUser;
        
    } catch (error) {
        console.error('Profile update failed:', error);
        throw error;
    }
}

/**
 * Request password reset
 */
async function requestPasswordReset(email) {
    if (!supabase) {
        throw new Error('Authentication service not ready');
    }
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });
        
        if (error) throw error;
        
        console.log('✅ Password reset email sent');
        return true;
        
    } catch (error) {
        console.error('Password reset request failed:', error);
        throw error;
    }
}

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Google Sign In button
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', signInWithGoogle);
    }
    
    // Email login form
    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', handleEmailLogin);
    }
    
    // Sign up link
    if (signupLink) {
        signupLink.addEventListener('click', handleSignupClick);
    }
    
    // Listen for auth state changes from Supabase
    if (supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Auth state changed:', event);
            
            switch (event) {
                case 'SIGNED_IN':
                    if (session) {
                        handleSuccessfulAuth(session.access_token, session.user);
                    }
                    break;
                    
                case 'SIGNED_OUT':
                    clearAuth();
                    break;
                    
                case 'TOKEN_REFRESHED':
                    console.log('Token refreshed');
                    if (session) {
                        localStorage.setItem('wealthflow_token', session.access_token);
                        authState.token = session.access_token;
                    }
                    break;
                    
                case 'USER_UPDATED':
                    console.log('User updated');
                    if (session) {
                        localStorage.setItem('wealthflow_user', JSON.stringify(session.user));
                        authState.userData = session.user;
                        currentUser = session.user;
                        emitAuthChange();
                    }
                    break;
            }
        });
    }
    
    // Listen for offline/online status
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
}

/**
 * Handle email login form submission
 */
function handleEmailLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const rememberMe = document.querySelector('input[name="remember"]')?.checked || false;
    
    if (!email || !password) {
        showError('Please enter both email and password.');
        return;
    }
    
    signInWithEmail(email, password, rememberMe);
}

/**
 * Handle signup link click
 */
function handleSignupClick(event) {
    event.preventDefault();
    
    // Toggle between login and signup forms
    const formHeader = document.querySelector('.form-header h2');
    const formSubtitle = document.querySelector('.form-header p');
    const submitBtn = emailLoginForm?.querySelector('button[type="submit"]');
    const authFooter = document.querySelector('.auth-footer p');
    
    if (formHeader?.textContent === 'Welcome Back') {
        // Switch to signup
        formHeader.textContent = 'Create Account';
        formSubtitle.textContent = 'Sign up to start managing your finances';
        submitBtn.textContent = 'Sign Up';
        authFooter.innerHTML = 'Already have an account? <a href="#" id="signup-link">Sign in</a>';
        
        // Add name field
        const emailField = document.getElementById('email').parentElement;
        const nameField = document.createElement('div');
        nameField.className = 'form-group';
        nameField.innerHTML = `
            <label for="name">Full Name</label>
            <input type="text" id="name" name="name" required placeholder="John Doe">
        `;
        emailField.parentNode.insertBefore(nameField, emailField);
        
        // Update form handler
        emailLoginForm.removeEventListener('submit', handleEmailLogin);
        emailLoginForm.addEventListener('submit', handleSignupSubmit);
    } else {
        // Switch back to login
        formHeader.textContent = 'Welcome Back';
        formSubtitle.textContent = 'Sign in to access your financial dashboard';
        submitBtn.textContent = 'Sign In';
        authFooter.innerHTML = 'Don\'t have an account? <a href="#" id="signup-link">Sign up</a>';
        
        // Remove name field
        const nameField = document.getElementById('name')?.parentElement;
        if (nameField) nameField.remove();
        
        // Update form handler
        emailLoginForm.removeEventListener('submit', handleSignupSubmit);
        emailLoginForm.addEventListener('submit', handleEmailLogin);
    }
}

/**
 * Handle signup form submission
 */
function handleSignupSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('name')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    
    if (!name || !email || !password) {
        showError('Please fill in all fields.');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters.');
        return;
    }
    
    signUpWithEmail(email, password, name);
}

/**
 * Handle online status
 */
function handleOnlineStatus() {
    console.log('🌐 Back online');
    showSuccess('Connection restored', 3000);
    
    // Try to re-authenticate
    if (!authState.isAuthenticated) {
        checkSession();
    }
}

/**
 * Handle offline status
 */
function handleOfflineStatus() {
    console.log('📴 Offline');
    showWarning('You are offline. Some features may be limited.', 5000);
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Show error message
 */
function showError(message, duration = 5000) {
    const alert = createAlert('danger', message);
    showAlert(alert, duration);
}

/**
 * Show success message
 */
function showSuccess(message, duration = 3000) {
    const alert = createAlert('success', message);
    showAlert(alert, duration);
}

/**
 * Show warning message
 */
function showWarning(message, duration = 4000) {
    const alert = createAlert('warning', message);
    showAlert(alert, duration);
}

/**
 * Create alert element
 */
function createAlert(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} animate-slide-in-down`;
    alert.innerHTML = `
        <div class="alert-icon">
            ${getAlertIcon(type)}
        </div>
        <div class="alert-content">
            <div class="alert-message">${message}</div>
        </div>
        <button class="btn btn-text" onclick="this.parentElement.remove()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    return alert;
}

/**
 * Get icon for alert type
 */
function getAlertIcon(type) {
    const icons = {
        danger: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
    };
    return icons[type] || icons.danger;
}

/**
 * Show alert
 */
function showAlert(alertElement, duration) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Add to DOM
    const container = document.querySelector('.auth-form') || document.body;
    container.insertBefore(alertElement, container.firstChild);
    
    // Auto remove after duration
    if (duration) {
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.style.opacity = '0';
                alertElement.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (alertElement.parentNode) {
                        alertElement.remove();
                    }
                }, 300);
            }
        }, duration);
    }
}

/**
 * Set button loading state
 */
function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.setAttribute('data-original-text', button.innerHTML);
        button.innerHTML = `
            <div class="spinner spinner-sm"></div>
            <span>Loading...</span>
        `;
    } else {
        button.disabled = false;
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
            button.innerHTML = originalText;
        }
    }
}

// ============================================
// EVENT EMITTER
// ============================================

const authListeners = new Set();

/**
 * Add auth state change listener
 */
function onAuthChange(listener) {
    authListeners.add(listener);
    return () => authListeners.delete(listener);
}

/**
 * Emit auth change event
 */
function emitAuthChange() {
    const event = new CustomEvent('authchange', {
        detail: {
            isAuthenticated: authState.isAuthenticated,
            user: authState.userData,
            token: authState.token
        }
    });
    
    window.dispatchEvent(event);
    
    // Call all listeners
    authListeners.forEach(listener => {
        try {
            listener(authState);
        } catch (error) {
            console.error('Auth listener error:', error);
        }
    });
}

// ============================================
// PUBLIC API
// ============================================

const WealthFlowAuth = {
    // Core functions
    init: initAuth,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    requestPasswordReset,
    updateUserProfile,
    
    // Getters
    getCurrentUser,
    isAuthenticated,
    getToken,
    
    // Event handling
    onAuthChange,
    
    // State
    getState: () => ({ ...authState }),
    
    // Utilities
    clearAuth
};

// Export for use in other modules
window.WealthFlowAuth = WealthFlowAuth;

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

// ============================================
// GLOBAL ERROR HANDLING
// ============================================

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// ============================================
// SERVICE WORKER AUTH SYNC
// ============================================

// Notify service worker about auth state
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'GET_AUTH_TOKEN') {
            const token = getToken();
            event.ports[0].postMessage({ token });
        }
    });
}

console.log('🔐 WealthFlow Auth module loaded');
