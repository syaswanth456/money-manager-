// ============================================
// API.JS - API Communication Service
// ============================================

// Configuration
const API_CONFIG = {
    baseURL: window.ENV?.BACKEND_URL || 'http://localhost:10000',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000,
    cacheTTL: 5 * 60 * 1000 // 5 minutes
};

// Cache storage
const apiCache = new Map();

// Request queue for offline mode
const requestQueue = [];
let isOnline = navigator.onLine;
let isProcessingQueue = false;

// ============================================
// CORE API FUNCTIONS
// ============================================

/**
 * Main API request function
 */
async function apiRequest(endpoint, options = {}) {
    const {
        method = 'GET',
        data = null,
        headers = {},
        requiresAuth = true,
        cache = false,
        retry = true,
        retryCount = 0
    } = options;

    // Check cache first
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(data || {})}`;
    if (cache && method === 'GET' && apiCache.has(cacheKey)) {
        const cached = apiCache.get(cacheKey);
        if (Date.now() - cached.timestamp < API_CONFIG.cacheTTL) {
            console.log(`📦 Cache hit: ${endpoint}`);
            return cached.data;
        }
        apiCache.delete(cacheKey);
    }

    // Prepare request
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers
    };

    // Add auth token if required
    if (requiresAuth) {
        const token = await getAuthToken();
        if (token) {
            requestHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            throw new Error('Authentication required');
        }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: data ? JSON.stringify(data) : null,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle response
        const result = await handleResponse(response, endpoint);

        // Cache successful GET responses
        if (cache && method === 'GET' && response.ok) {
            apiCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
        }

        return result;

    } catch (error) {
        clearTimeout(timeoutId);

        // Handle offline mode
        if (!isOnline && method !== 'GET') {
            console.log('📴 Offline - Queueing request');
            return queueRequest(endpoint, options);
        }

        // Retry logic
        if (retry && retryCount < API_CONFIG.retryAttempts && shouldRetry(error)) {
            console.log(`🔄 Retrying ${endpoint} (${retryCount + 1}/${API_CONFIG.retryAttempts})`);
            await delay(API_CONFIG.retryDelay);
            return apiRequest(endpoint, {
                ...options,
                retryCount: retryCount + 1
            });
        }

        throw error;
    }
}

/**
 * Handle API response
 */
async function handleResponse(response, endpoint) {
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (!response.ok) {
        // Handle specific error cases
        const error = new Error(data.message || `API request failed: ${response.statusText}`);
        error.status = response.status;
        error.data = data;
        error.endpoint = endpoint;

        // Handle authentication errors
        if (response.status === 401) {
            handleAuthError();
        }

        // Handle rate limiting
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            error.retryAfter = retryAfter ? parseInt(retryAfter) : null;
        }

        throw error;
    }

    return data;
}

/**
 * Queue request for offline processing
 */
function queueRequest(endpoint, options) {
    return new Promise((resolve, reject) => {
        const request = {
            endpoint,
            options,
            resolve,
            reject,
            timestamp: Date.now(),
            attempts: 0
        };

        requestQueue.push(request);
        saveRequestQueue();

        // Start processing queue if not already
        if (!isProcessingQueue) {
            processRequestQueue();
        }

        // Return promise that will be resolved when request succeeds
        // or reject if it fails after max attempts
    });
}

/**
 * Process queued requests
 */
async function processRequestQueue() {
    if (isProcessingQueue || requestQueue.length === 0 || !isOnline) {
        return;
    }

    isProcessingQueue = true;

    while (requestQueue.length > 0 && isOnline) {
        const request = requestQueue[0];
        
        try {
            console.log(`🔄 Processing queued request: ${request.endpoint}`);
            
            const result = await apiRequest(request.endpoint, {
                ...request.options,
                retry: false // Don't retry within retry logic
            });

            // Remove from queue and resolve promise
            requestQueue.shift();
            request.resolve(result);
            saveRequestQueue();

        } catch (error) {
            request.attempts++;

            if (request.attempts >= API_CONFIG.retryAttempts) {
                // Max attempts reached, remove from queue and reject
                requestQueue.shift();
                request.reject(error);
                saveRequestQueue();
            } else {
                // Move to end of queue for retry
                requestQueue.push(requestQueue.shift());
            }
        }

        // Small delay between requests
        await delay(500);
    }

    isProcessingQueue = false;
    saveRequestQueue();
}

/**
 * Save request queue to localStorage
 */
function saveRequestQueue() {
    try {
        const queueToSave = requestQueue.map(req => ({
            endpoint: req.endpoint,
            options: req.options,
            timestamp: req.timestamp,
            attempts: req.attempts
        }));
        localStorage.setItem('wealthflow_request_queue', JSON.stringify(queueToSave));
    } catch (error) {
        console.error('Failed to save request queue:', error);
    }
}

/**
 * Load request queue from localStorage
 */
function loadRequestQueue() {
    try {
        const saved = localStorage.getItem('wealthflow_request_queue');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Convert back to request objects
            requestQueue.push(...parsed.map(req => ({
                ...req,
                resolve: () => {},
                reject: () => {}
            })));
        }
    } catch (error) {
        console.error('Failed to load request queue:', error);
    }
}

// ============================================
// AUTH FUNCTIONS
// ============================================

/**
 * Get authentication token
 */
async function getAuthToken() {
    // Try to get from auth module
    if (window.WealthFlowAuth && WealthFlowAuth.getToken) {
        const token = WealthFlowAuth.getToken();
        if (token) return token;
    }

    // Try localStorage
    const storedToken = localStorage.getItem('wealthflow_token');
    if (storedToken) {
        // Validate token
        const isValid = await validateToken(storedToken);
        if (isValid) return storedToken;
    }

    return null;
}

/**
 * Validate token with backend
 */
async function validateToken(token) {
    try {
        const response = await fetch(`${API_CONFIG.baseURL}/api/auth/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Handle authentication errors
 */
