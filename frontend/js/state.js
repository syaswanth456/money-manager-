// ============================================
// STATE.JS - Application State Management
// ============================================

class AppState {
    constructor() {
        // Initialize state
        this.state = {
            user: null,
            accounts: [],
            transactions: [],
            categories: [],
            budgets: [],
            goals: [],
            notifications: [],
            dashboard: {
                summary: null,
                charts: {},
                insights: []
            },
            ui: {
                isLoading: false,
                errors: [],
                activeView: 'dashboard',
                filters: {},
                sort: {
                    field: 'date',
                    direction: 'desc'
                }
            }
        };

        // Listeners
        this.listeners = new Set();
        
        // Persistence
        this.persistKeys = ['ui'];
        this.loadPersistedState();
        
        // Bind methods
        this.update = this.update.bind(this);
        this.getState = this.getState.bind(this);
        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = this.unsubscribe.bind(this);
        this.notify = this.notify.bind(this);
    }

    // ============================================
    // STATE MANAGEMENT
    // ============================================

    /**
     * Update state
     */
    update(updater) {
        const prevState = { ...this.state };
        
        if (typeof updater === 'function') {
            this.state = updater(this.state);
        } else {
            this.state = { ...this.state, ...updater };
        }
        
        // Notify listeners
        this.notify(prevState, this.state);
        
        // Persist if needed
        this.persistState();
        
        return this.state;
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.unsubscribe(listener);
    }

    /**
     * Unsubscribe from state changes
     */
    unsubscribe(listener) {
        this.listeners.delete(listener);
    }

    /**
     * Notify all listeners
     */
    notify(prevState, nextState) {
        this.listeners.forEach(listener => {
            try {
                listener(prevState, nextState);
            } catch (error) {
                console.error('State listener error:', error);
            }
        });
    }

    // ============================================
    // PERSISTENCE
    // ============================================

    /**
     * Load persisted state from localStorage
     */
    loadPersistedState() {
        try {
            const saved = localStorage.getItem('wealthflow_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
                console.log('📂 Loaded persisted state');
            }
        } catch (error) {
            console.error('Failed to load persisted state:', error);
        }
    }

    /**
     * Persist state to localStorage
     */
    persistState() {
        try {
            const toPersist = {};
            this.persistKeys.forEach(key => {
                if (this.state[key] !== undefined) {
                    toPersist[key] = this.state[key];
                }
            });
            
            localStorage.setItem('wealthflow_state', JSON.stringify(toPersist));
        } catch (error) {
            console.error('Failed to persist state:', error);
        }
    }

    /**
     * Clear persisted state
     */
    clearPersistedState() {
        localStorage.removeItem('wealthflow_state');
    }

    // ============================================
    // SPECIFIC STATE UPDATERS
    // ============================================

    /**
     * Set user
     */
    setUser(user) {
        return this.update(state => ({
            ...state,
            user
        }));
    }

    /**
     * Update user profile
     */
    updateUserProfile(updates) {
        return this.update(state => ({
            ...state,
            user: state.user ? { ...state.user, ...updates } : null
        }));
    }

    /**
     * Set accounts
     */
    setAccounts(accounts) {
        return this.update(state => ({
            ...state,
            accounts
        }));
    }

    /**
     * Add or update account
     */
    updateAccount(account) {
        return this.update(state => {
            const existingIndex = state.accounts.findIndex(a => a.id === account.id);
            
            if (existingIndex >= 0) {
                // Update existing
                const updatedAccounts = [...state.accounts];
                updatedAccounts[existingIndex] = account;
                return { ...state, accounts: updatedAccounts };
            } else {
                // Add new
                return { ...state, accounts: [...state.accounts, account] };
            }
        });
    }

    /**
     * Remove account
     */
    removeAccount(accountId) {
        return this.update(state => ({
            ...state,
            accounts: state.accounts.filter(a => a.id !== accountId)
        }));
    }

    /**
     * Set transactions
     */
    setTransactions(transactions) {
        return this.update(state => ({
            ...state,
            transactions
        }));
    }

    /**
     * Add transaction
     */
    addTransaction(transaction) {
        return this.update(state => ({
            ...state,
            transactions: [transaction, ...state.transactions]
        }));
    }

    /**
     * Update transaction
     */
    updateTransaction(transaction) {
        return this.update(state => {
            const index = state.transactions.findIndex(t => t.id === transaction.id);
            if (index >= 0) {
                const updated = [...state.transactions];
                updated[index] = transaction;
                return { ...state, transactions: updated };
            }
            return state;
        });
    }

