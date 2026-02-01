// Configuration for WealthFlow App
window.ENV = {
    // Supabase Configuration
    SUPABASE_URL: 'https://your-project-ref.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key-here',
    
    // Backend API
    BACKEND_URL: 'https://your-app.onrender.com',
    
    // App Settings
    APP_NAME: 'WealthFlow',
    VERSION: '1.0.0',
    
    // Feature Flags
    FEATURES: {
        OFFLINE_MODE: true,
        NOTIFICATIONS: true,
        GOOGLE_AUTH: true,
        BUDGETS: true,
        GOALS: true
    },
    
    // Default Settings
    DEFAULTS: {
        CURRENCY: 'USD',
        DATE_FORMAT: 'MM/DD/YYYY',
        TIME_FORMAT: '12h',
        NOTIFICATION_TIME: '09:00',
        THEME: 'light'
    },
    
    // API Endpoints
    API: {
        AUTH: '/api/auth',
        ACCOUNTS: '/api/accounts',
        TRANSACTIONS: '/api/transactions',
        NOTIFICATIONS: '/api/notifications',
        CATEGORIES: '/api/categories',
        BUDGETS: '/api/budgets',
        GOALS: '/api/goals'
    },
    
    // Cache Settings
    CACHE: {
        TTL: 5 * 60 * 1000, // 5 minutes
        MAX_ITEMS: 100
    },
    
    // Notification Settings
    NOTIFICATIONS: {
        ENABLED: true,
        SCHEDULE_TIME: '09:00',
        TYPES: ['balance_alert', 'bill_reminder', 'budget_warning']
    }
};

// Development overrides
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.ENV.SUPABASE_URL = 'http://localhost:54321';
    window.ENV.BACKEND_URL = 'http://localhost:10000';
    window.ENV.DEBUG = true;
    
    console.log('🔧 Development mode enabled');
}

// Production checks
if (window.location.protocol === 'https:') {
    // Ensure secure connections
    if (window.ENV.SUPABASE_URL?.startsWith('http:')) {
        console.warn('⚠️ Using HTTP for Supabase in HTTPS context');
    }
}