function handleAuthError() {
    console.log('🔐 Authentication error, clearing auth data');
    
    // Clear auth data
    if (window.WealthFlowAuth && WealthFlowAuth.clearAuth) {
        WealthFlowAuth.clearAuth();
    }
    
    // Clear cache
    apiCache.clear();
    
    // Redirect to login
    if (!window.location.pathname.includes('index.html')) {
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000);
    }
}

// ============================================
// SPECIFIC API ENDPOINTS
// ============================================

// USER API
const userAPI = {
    /**
     * Get current user profile
     */
    getProfile: async () => {
        return apiRequest('/api/auth/profile', { cache: true });
    },

    /**
     * Update user profile
     */
    updateProfile: async (data) => {
        return apiRequest('/api/auth/profile', {
            method: 'PUT',
            data
        });
    },

    /**
     * Update user settings
     */
    updateSettings: async (settings) => {
        return apiRequest('/api/auth/settings', {
            method: 'PUT',
            data: settings
        });
    }
};

// ACCOUNTS API
const accountsAPI = {
    /**
     * Get all accounts
     */
    getAll: async () => {
        return apiRequest('/api/accounts', { cache: true });
    },

    /**
     * Get account by ID
     */
    getById: async (id) => {
        return apiRequest(`/api/accounts/${id}`, { cache: true });
    },

    /**
     * Create new account
     */
    create: async (accountData) => {
        return apiRequest('/api/accounts', {
            method: 'POST',
            data: accountData
        });
    },

    /**
     * Update account
     */
    update: async (id, accountData) => {
        return apiRequest(`/api/accounts/${id}`, {
            method: 'PUT',
            data: accountData
        });
    },

    /**
     * Delete account
     */
    delete: async (id) => {
        return apiRequest(`/api/accounts/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Get account transactions
     */
    getTransactions: async (id, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/api/accounts/${id}/transactions?${query}`, { cache: true });
    },

    /**
     * Get account balance history
     */
    getBalanceHistory: async (id, period = 'month') => {
        return apiRequest(`/api/accounts/${id}/balance-history?period=${period}`, { cache: true });
    }
};