    /**
     * Remove transaction
     */
    removeTransaction(transactionId) {
        return this.update(state => ({
            ...state,
            transactions: state.transactions.filter(t => t.id !== transactionId)
        }));
    }

    /**
     * Set categories
     */
    setCategories(categories) {
        return this.update(state => ({
            ...state,
            categories
        }));
    }

    /**
     * Set budgets
     */
    setBudgets(budgets) {
        return this.update(state => ({
            ...state,
            budgets
        }));
    }

    /**
     * Set goals
     */
    setGoals(goals) {
        return this.update(state => ({
            ...state,
            goals
        }));
    }

    /**
     * Set notifications
     */
    setNotifications(notifications) {
        return this.update(state => ({
            ...state,
            notifications
        }));
    }

    /**
     * Mark notification as read
     */
    markNotificationAsRead(notificationId) {
        return this.update(state => ({
            ...state,
            notifications: state.notifications.map(n => 
                n.id === notificationId ? { ...n, is_read: true } : n
            )
        }));
    }

    /**
     * Mark all notifications as read
     */
    markAllNotificationsAsRead() {
        return this.update(state => ({
            ...state,
            notifications: state.notifications.map(n => ({ ...n, is_read: true }))
        }));
    }

    /**
     * Set dashboard data
     */
    setDashboardData(data) {
        return this.update(state => ({
            ...state,
            dashboard: { ...state.dashboard, ...data }
        }));
    }

    // ============================================
    // UI STATE
    // ============================================

    /**
     * Set loading state
     */
    setLoading(isLoading) {
        return this.update(state => ({
            ...state,
            ui: { ...state.ui, isLoading }
        }));
    }

    /**
     * Add error
     */
    addError(error) {
        const errorObj = typeof error === 'string' 
            ? { id: Date.now(), message: error }
            : { id: Date.now(), ...error };

        return this.update(state => ({
            ...state,
            ui: { 
                ...state.ui, 
                errors: [errorObj, ...state.ui.errors].slice(0, 5) // Keep last 5 errors
            }
        }));
    }

    /**
     * Clear error
     */
    clearError(errorId) {
        return this.update(state => ({
            ...state,
            ui: {
                ...state.ui,
                errors: state.ui.errors.filter(e => e.id !== errorId)
            }
        }));
    }

    /**
     * Clear all errors
     */
    clearAllErrors() {
        return this.update(state => ({
            ...state,
            ui: { ...state.ui, errors: [] }
        }));
    }

    /**
     * Set active view
     */
    setActiveView(view) {
        return this.update(state => ({
            ...state,
            ui: { ...state.ui, activeView: view }
        }));
    }

    /**
     * Set filters
     */
    setFilters(filters) {
        return this.update(state => ({
            ...state,
            ui: { ...state.ui, filters: { ...state.ui.filters, ...filters } }
        }));
    }

    /**
     * Clear filters
     */
    clearFilters() {
        return this.update(state => ({
            ...state,
            ui: { ...state.ui, filters: {} }
        }));
    }

    /**
     * Set sort
     */
    setSort(field, direction = 'desc') {
        return this.update(state => ({
            ...state,
            ui: { ...state.ui, sort: { field, direction } }
        }));
    }

    // ============================================
    // DATA HELPERS
    // ============================================

    /**
     * Get filtered transactions
     */
    getFilteredTransactions() {
        const { transactions } = this.state;
        const { filters, sort } = this.state.ui;
        
        let filtered = [...transactions];
        
        // Apply filters
        if (filters.account_id) {
            filtered = filtered.filter(t => 
                t.account_id === filters.account_id || 
                t.to_account_id === filters.account_id
            );
        }
        
        if (filters.type) {
            filtered = filtered.filter(t => t.type === filters.type);
        }
        
        if (filters.category_id) {
            filtered = filtered.filter(t => t.category_id === filters.category_id);
        }
        
        if (filters.start_date && filters.end_date) {
            filtered = filtered.filter(t => {
                const date = new Date(t.date);
                return date >= new Date(filters.start_date) && 
                       date <= new Date(filters.end_date);
            });
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aValue = a[sort.field];
            let bValue = b[sort.field];
            
            // Handle date sorting
            if (sort.field === 'date') {
                aValue = new Date(a.date);
                bValue = new Date(b.date);
            }
            
            // Handle amount sorting
            if (sort.field === 'amount') {
                aValue = parseFloat(a.amount);
                bValue = parseFloat(b.amount);
            }
            
            if (sort.direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        return filtered;
    }

    /**
     * Get account by ID
     */
    getAccountById(id) {
        return this.state.accounts.find(a => a.id === id);
    }

    /**
     * Get category by ID
     */
    getCategoryById(id) {
        return this.state.categories.find(c => c.id === id);
    }

    /**
     * Get total balance
     */
    getTotalBalance() {
        return this.state.accounts.reduce((total, account) => {
            return total + parseFloat(account.balance || 0);
        }, 0);
    }

    /**
     * Get monthly totals
     */
    getMonthlyTotals() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyTransactions = this.state.transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear;
        });
        
