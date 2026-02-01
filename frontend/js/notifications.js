
// ============================================
// NOTIFICATIONS.JS - Notification Management
// ============================================

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.settings = {
            enabled: true,
            sound: true,
            desktop: true,
            push: false,
            email: false,
            scheduleTime: '09:00',
            types: {
                balance_alert: true,
                bill_reminder: true,
                budget_warning: true,
                transfer_complete: true,
                goal_progress: true,
                system: true
            }
        };
        
        this.audioContext = null;
        this.notificationSound = null;
        
        this.init();
    }

    /**
     * Initialize notification manager
     */
    init() {
        console.log('🔔 Initializing Notification Manager...');
        
        // Load settings and notifications
        this.loadSettings();
        this.loadNotifications();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Request notification permission
        this.requestPermission();
        
        // Initialize sound
        this.initSound();
        
        // Start periodic check
        this.startPeriodicCheck();
    }

    /**
     * Load notification settings
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('wealthflow_notification_settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.error('Failed to load notification settings:', error);
        }
    }

    /**
     * Save notification settings
     */
    saveSettings() {
        try {
            localStorage.setItem('wealthflow_notification_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save notification settings:', error);
        }
    }

    /**
     * Load notifications from API/State
     */
    async loadNotifications() {
        try {
            // Try to load from AppState first
            if (window.AppState) {
                const state = window.AppState.getState();
                this.notifications = state.notifications || [];
                this.updateUnreadCount();
                return;
            }
            
            // Load from API
            if (window.WealthFlowAPI) {
                const response = await window.WealthFlowAPI.notifications.getAll();
                this.notifications = response.notifications || response || [];
                this.updateUnreadCount();
            } else {
                // Load mock data
                this.loadMockNotifications();
            }
            
        } catch (error) {
            console.error('Failed to load notifications:', error);
            this.loadMockNotifications();
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Notification bell click
        document.getElementById('notification-bell')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleNotificationPanel();
        });
        
        // Mark all as read
        document.getElementById('mark-all-read')?.addEventListener('click', () => {
            this.markAllAsRead();
        });
        
        // Clear all notifications
        document.getElementById('clear-all-notifications')?.addEventListener('click', () => {
            this.clearAllNotifications();
        });
        
        // Notification settings
        document.getElementById('notification-settings')?.addEventListener('click', () => {
            this.showSettingsModal();
        });
        
        // Close notification panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notification-panel');
            const bell = document.getElementById('notification-bell');
            
            if (panel && panel.classList.contains('show') && 
                !panel.contains(e.target) && 
                !bell?.contains(e.target)) {
                panel.classList.remove('show');
            }
        });
        
        // Listen for app events that should trigger notifications
        this.setupAppEventListeners();
        
        // Listen for push notifications from service worker
        this.setupPushListeners();
    }

    /**
     * Setup app event listeners for automatic notifications
     */
    setupAppEventListeners() {
        // Listen for transaction events
        window.addEventListener('transaction:created', (e) => {
            const transaction = e.detail;
            this.createTransactionNotification(transaction);
        });
        
        // Listen for balance alerts
        window.addEventListener('account:lowBalance', (e) => {
            const account = e.detail;
            this.createLowBalanceNotification(account);
        });
        
        // Listen for budget warnings
        window.addEventListener('budget:warning', (e) => {
            const budget = e.detail;
            this.createBudgetWarningNotification(budget);
        });
        
        // Listen for bill reminders
        window.addEventListener('bill:reminder', (e) => {
            const bill = e.detail;
            this.createBillReminderNotification(bill);
        });
        
        // Listen for goal progress
        window.addEventListener('goal:progress', (e) => {
            const goal = e.detail;
            this.createGoalProgressNotification(goal);
        });
    }

    /**
     * Setup push notification listeners
     */
    setupPushListeners() {
        // Listen for push events from service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
                    this.handlePushNotification(event.data.payload);
                }
            });
        }
        
        // Listen for browser push notifications
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('✅ Push notification permission granted');
                }
            });
        }
    }

    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('⚠️ This browser does not support notifications');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        if (Notification.permission !== 'denied') {
            try {
                const permission = await Notification.requestPermission();
                return permission === 'granted';
            } catch (error) {
                console.error('Failed to request notification permission:', error);
                return false;
            }
        }
        
        return false;
    }

    /**
     * Initialize notification sound
     */
    initSound() {
        if (this.settings.sound) {
            // Create audio context for notification sounds
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // Create a simple notification sound (beep)
                const createNotificationSound = () => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.value = 800;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.5);
                };
                
                this.notificationSound = createNotificationSound;
            } catch (error) {
                console.error('Failed to initialize notification sound:', error);
            }
        }
    }

    /**
     * Start periodic notification check
     */
    startPeriodicCheck() {
        // Check for scheduled notifications every minute
        setInterval(() => {
            this.checkScheduledNotifications();
        }, 60000); // 1 minute
        
        // Initial check
        this.checkScheduledNotifications();
    }

    /**
     * Check for scheduled notifications
     */
    checkScheduledNotifications() {
        if (!this.settings.enabled) return;
        
        const now = new Date();
        const currentTime = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
        
        // Check if it's time for daily notifications
        if (currentTime === this.settings.scheduleTime) {
            this.checkDailyNotifications();
        }
        
        // Check for upcoming bills (next 3 days)
        this.checkUpcomingBills();
        
        // Check for budget warnings
        this.checkBudgetWarnings();
        
        // Check for low balances
        this.checkLowBalances();
        
        // Check for goal progress
        this.checkGoalProgress();
    }

    /**
     * Check for daily notifications
     */
    async checkDailyNotifications() {
        try {
            // Get daily summary
            if (window.WealthFlowAPI) {
                const summary = await window.WealthFlowAPI.dashboard.getSummary();
                
                // Create daily summary notification
                this.createDailySummaryNotification(summary);
            }
        } catch (error) {
            console.error('Failed to check daily notifications:', error);
        }
    }

    /**
     * Check for upcoming bills
     */
    async checkUpcomingBills() {
        try {
            if (window.WealthFlowAPI && this.settings.types.bill_reminder) {
                const upcomingBills = await window.WealthFlowAPI.dashboard.getUpcomingBills(3); // Next 3 days
                
                upcomingBills.forEach(bill => {
                    const daysUntilDue = Math.ceil((new Date(bill.due_date) - new Date()) / (1000 * 60 * 60 * 24));
                    
                    if (daysUntilDue <= 3 && daysUntilDue >= 0) {
                        this.createBillReminderNotification(bill);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to check upcoming bills:', error);
        }
    }

    /**
     * Check for budget warnings
     */
    async checkBudgetWarnings() {
        try {
            if (window.WealthFlowAPI && this.settings.types.budget_warning) {
                const budgets = await window.WealthFlowAPI.budgets.getAll();
                
                budgets.forEach(budget => {
                    // Check if budget is close to or over limit
                    if (budget.progress && budget.progress.percentage >= 80) {
                        this.createBudgetWarningNotification(budget);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to check budget warnings:', error);
        }
    }

    /**
     * Check for low balances
     */
    async checkLowBalances() {
        try {
            if (window.WealthFlowAPI && this.settings.types.balance_alert) {
                const accounts = await window.WealthFlowAPI.accounts.getAll();
                
                accounts.forEach(account => {
                    const balance = parseFloat(account.balance);
                    const lowBalanceThreshold = 100; // $100 threshold
                    
                    if (balance < lowBalanceThreshold && balance > 0) {
                        this.createLowBalanceNotification(account);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to check low balances:', error);
        }
    }

    /**
     * Check for goal progress
     */
    async checkGoalProgress() {
        try {
            if (window.WealthFlowAPI && this.settings.types.goal_progress) {
                const goals = await window.WealthFlowAPI.goals.getAll();
                
                goals.forEach(goal => {
                    const progress = goal.progress_percentage || 0;
                    
                    // Notify at milestones (25%, 50%, 75%, 100%)
                    if ([25, 50, 75, 100].includes(Math.floor(progress))) {
                        this.createGoalProgressNotification(goal);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to check goal progress:', error);
        }
    }

    /**
     * Create a new notification
     */
    createNotification(notificationData) {
        const notification = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            is_read: false,
            ...notificationData
        };
        
        // Add to notifications array
        this.notifications.unshift(notification);
        
        // Update unread count
        this.updateUnreadCount();
        
        // Save to API if available
        this.saveNotificationToAPI(notification);
        
        // Show notification based on settings
        this.showNotification(notification);
        
        // Update UI if notification panel is open
        this.updateNotificationPanel();
        
        return notification;
    }

    /**
     * Create transaction notification
     */
    createTransactionNotification(transaction) {
        const type = transaction.type;
        const amount = this.formatCurrency(transaction.amount);
        const account = this.getAccountName(transaction.account_id);
        
        let title, message, icon;
        
        switch (type) {
            case 'expense':
                title = 'Expense Recorded';
                message = `You spent ${amount} on ${transaction.description}`;
                icon = 'expense';
                break;
            case 'income':
                title = 'Income Received';
                message = `You received ${amount} from ${transaction.description}`;
                icon = 'income';
                break;
            case 'transfer':
                const toAccount = this.getAccountName(transaction.to_account_id);
                title = 'Transfer Completed';
                message = `Transferred ${amount} from ${account} to ${toAccount}`;
                icon = 'transfer';
                break;
            default:
                return;
        }
        
        return this.createNotification({
            title,
            message,
            type: 'transaction',
            icon,
            data: { transactionId: transaction.id },
            priority: 'medium'
        });
    }

    /**
     * Create low balance notification
     */
    createLowBalanceNotification(account) {
        const balance = this.formatCurrency(account.balance);
        
        return this.createNotification({
            title: 'Low Balance Alert',
            message: `${account.name} has a low balance of ${balance}`,
            type: 'balance_alert',
            icon: 'warning',
            data: { accountId: account.id },
            priority: 'high'
        });
    }

    /**
     * Create budget warning notification
     */
    createBudgetWarningNotification(budget) {
        const progress = budget.progress?.percentage || 0;
        
        return this.createNotification({
            title: 'Budget Warning',
            message: `${budget.name} is ${progress.toFixed(0)}% used`,
            type: 'budget_warning',
            icon: 'budget',
            data: { budgetId: budget.id },
            priority: 'medium'
        });
    }

    /**
     * Create bill reminder notification
     */
    createBillReminderNotification(bill) {
        const dueDate = new Date(bill.due_date).toLocaleDateString();
        const amount = this.formatCurrency(bill.amount);
        
        return this.createNotification({
            title: 'Bill Reminder',
            message: `${bill.name} of ${amount} is due on ${dueDate}`,
            type: 'bill_reminder',
            icon: 'bill',
            data: { billId: bill.id },
            priority: 'high'
        });
    }

    /**
     * Create goal progress notification
     */
    createGoalProgressNotification(goal) {
        const progress = goal.progress_percentage || 0;
        
        return this.createNotification({
            title: 'Goal Progress',
            message: `${goal.name} is ${progress.toFixed(0)}% complete`,
            type: 'goal_progress',
            icon: 'goal',
            data: { goalId: goal.id },
            priority: 'low'
        });
    }

    /**
     * Create daily summary notification
     */
    createDailySummaryNotification(summary) {
        const totalExpenses = this.formatCurrency(summary.total_expenses || 0);
        const totalIncome = this.formatCurrency(summary.total_income || 0);
        
        return this.createNotification({
            title: 'Daily Financial Summary',
            message: `Today: Income ${totalIncome}, Expenses ${totalExpenses}`,
            type: 'system',
            icon: 'summary',
            priority: 'low'
        });
    }

    /**
     * Save notification to API
     */
    async saveNotificationToAPI(notification) {
        try {
            if (window.WealthFlowAPI) {
                await window.WealthFlowAPI.notifications.create(notification);
            }
        } catch (error) {
            console.error('Failed to save notification to API:', error);
        }
    }

    /**
     * Show notification based on settings
     */
    showNotification(notification) {
        // Play sound if enabled
        if (this.settings.sound && this.notificationSound) {
            try {
                this.notificationSound();
            } catch (error) {
                console.error('Failed to play notification sound:', error);
            }
        }
        
        // Show desktop notification if enabled
        if (this.settings.desktop && Notification.permission === 'granted') {
            this.showDesktopNotification(notification);
        }
        
        // Show in-app notification
        this.showInAppNotification(notification);
        
        // Send push notification if enabled
        if (this.settings.push && 'serviceWorker' in navigator) {
            this.sendPushNotification(notification);
        }
    }

    /**
     * Show desktop notification
     */
    showDesktopNotification(notification) {
        const options = {
            body: notification.message,
            icon: this.getNotificationIcon(notification.icon),
            badge: '/pwa/icons/badge-72x72.png',
            tag: notification.id,
            requireInteraction: notification.priority === 'high',
            actions: [
                {
                    action: 'view',
                    title: 'View'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ],
            data: notification.data
        };
        
        const desktopNotification = new Notification(notification.title, options);
        
        // Handle notification click
        desktopNotification.onclick = (event) => {
            event.preventDefault();
            this.handleNotificationClick(notification);
            desktopNotification.close();
        };
        
        // Handle action buttons
        desktopNotification.onclose = () => {
            // Notification was dismissed
        };
        
        // Auto-close after 10 seconds for low priority, 30 for medium, never for high
        if (notification.priority !== 'high') {
            setTimeout(() => {
                desktopNotification.close();
            }, notification.priority === 'low' ? 10000 : 30000);
        }
    }

    /**
     * Show in-app notification toast
     */
    showInAppNotification(notification) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `notification-toast ${notification.type}`;
        toast.dataset.notificationId = notification.id;
        
        const icon = this.getNotificationIcon(notification.icon);
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${this.escapeHtml(notification.title)}</div>
                <div class="toast-message">${this.escapeHtml(notification.message)}</div>
                <div class="toast-time">Just now</div>
            </div>
            <button class="toast-close" onclick="window.notificationManager.dismissToast('${notification.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        
        // Add to toast container
        const container = document.getElementById('notification-toasts');
        if (container) {
            container.appendChild(toast);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                this.dismissToast(notification.id);
            }, 5000);
            
            // Handle click
            toast.addEventListener('click', (e) => {
                if (!e.target.closest('.toast-close')) {
                    this.handleNotificationClick(notification);
                    this.dismissToast(notification.id);
                }
            });
        }
    }

    /**
     * Dismiss toast
     */
    dismissToast(notificationId) {
        const toast = document.querySelector(`.notification-toast[data-notification-id="${notificationId}"]`);
        if (toast) {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    }

    /**
     * Send push notification via service worker
     */
    sendPushNotification(notification) {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SEND_PUSH_NOTIFICATION',
                notification: {
                    title: notification.title,
                    body: notification.message,
                    icon: this.getNotificationIcon(notification.icon),
                    data: notification.data,
                    tag: notification.id
                }
            });
        }
    }

    /**
     * Handle push notification from service worker
     */
    handlePushNotification(payload) {
        // Create notification from push data
        this.createNotification({
            title: payload.title,
            message: payload.body,
            type: 'push',
            icon: 'system',
            data: payload.data,
            priority: 'medium'
        });
    }

    /**
     * Handle notification click
     */
    handleNotificationClick(notification) {
        // Mark as read
        this.markAsRead(notification.id);
        
        // Navigate based on notification type
        switch (notification.type) {
            case 'transaction':
                if (notification.data?.transactionId) {
                    // Navigate to transaction details
                    this.navigateToTransaction(notification.data.transactionId);
                }
                break;
                
            case 'balance_alert':
                if (notification.data?.accountId) {
                    // Navigate to accounts page
                    window.location.href = '/accounts.html';
                }
                break;
                
            case 'budget_warning':
                if (notification.data?.budgetId) {
                    // Navigate to budgets page
                    window.location.href = '/budgets.html';
                }
                break;
                
            case 'bill_reminder':
                if (notification.data?.billId) {
                    // Navigate to expenses page
                    window.location.href = '/expenses.html';
                }
                break;
                
            case 'goal_progress':
                if (notification.data?.goalId) {
                    // Navigate to goals page
                    window.location.href = '/goals.html';
                }
                break;
        }
        
        // Close notification panel if open
        this.hideNotificationPanel();
    }

    /**
     * Navigate to transaction
     */
    navigateToTransaction(transactionId) {
        // Find transaction type and navigate accordingly
        if (window.AppState) {
            const state = window.AppState.getState();
            const transaction = state.transactions?.find(t => t.id === transactionId);
            
            if (transaction) {
                switch (transaction.type) {
                    case 'expense':
                        window.location.href = '/expenses.html';
                        break;
                    case 'income':
                        window.location.href = '/income.html';
                        break;
                    case 'transfer':
                        window.location.href = '/transfer.html';
                        break;
                }
            }
        }
    }

    /**
     * Toggle notification panel
     */
    toggleNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        if (!panel) return;
        
        if (panel.classList.contains('show')) {
            this.hideNotificationPanel();
        } else {
            this.showNotificationPanel();
        }
    }

    /**
     * Show notification panel
     */
    showNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        if (!panel) return;
        
        panel.classList.add('show');
        this.updateNotificationPanel();
        
        // Mark all as read when panel is opened
        this.markAllAsRead();
    }

    /**
     * Hide notification panel
     */
    hideNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        if (panel) {
            panel.classList.remove('show');
        }
    }

    /**
     * Update notification panel content
     */
    updateNotificationPanel() {
        const container = document.getElementById('notification-list');
        const emptyState = document.getElementById('no-notifications');
        const unreadBadge = document.getElementById('notification-badge');
        
        if (!container) return;
        
        if (this.notifications.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            if (unreadBadge) unreadBadge.style.display = 'none';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        // Show unread badge if there are unread notifications
        if (unreadBadge) {
            unreadBadge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            unreadBadge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
        
        // Render notifications
        let html = '';
        
        this.notifications.slice(0, 10).forEach(notification => {
            const timeAgo = this.getTimeAgo(notification.timestamp);
            const icon = this.getNotificationIcon(notification.icon);
            const readClass = notification.is_read ? 'read' : 'unread';
            
            html += `
                <div class="notification-item ${readClass}" data-notification-id="${notification.id}">
                    <div class="notification-icon">${icon}</div>
                    <div class="notification-content">
                        <div class="notification-title">${this.escapeHtml(notification.title)}</div>
                        <div class="notification-message">${this.escapeHtml(notification.message)}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    <button class="notification-dismiss" title="Dismiss">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Add event listeners
        this.attachNotificationItemListeners();
    }

    /**
     * Attach event listeners to notification items
     */
    attachNotificationItemListeners() {
        // Notification item click
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-dismiss')) {
                    const notificationId = item.dataset.notificationId;
                    const notification = this.notifications.find(n => n.id === notificationId);
                    if (notification) {
                        this.handleNotificationClick(notification);
                    }
                }
            });
        });
        
        // Dismiss button click
        document.querySelectorAll('.notification-dismiss').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const notificationId = btn.closest('.notification-item').dataset.notificationId;
                this.dismissNotification(notificationId);
            });
        });
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.is_read) {
            notification.is_read = true;
            this.updateUnreadCount();
            this.updateNotificationPanel();
            
            // Update in API
            try {
                if (window.WealthFlowAPI) {
                    await window.WealthFlowAPI.notifications.markAsRead(notificationId);
                }
            } catch (error) {
                console.error('Failed to mark notification as read in API:', error);
            }
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.is_read = true;
        });
        
        this.updateUnreadCount();
        this.updateNotificationPanel();
        
        // Update in API
        try {
            if (window.WealthFlowAPI) {
                await window.WealthFlowAPI.notifications.markAllAsRead();
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read in API:', error);
        }
    }

    /**
     * Dismiss notification
     */
    async dismissNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.updateUnreadCount();
        this.updateNotificationPanel();
        
        // Delete from API
        try {
            if (window.WealthFlowAPI) {
                await window.WealthFlowAPI.notifications.delete(notificationId);
            }
        } catch (error) {
            console.error('Failed to delete notification from API:', error);
        }
    }

    /**
     * Clear all notifications
     */
    async clearAllNotifications() {
        this.notifications = [];
        this.updateUnreadCount();
        this.updateNotificationPanel();
        
        // Clear from API
        try {
            if (window.WealthFlowAPI) {
                // Note: API might not have bulk delete, so we'd need to delete one by one
                // For now, just clear locally
            }
        } catch (error) {
            console.error('Failed to clear notifications from API:', error);
        }
    }

    /**
     * Update unread count
     */
    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.is_read).length;
        
        // Update badge in header if exists
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
        
        // Update document title if there are unread notifications
        if (this.unreadCount > 0 && !document.hidden) {
            document.title = `(${this.unreadCount}) WealthFlow`;
        } else {
            document.title = 'WealthFlow';
        }
    }

    /**
     * Show settings modal
     */
    showSettingsModal() {
        // Create or show settings modal
        const modal = document.getElementById('notification-settings-modal');
        if (modal) {
            modal.classList.add('show');
            this.populateSettingsForm();
        } else {
            this.createSettingsModal();
        }
    }

    /**
     * Create settings modal
     */
    createSettingsModal() {
        const modal = document.createElement('div');
        modal.id = 'notification-settings-modal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content modal-md">
                <div class="modal-header">
                    <h3>Notification Settings</h3>
                    <button class="btn btn-text close-modal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <div class="modal-body">
                    <form id="notification-settings-form">
                        <div class="form-group">
                            <label class="checkbox">
                                <input type="checkbox" id="notifications-enabled" name="enabled">
                                <span>Enable Notifications</span>
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox">
                                <input type="checkbox" id="notification-sound" name="sound">
                                <span>Play Sound</span>
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox">
                                <input type="checkbox" id="notification-desktop" name="desktop">
                                <span>Show Desktop Notifications</span>
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox">
                                <input type="checkbox" id="notification-push" name="push">
                                <span>Enable Push Notifications</span>
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label for="notification-time">Daily Summary Time</label>
                            <input type="time" id="notification-time" name="scheduleTime" class="input">
                        </div>
                        
                        <div class="form-divider">
                            <h4>Notification Types</h4>
                        </div>
                        
                        <div class="notification-types">
                            <div class="form-group">
                                <label class="checkbox">
                                    <input type="checkbox" id="type-balance" name="balance_alert">
                                    <span>Balance Alerts</span>
                                </label>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox">
                                    <input type="checkbox" id="type-bills" name="bill_reminder">
                                    <span>Bill Reminders</span>
                                </label>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox">
                                    <input type="checkbox" id="type-budgets" name="budget_warning">
                                    <span>Budget Warnings</span>
                                </label>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox">
                                    <input type="checkbox" id="type-transfers" name="transfer_complete">
                                    <span>Transfer Notifications</span>
                                </label>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox">
                                    <input type="checkbox" id="type-goals" name="goal_progress">
                                    <span>Goal Progress</span>
                                </label>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox">
                                    <input type="checkbox" id="type-system" name="system">
                                    <span>System Updates</span>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-text cancel-settings">Cancel</button>
                    <button class="btn btn-primary save-settings">Save Settings</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        modal.querySelector('.cancel-settings').addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        modal.querySelector('.save-settings').addEventListener('click', () => {
            this.saveNotificationSettings();
            modal.classList.remove('show');
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
        
        // Populate form
        this.populateSettingsForm();
        modal.classList.add('show');
    }

    /**
     * Populate settings form
     */
    populateSettingsForm() {
        const form = document.getElementById('notification-settings-form');
        if (!form) return;
        
        // General settings
        form.enabled.checked = this.settings.enabled;
        form.sound.checked = this.settings.sound;
        form.desktop.checked = this.settings.desktop;
        form.push.checked = this.settings.push;
        form.scheduleTime.value = this.settings.scheduleTime;
        
        // Notification types
        form.balance_alert.checked = this.settings.types.balance_alert;
        form.bill_reminder.checked = this.settings.types.bill_reminder;
        form.budget_warning.checked = this.settings.types.budget_warning;
        form.transfer_complete.checked = this.settings.types.transfer_complete;
        form.goal_progress.checked = this.settings.types.goal_progress;
        form.system.checked = this.settings.types.system;
    }

    /**
     * Save notification settings
     */
    saveNotificationSettings() {
        const form = document.getElementById('notification-settings-form');
        if (!form) return;
        
        // Update settings
        this.settings.enabled = form.enabled.checked;
        this.settings.sound = form.sound.checked;
        this.settings.desktop = form.desktop.checked;
        this.settings.push = form.push.checked;
        this.settings.scheduleTime = form.scheduleTime.value;
        
        // Update notification types
        this.settings.types.balance_alert = form.balance_alert.checked;
        this.settings.types.bill_reminder = form.bill_reminder.checked;
        this.settings.types.budget_warning = form.budget_warning.checked;
        this.settings.types.transfer_complete = form.transfer_complete.checked;
        this.settings.types.goal_progress = form.goal_progress.checked;
        this.settings.types.system = form.system.checked;
        
        // Save to localStorage
        this.saveSettings();
        
        // Reinitialize sound if needed
        if (this.settings.sound && !this.notificationSound) {
            this.initSound();
        }
        
        // Request push permission if enabled
        if (this.settings.push) {
            this.requestPermission();
        }
        
        this.showSuccess('Notification settings saved');
    }

    /**
     * Get notification icon
     */
    getNotificationIcon(iconType) {
        const icons = {
            expense: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 1v22"></path>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
            `,
            income: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
            `,
            transfer: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M7 17l9.2-9.2M17 17v-5h-5"></path>
                    <circle cx="12" cy="12" r="10"></circle>
                </svg>
            `,
            warning: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            `,
            budget: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 20V10"></path>
                    <path d="M18 20V4"></path>
                    <path d="M6 20v-4"></path>
                </svg>
            `,
            bill: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            `,
            goal: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
            `,
            summary: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
            `,
            system: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            `
        };
        
        return icons[iconType] || icons.system;
    }

    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffSec < 60) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHour < 24) return `${diffHour}h ago`;
        if (diffDay < 7) return `${diffDay}d ago`;
        
        return past.toLocaleDateString();
    }

    /**
     * Format currency
     */
    formatCurrency(amount) {
        const num = parseFloat(amount) || 0;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    /**
     * Get account name by ID
     */
    getAccountName(accountId) {
        if (window.AppState) {
            const state = window.AppState.getState();
            const account = state.accounts?.find(a => a.id === accountId);
            return account ? account.name : 'Account';
        }
        return 'Account';
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        if (window.AppState) {
            window.AppState.addError({
                message: message,
                type: 'success',
                autoClear: true,
                duration: 3000
            });
        } else {
            alert(message);
        }
    }

    /**
     * Load mock notifications for development
     */
    loadMockNotifications() {
        console.log('📊 Loading mock notifications for development');
        
        this.notifications = [
            {
                id: '1',
                title: 'Welcome to WealthFlow!',
                message: 'Start tracking your finances and get insights.',
                type: 'system',
                icon: 'system',
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
                is_read: false,
                priority: 'low'
            },
            {
                id: '2',
                title: 'Low Balance Alert',
                message: 'Checking account balance is below $100',
                type: 'balance_alert',
                icon: 'warning',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                is_read: false,
                priority: 'high'
            },
            {
                id: '3',
                title: 'Budget Warning',
                message: 'Food & Dining budget is 85% used',
                type: 'budget_warning',
                icon: 'budget',
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                is_read: true,
                priority: 'medium'
            },
            {
                id: '4',
                title: 'Bill Reminder',
                message: 'Electricity bill of $120 due tomorrow',
                type: 'bill_reminder',
                icon: 'bill',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                is_read: true,
                priority: 'high'
            },
            {
                id: '5',
                title: 'Transfer Completed',
                message: 'Successfully transferred $500 to Savings',
                type: 'transfer_complete',
                icon: 'transfer',
                timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
                is_read: true,
                priority: 'medium'
            }
        ];
        
        this.updateUnreadCount();
    }
}

// ============================================
// INITIALIZE NOTIFICATION MANAGER
// ============================================

// Create and export notification manager
window.notificationManager = new NotificationManager();

// Export for use in other modules
window.NotificationManager = NotificationManager;

console.log('🔔 Notification Manager module loaded');

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.notificationManager.init();
    });
} else {
    window.notificationManager.init();
}