// TRANSACTIONS API
const transactionsAPI = {
    /**
     * Get all transactions with filters
     */
    getAll: async (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return apiRequest(`/api/transactions?${query}`, { cache: true });
    },

    /**
     * Get recent transactions
     */
    getRecent: async (limit = 10) => {
        return apiRequest(`/api/transactions/recent?limit=${limit}`, { cache: true });
    },

    /**
     * Get transaction by ID
     */
    getById: async (id) => {
        return apiRequest(`/api/transactions/${id}`, { cache: true });
    },

    /**
     * Create new transaction
     */
    create: async (transactionData) => {
        return apiRequest('/api/transactions', {
            method: 'POST',
            data: transactionData
        });
    },

    /**
     * Update transaction
     */
    update: async (id, transactionData) => {
        return apiRequest(`/api/transactions/${id}`, {
            method: 'PUT',
            data: transactionData
        });
    },

    /**
     * Delete transaction
     */
    delete: async (id) => {
        return apiRequest(`/api/transactions/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Bulk import transactions
     */
    bulkImport: async (transactions) => {
        return apiRequest('/api/transactions/import', {
            method: 'POST',
            data: { transactions }
        });
    },

    /**
     * Get transaction statistics
     */
    getStats: async (period = 'month') => {
        return apiRequest(`/api/transactions/stats?period=${period}`, { cache: true });
    },

    /**
     * Search transactions
     */
    search: async (query, filters = {}) => {
        return apiRequest(`/api/transactions/search?q=${encodeURIComponent(query)}`, {
            data: filters,
            cache: true
        });
    }
};

// CATEGORIES API
const categoriesAPI = {
    /**
     * Get all categories
     */
    getAll: async () => {
        return apiRequest('/api/categories', { cache: true });
    },

    /**
     * Get category by ID
     */
    getById: async (id) => {
        return apiRequest(`/api/categories/${id}`, { cache: true });
    },

    /**
     * Create category
     */
    create: async (categoryData) => {
        return apiRequest('/api/categories', {
            method: 'POST',
            data: categoryData
        });
    },

    /**
     * Update category
     */
    update: async (id, categoryData) => {
        return apiRequest(`/api/categories/${id}`, {
            method: 'PUT',
            data: categoryData
        });
    },

    /**
     * Delete category
     */
    delete: async (id) => {
        return apiRequest(`/api/categories/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Get default categories
     */
    getDefaults: async () => {
        return apiRequest('/api/categories/defaults', { cache: true });
    }
};

// BUDGETS API
const budgetsAPI = {
    /**
     * Get all budgets
     */
    getAll: async () => {
        return apiRequest('/api/budgets', { cache: true });
    },

    /**
     * Get budget by ID
     */
    getById: async (id) => {
        return apiRequest(`/api/budgets/${id}`, { cache: true });
    },

    /**
     * Create budget
     */
    create: async (budgetData) => {
        return apiRequest('/api/budgets', {
            method: 'POST',
            data: budgetData
        });
    },

    /**
     * Update budget
     */
    update: async (id, budgetData) => {
        return apiRequest(`/api/budgets/${id}`, {
            method: 'PUT',
            data: budgetData
        });
    },

    /**
     * Delete budget
     */
    delete: async (id) => {
        return apiRequest(`/api/budgets/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Get budget progress
     */
    getProgress: async (period = 'current') => {
        return apiRequest(`/api/budgets/progress?period=${period}`, { cache: true });
    }
};

// GOALS API
const goalsAPI = {
    /**
     * Get all goals
     */
    getAll: async () => {
        return apiRequest('/api/goals', { cache: true });
    },

    /**
     * Get goal by ID
     */
    getById: async (id) => {
        return apiRequest(`/api/goals/${id}`, { cache: true });
    },

    /**
     * Create goal
     */
    create: async (goalData) => {
        return apiRequest('/api/goals', {
            method: 'POST',
            data: goalData
        });
    },

    /**
     * Update goal
     */
    update: async (id, goalData) => {
        return apiRequest(`/api/goals/${id}`, {
            method: 'PUT',
            data: goalData
        });
    },

    /**
     * Delete goal
     */
    delete: async (id) => {
        return apiRequest(`/api/goals/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Add contribution to goal
     */
    addContribution: async (id, amount) => {
        return apiRequest(`/api/goals/${id}/contribute`, {
            method: 'POST',
            data: { amount }
        });
    },

    /**
     * Get goal progress
     */
    getProgress: async () => {
        return apiRequest('/api/goals/progress', { cache: true });
    }
};

// NOTIFICATIONS API
const notificationsAPI = {
    /**
     * Get all notifications
     */
    getAll: async () => {
        return apiRequest('/api/notifications', { cache: true });
    },

    /**
     * Get unread notifications
     */
    getUnread: async () => {
        return apiRequest('/api/notifications/unread', { cache: true });
    },

    /**
     * Mark notification as read
     */
    markAsRead: async (id) => {
        return apiRequest(`/api/notifications/${id}/read`, {
            method: 'PUT'
        });
    },

    /**
     * Mark all as read
     */
    markAllAsRead: async () => {
        return apiRequest('/api/notifications/read-all', {
            method: 'PUT'
        });
    },

    /**
     * Delete notification
     */
    delete: async (id) => {
        return apiRequest(`/api/notifications/${id}`, {
            method: 'DELETE'
        });
    },

    /**
     * Get notification settings
     */
    getSettings: async () => {
        return apiRequest('/api/notifications/settings', { cache: true });
    },

    /**
     * Update notification settings
     */
    updateSettings: async (settings) => {
        return apiRequest('/api/notifications/settings', {
            method: 'PUT',
            data: settings
        });
    }
};

// DASHBOARD API
const dashboardAPI = {
    /**
     * Get dashboard summary
     */
    getSummary: async () => {
        return apiRequest('/api/dashboard/summary', { cache: true });
    },

    /**
     * Get monthly overview
     */
    getMonthlyOverview: async (month, year) => {
        return apiRequest(`/api/dashboard/monthly?month=${month}&year=${year}`, { cache: true });
    },

    /**
     * Get income vs expenses chart data
     */
    getIncomeExpensesData: async (period = 'month') => {
        return apiRequest(`/api/dashboard/income-expenses?period=${period}`, { cache: true });
    },

    /**
     * Get category spending data
     */
    getCategorySpending: async (period = 'month') => {
        return apiRequest(`/api/dashboard/category-spending?period=${period}`, { cache: true });
    },

    /**
     * Get upcoming bills
     */
    getUpcomingBills: async (days = 30) => {
        return apiRequest(`/api/dashboard/upcoming-bills?days=${days}`, { cache: true });
    },

    /**
     * Get financial insights
     */
    getInsights: async () => {
        return apiRequest('/api/dashboard/insights', { cache: true });
    }
};

// REPORTS API
const reportsAPI = {
    /**
     * Generate expense report
     */
    generateExpenseReport: async (startDate, endDate, format = 'json') => {
        return apiRequest(`/api/reports/expenses?start=${startDate}&end=${endDate}&format=${format}`);
    },

    /**
     * Generate income report
     */
    generateIncomeReport: async (startDate, endDate, format = 'json') => {
        return apiRequest(`/api/reports/income?start=${startDate}&end=${endDate}&format=${format}`);
    },

    /**
     * Generate net worth report
     */
    generateNetWorthReport: async (format = 'json') => {
        return apiRequest(`/api/reports/net-worth?format=${format}`);
    },

    /**
     * Generate budget report
     */
    generateBudgetReport: async (period = 'month', format = 'json') => {
        return apiRequest(`/api/reports/budget?period=${period}&format=${format}`);
    },

    /**
     * Export data
     */
    exportData: async (format = 'json') => {
        return apiRequest(`/api/reports/export?format=${format}`);
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Delay function
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error should be retried
 */
function shouldRetry(error) {
    // Retry network errors and 5xx server errors
    if (error.name === 'TypeError' || error.name === 'NetworkError') {
        return true;
    }
    
    if (error.status) {
        return error.status >= 500 || error.status === 429;
    }
    
    return false;
}

/**
 * Clear API cache
 */
function clearCache() {
    apiCache.clear();
    console.log('🗑️ API cache cleared');
}

/**
 * Clear specific cache entries
 */
function clearCacheFor(endpoint) {
    for (const [key] of apiCache) {
        if (key.includes(endpoint)) {
            apiCache.delete(key);
        }
    }
}

/**
 * Get cache statistics
 */
function getCacheStats() {
    return {
        size: apiCache.size,
        entries: Array.from(apiCache.entries()).map(([key, value]) => ({
            key,
            age: Date.now() - value.timestamp,
            data: value.data
        }))
    };
}

// ============================================
// NETWORK STATUS HANDLING
// ============================================

/**
 * Update network status
 */
function updateNetworkStatus() {
    const wasOnline = isOnline;
    isOnline = navigator.onLine;

    if (!wasOnline && isOnline) {
        console.log('🌐 Back online, processing queued requests');
        processRequestQueue();
    } else if (wasOnline && !isOnline) {
        console.log('📴 Offline, requests will be queued');
    }
}

// Listen for network status changes
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);

// ============================================
// API SERVICE INITIALIZATION
// ============================================

/**
 * Initialize API service
 */
async function initAPI() {
    console.log('🚀 Initializing API service...');
    
    // Load request queue from storage
    loadRequestQueue();
    
    // Set initial network status
    updateNetworkStatus();
    
    // Setup periodic cache cleanup
    setInterval(() => {
        const now = Date.now();
        for (const [key, value] of apiCache.entries()) {
            if (now - value.timestamp > API_CONFIG.cacheTTL) {
                apiCache.delete(key);
            }
        }
    }, 60000); // Check every minute
    
    console.log('✅ API service initialized');
}

// ============================================
// PUBLIC API
// ============================================

const WealthFlowAPI = {
    // Core functions
    request: apiRequest,
    init: initAPI,
    clearCache,
    clearCacheFor,
    getCacheStats,
    
    // API modules
    user: userAPI,
    accounts: accountsAPI,
    transactions: transactionsAPI,
    categories: categoriesAPI,
    budgets: budgetsAPI,
    goals: goalsAPI,
    notifications: notificationsAPI,
    dashboard: dashboardAPI,
    reports: reportsAPI,
    
    // Utility
    getAuthToken,
    
    // Network status
    isOnline: () => isOnline,
    getQueueSize: () => requestQueue.length,
    processQueue: processRequestQueue
};

// Export for use in other modules
window.WealthFlowAPI = WealthFlowAPI;

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAPI);
} else {
    initAPI();
}

console.log('🔌 WealthFlow API module loaded');