        return monthlyTransactions.reduce((totals, t) => {
            const amount = parseFloat(t.amount);
            if (t.type === 'income') {
                totals.income += amount;
            } else if (t.type === 'expense') {
                totals.expenses += amount;
            }
            return totals;
        }, { income: 0, expenses: 0 });
    }

    // ============================================
    // DATA SYNC
    // ============================================

    /**
     * Sync data from API
     */
    async syncData() {
        if (!window.WealthFlowAPI) {
            throw new Error('API service not available');
        }

        this.setLoading(true);

        try {
            // Fetch data in parallel
            const [
                accountsData,
                transactionsData,
                categoriesData,
                budgetsData,
                goalsData,
                notificationsData,
                dashboardData
            ] = await Promise.all([
                WealthFlowAPI.accounts.getAll(),
                WealthFlowAPI.transactions.getRecent(50),
                WealthFlowAPI.categories.getAll(),
                WealthFlowAPI.budgets.getAll(),
                WealthFlowAPI.goals.getAll(),
                WealthFlowAPI.notifications.getUnread(),
                WealthFlowAPI.dashboard.getSummary()
            ]);

            // Update state
            this.setAccounts(accountsData.accounts || accountsData);
            this.setTransactions(transactionsData.transactions || transactionsData);
            this.setCategories(categoriesData.categories || categoriesData);
            this.setBudgets(budgetsData.budgets || budgetsData);
            this.setGoals(goalsData.goals || goalsData);
            this.setNotifications(notificationsData.notifications || notificationsData);
            this.setDashboardData(dashboardData);

            console.log('🔄 Data synced successfully');

        } catch (error) {
            console.error('Data sync failed:', error);
            this.addError({
                message: 'Failed to sync data',
                details: error.message
            });
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Sync specific data
     */
    async syncAccounts() {
        if (!window.WealthFlowAPI) return;
        
        try {
            const data = await WealthFlowAPI.accounts.getAll();
            this.setAccounts(data.accounts || data);
        } catch (error) {
            console.error('Accounts sync failed:', error);
        }
    }

    async syncTransactions() {
        if (!window.WealthFlowAPI) return;
        
        try {
            const data = await WealthFlowAPI.transactions.getRecent(50);
            this.setTransactions(data.transactions || data);
        } catch (error) {
            console.error('Transactions sync failed:', error);
        }
    }

    async syncNotifications() {
        if (!window.WealthFlowAPI) return;
        
        try {
            const data = await WealthFlowAPI.notifications.getUnread();
            this.setNotifications(data.notifications || data);
        } catch (error) {
            console.error('Notifications sync failed:', error);
        }
    }
}

// ============================================
// CREATE AND EXPORT SINGLETON INSTANCE
// ============================================

const appState = new AppState();

// Export for use in other modules
window.AppState = appState;

console.log('🔧 AppState initialized');

// Auto-sync when auth changes
if (window.WealthFlowAuth) {
    window.WealthFlowAuth.onAuthChange((authState) => {
        if (authState.isAuthenticated) {
            // Load user data
            appState.setUser(authState.userData);
            
            // Initial data sync
            setTimeout(() => {
                appState.syncData();
            }, 1000);
        } else {
            // Clear state on logout
            appState.update({
                user: null,
                accounts: [],
                transactions: [],
                categories: [],
                budgets: [],
                goals: [],
                notifications: [],
                dashboard: {
                    summary: null,
                    charts: {},
                    insights: []
                }
            });
        }
    });
}

// Periodically sync data
setInterval(() => {
    if (window.WealthFlowAuth && WealthFlowAuth.isAuthenticated()) {
        appState.syncNotifications();
    }
}, 300000); // Every 5 minutes
