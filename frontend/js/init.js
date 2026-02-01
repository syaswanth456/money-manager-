// ============================================
// INIT.JS - Application Initialization
// ============================================

class AppInitializer {
    constructor() {
        this.isInitialized = false;
        this.initPromise = null;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        if (this.isInitialized) {
            return this.initPromise;
        }

        this.initPromise = this._initialize();
        return this.initPromise;
    }

    async _initialize() {
        console.log('🚀 Initializing WealthFlow application...');
        
        try {
            // Step 1: Check service worker
            await this.registerServiceWorker();
            
            // Step 2: Initialize configuration
            this.loadConfiguration();
            
            // Step 3: Initialize modules
            await this.initializeModules();
            
            // Step 4: Set up event listeners
            this.setupEventListeners();
            
            // Step 5: Check for updates
            this.checkForUpdates();
            
            this.isInitialized = true;
            console.log('✅ Application initialized successfully');
            
            // Dispatch initialization complete event
            window.dispatchEvent(new CustomEvent('app:initialized'));
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.handleInitializationError(error);
            throw error;
        }
    }

    /**
     * Register service worker
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/pwa/service-worker.js', {
                    scope: '/'
                });
                
                console.log('✅ Service Worker registered:', registration);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 Service Worker update found:', newWorker);
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
                
            } catch (error) {
                console.warn('⚠️ Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Load configuration
     */
    loadConfiguration() {
        // Configuration is loaded from config.js
        if (!window.ENV) {
            console.warn('⚠️ Configuration not loaded, using defaults');
            window.ENV = {
                BACKEND_URL: window.location.hostname === 'localhost' 
                    ? 'http://localhost:10000'
                    : 'https://your-app.onrender.com',
                DEBUG: true
            };
        }
        
        // Set up global error handler
        this.setupGlobalErrorHandling();
    }

    /**
     * Initialize modules
     */
    async initializeModules() {
        const modules = [];
        
        // Wait for all modules to initialize
        if (window.WealthFlowAuth) {
            modules.push(WealthFlowAuth.init());
        }
        
        if (window.WealthFlowAPI) {
            modules.push(WealthFlowAPI.init());
        }
        
        await Promise.allSettled(modules);
        
        // Initialize state after auth and API are ready
        if (window.AppState && window.WealthFlowAuth) {
            // Listen for auth changes
            window.WealthFlowAuth.onAuthChange((authState) => {
                if (authState.isAuthenticated) {
                    // Initial data sync
                    setTimeout(() => {
                        window.AppState.syncData();
                    }, 500);
                }
            });
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Online/offline handling
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
        
        // App visibility
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Before unload
        window.addEventListener('beforeunload', this.handleBeforeUnload);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts);
    }

    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            // Show error to user
            if (window.AppState) {
                window.AppState.addError({
                    message: 'An unexpected error occurred',
                    details: event.reason?.message
                });
            }
            
            event.preventDefault();
        });
        
        // Global errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            
            // Don't show syntax errors to users
            if (event.error instanceof SyntaxError) {
                return;
            }
            
            if (window.AppState) {
                window.AppState.addError({
                    message: 'Application error',
                    details: event.error.message
                });
            }
        });
    }

    /**
     * Check for updates
     */
    checkForUpdates() {
        // Check for app updates periodically
        setInterval(() => {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CHECK_FOR_UPDATES'
                });
            }
        }, 3600000); // Every hour
    }

    /**
     * Show update notification
     */
    showUpdateNotification() {
        if (window.AppState) {
            window.AppState.addError({
                message: 'New version available',
                details: 'Refresh to update the application',
                action: {
                    label: 'Refresh',
                    handler: () => window.location.reload()
                }
            });
        }
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    handleOnline = () => {
        console.log('🌐 Application is online');
        
        // Notify state
        if (window.AppState) {
            window.AppState.addError({
                message: 'Back online',
                type: 'success',
                autoClear: true,
                duration: 3000
            });
        }
        
        // Process queued requests
        if (window.WealthFlowAPI) {
            window.WealthFlowAPI.processQueue();
        }
        
        // Sync data
        if (window.AppState && window.WealthFlowAuth && WealthFlowAuth.isAuthenticated()) {
            window.AppState.syncData();
        }
    }

    handleOffline = () => {
        console.log('📴 Application is offline');
        
        if (window.AppState) {
            window.AppState.addError({
                message: 'You are offline',
                type: 'warning',
                autoClear: false
            });
        }
    }

    handleVisibilityChange = () => {
        if (!document.hidden && window.WealthFlowAuth && WealthFlowAuth.isAuthenticated()) {
            // App became visible, refresh data
            if (window.AppState) {
                window.AppState.syncNotifications();
            }
        }
    }

    handleBeforeUnload = (event) => {
        // Save any pending data
        if (window.AppState) {
            // Persist state
            window.AppState.persistState();
        }
        
        // Don't show confirmation for regular navigation
        // Only show if there are unsaved changes
        // event.preventDefault();
        // event.returnValue = '';
    }

    handleKeyboardShortcuts = (event) => {
        // Global keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'n':
                    event.preventDefault();
                    // Quick add
                    if (window.location.pathname.includes('dashboard')) {
                        document.getElementById('fab')?.click();
                    }
                    break;
                    
                case 's':
                    event.preventDefault();
                    // Save current form
                    const activeForm = document.querySelector('form:focus-within');
                    if (activeForm) {
                        const submitBtn = activeForm.querySelector('button[type="submit"]');
                        if (submitBtn) submitBtn.click();
                    }
                    break;
                    
                case 'd':
                    event.preventDefault();
                    // Go to dashboard
                    if (!window.location.pathname.includes('dashboard')) {
                        window.location.href = '/dashboard.html';
                    }
                    break;
                    
                case 'e':
                    event.preventDefault();
                    // Go to expenses
                    if (!window.location.pathname.includes('expenses')) {
                        window.location.href = '/expenses.html';
                    }
                    break;
                    
                case 'i':
                    event.preventDefault();
                    // Go to income
                    if (!window.location.pathname.includes('income')) {
                        window.location.href = '/income.html';
                    }
                    break;
            }
        }
    }

    handleInitializationError(error) {
        // Show initialization error to user
        const errorElement = document.createElement('div');
        errorElement.className = 'alert alert-danger animate-slide-in-down';
        errorElement.style.position = 'fixed';
        errorElement.style.top = '0';
        errorElement.style.left = '0';
        errorElement.style.right = '0';
        errorElement.style.zIndex = '9999';
        errorElement.style.margin = '0';
        errorElement.style.borderRadius = '0';
        errorElement.innerHTML = `
            <div class="container" style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <strong>Initialization Error</strong>
                    <p style="margin: 0; font-size: 0.875rem;">${error.message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove(); window.location.reload();" 
                        class="btn btn-outline btn-sm">
                    Retry
                </button>
            </div>
        `;
        
        document.body.appendChild(errorElement);
    }

    /**
     * Get initialization status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            modules: {
                auth: !!window.WealthFlowAuth,
                api: !!window.WealthFlowAPI,
                state: !!window.AppState
            },
            online: navigator.onLine,
            serviceWorker: 'serviceWorker' in navigator ? 'available' : 'not available'
        };
    }
}

// ============================================
// CREATE AND EXPORT SINGLETON INSTANCE
// ============================================

const appInitializer = new AppInitializer();

// Export for use in other modules
window.AppInitializer = appInitializer;

console.log('🔧 AppInitializer ready');

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        appInitializer.initialize().catch(console.error);
    });
} else {
    appInitializer.initialize().catch(console.error);
}

[file name]: init.js
[file content modify section]
// In the setupEventListeners function, update the keyboard shortcuts:

handleKeyboardShortcuts = (event) => {
    // Global keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 'n':
                event.preventDefault();
                // Quick add - check which page we're on
                if (window.location.pathname.includes('dashboard')) {
                    document.getElementById('fab')?.click();
                } else if (window.location.pathname.includes('income')) {
                    document.getElementById('add-income-btn')?.click();
                } else if (window.location.pathname.includes('expenses')) {
                    document.getElementById('add-expense-btn')?.click();
                }
                break;
                
            case 's':
                event.preventDefault();
                // Save current form
                const activeForm = document.querySelector('form:focus-within');
                if (activeForm) {
                    const submitBtn = activeForm.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.click();
                }
                break;
                
            case 'd':
                event.preventDefault();
                // Go to dashboard
                if (!window.location.pathname.includes('dashboard')) {
                    window.location.href = '/dashboard.html';
                }
                break;
                
            case 'e':
                event.preventDefault();
                // Go to expenses
                if (!window.location.pathname.includes('expenses')) {
                    window.location.href = '/expenses.html';
                }
                break;
                
            case 'i':
                event.preventDefault();
                // Go to income
                if (!window.location.pathname.includes('income')) {
                    window.location.href = '/income.html';
                }
                break;
                
            case 'a':
                event.preventDefault();
                // Go to accounts
                if (!window.location.pathname.includes('accounts')) {
                    window.location.href = '/accounts.html';
                }
                break;
        }
    }
}

// Also update the protected pages array:
const protectedPages = ['dashboard', 'accounts', 'expenses', 'income', 'transfer', 'budgets', 'goals', 'settings'];
