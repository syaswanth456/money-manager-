
// ============================================
// NOTIFICATIONS.JS - Web Notifications System
// ============================================

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.notificationSettings = {
            enabled: true,
            sound: true,
            desktop: true,
            email: false,
            push: true,
            scheduleTime: '09:00',
            types: {
                balance_alert: true,
                bill_reminder: true,
                budget_warning: true,
                transfer_complete: true,
                goal_progress: true,
                security_alert: true
            }
        };
        
        this.init();
    }

    /**
     * Initialize notification system
     */
    async init() {
        console.log('🔔 Initializing Notification System...');
        
        // Load settings and notifications
        await this.loadSettings();
        await this.loadNotifications();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Request notification permission
        await this.requestPermission();
        
        // Setup periodic checks
        this.setupPeriodicChecks();
        
        console.log('✅ Notification System initialized');
    }

    /**
     * Load notification settings
     */
    async loadSettings() {
        try {
            const saved = localStorage.getItem('wealthflow_notification_settings');
            if (saved) {
                this.notificationSettings = { ...this.notificationSettings, ...JSON.parse(saved) };
            }
            
            // Update UI
            this.updateSettingsUI();
        } catch (error) {
            console.error('Failed to load notification settings:', error);
        }
    }

    /**
     * Save notification settings
     */
    saveSettings() {
        try {
            localStorage.setItem('wealthflow_notification_settings', JSON.stringify(this.notificationSettings));
        } catch (error) {
            console.error('Failed to save notification settings:', error);
        }
    }

    /**
     * Load notifications
     */
    async loadNotifications() {
        try {
            // Try to load from AppState
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
                return;
            }
            
            // Load mock data
            this.loadMockNotifications();
            
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Notification toggle
        document.getElementById('notification-toggle')?.addEventListener('click', () => this.toggleNotifications());
        
        // Mark all as read
        document.getElementById('mark-all-read')?.addEventListener('click', () => this.markAllAsRead());
        
        // Notification settings
        document.querySelectorAll('.notification-setting').forEach(setting => {
            setting.addEventListener('change', (e) => this.updateSetting(e));
        });
        
        // Schedule time
        document.getElementById('notification-time')?.addEventListener('change', (e) => {
            this.notificationSettings.scheduleTime = e.target.value;
            this.saveSettings();
        });
        
        // Clear all notifications
        document.getElementById('clear-notifications')?.addEventListener('click', () => this.clearAllNotifications());
        
        // Notification dropdown toggle
        document.getElementById('notification-bell')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleNotificationDropdown();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notification-dropdown');
            const bell = document.getElementById('notification-bell');
            
            if (dropdown && bell && !dropdown.contains(e.target) && !bell.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
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
     * Setup periodic checks
     */
    setupPeriodicChecks() {
        // Check for new notifications every minute
        setInterval(() => {
            this.checkForNewNotifications();
        }, 60000);
        
        // Check for scheduled notifications
        setInterval(() => {
            this.checkScheduledNotifications();
        }, 30000);
    }

    /**
     * Check for new notifications
     */
    async checkForNewNotifications() {
        if (!window.WealthFlowAPI || !window.WealthFlowAuth || !WealthFlowAuth.isAuthenticated()) {
            return;
        }
        
        try {
            const response = await window.WealthFlowAPI.notifications.getUnread();
            const newNotifications = response.notifications || response || [];
            
            // Check for new notifications
            const currentIds = new Set(this.notifications.map(n => n.id));
            const trulyNew = newNotifications.filter(n => !currentIds.has(n.id));
            
            if (trulyNew.length > 0) {
                // Add new notifications
                this.notifications = [...trulyNew, ...this.notifications];
                this.updateUnreadCount();
                
                // Show desktop notifications
                if (this.notificationSettings.desktop && this.notificationSettings.enabled) {
                    trulyNew.forEach(notification => {
                        this.showDesktopNotification(notification);
                    });
                }
                
                // Update AppState
                if (window.AppState) {
                    window.AppState.setNotifications(this.notifications);
                }
                
                // Update UI
                this.renderNotificationList();
            }
            
        } catch (error) {
            console.error('Failed to check for new notifications:', error);
        }
    }

    /**
     * Check for scheduled notifications
     */
    checkScheduledNotifications() {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        
        // Check if it's time for scheduled notifications
        if (currentTime === this.notificationSettings.scheduleTime) {
            this.checkForBillsDue();
            this.checkBudgetWarnings();
            this.checkGoalProgress();
        }
    }

    /**
     * Show desktop notification
     */
    showDesktopNotification(notification) {
        if (!this.notificationSettings.desktop || !this.notificationSettings.enabled) {
            return;
        }
        
        if (Notification.permission !== 'granted') {
            return;
        }
        
        const options = {
            body: notification.message,
            icon: '/pwa/icons/icon-192x192.png',
            badge: '/pwa/icons/badge-72x72.png',
            tag: notification.id,
            requireInteraction: notification.important || false,
            data: {
                url: notification.url || '/dashboard.html',
                notificationId: notification.id
            },
            actions: []
        };
        
        if (notification.type === 'transfer_complete') {
            options.actions.push({
                action: 'view',
                title: 'View Transfer'
            });
        } else if (notification.type === 'bill_reminder') {
            options.actions.push({
                action: 'pay',
                title: 'Pay Now'
            });
        }
        
        const notificationObj = new Notification(notification.title || 'WealthFlow', options);
        
        // Handle notification click
        notificationObj.onclick = (event) => {
            event.preventDefault();
            window.focus();
            
            if (notification.url) {
                window.location.href = notification.url;
            }
            
            // Mark as read
            if (notification.id) {
                this.markAsRead(notification.id);
            }
            
            notificationObj.close();
        };
        
        // Handle action buttons
        notificationObj.onaction = (event) => {
            switch (event.action) {
                case 'view':
                    window.location.href = '/transfer.html';
                    break;
                case 'pay':
                    window.location.href = '/expenses.html';
                    break;
            }
        };
        
        // Auto-close after 10 seconds unless it requires interaction
        if (!options.requireInteraction) {
            setTimeout(() => {
                notificationObj.close();
            }, 10000);
        }
        
        // Play sound if enabled
        if (this.notificationSettings.sound) {
            this.playNotificationSound();
        }
    }

    /**
     * Play notification sound
     */
    playNotificationSound() {
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Fallback to beep if custom sound fails
                console.log('\u0007'); // ASCII bell character
            });
        } catch (error) {
            console.log('\u0007'); // ASCII bell character as fallback
        }
    }

    /**
     * Create a notification
     */
    async createNotification(notificationData) {
        try {
            // Check if notification type is enabled
            if (!this.isNotificationTypeEnabled(notificationData.type)) {
                return;
            }
            
            // Add timestamp
            notificationData.timestamp = new Date().toISOString();
            notificationData.is_read = false;
            notificationData.id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Add to notifications array
            this.notifications.unshift(notificationData);
            
            // Update unread count
            this.updateUnreadCount();
            
            // Show desktop notification if enabled
            if (this.notificationSettings.desktop && this.notificationSettings.enabled) {
                this.showDesktopNotification(notificationData);
            }
            
            // Save to API if available
            if (window.WealthFlowAPI) {
                try {
                    await window.WealthFlowAPI.notifications.create(notificationData);
                } catch (error) {
                    console.error('Failed to save notification to API:', error);
                }
            }
            
            // Update AppState
            if (window.AppState) {
                window.AppState.setNotifications(this.notifications);
            }
            
            // Update UI
            this.updateNotificationBadge();
            this.renderNotificationList();
            
            return notificationData;
            
        } catch (error) {
            console.error('Failed to create notification:', error);
            throw error;
        }
    }

    /**
     * Check if notification type is enabled
     */
    isNotificationTypeEnabled(type) {
        if (!this.notificationSettings.enabled) return false;
        
        // Check specific type settings
        if (this.notificationSettings.types && this.notificationSettings.types[type] !== undefined) {
            return this.notificationSettings.types[type];
        }
        
        return true; // Default to enabled if type not specified
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        try {
            // Update local state
            this.notifications = this.notifications.map(notification => {
                if (notification.id === notificationId) {
                    return { ...notification, is_read: true };
                }
                return notification;
            });
            
            // Update unread count
            this.updateUnreadCount();
            
            // Update API if available
            if (window.WealthFlowAPI) {
                await window.WealthFlowAPI.notifications.markAsRead(notificationId);
            }
            
            // Update AppState
            if (window.AppState) {
                window.AppState.setNotifications(this.notifications);
            }
            
            // Update UI
            this.updateNotificationBadge();
            this.renderNotificationList();
            
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            // Update local state
            this.notifications = this.notifications.map(notification => ({
                ...notification,
                is_read: true
            }));
            
            // Update unread count
            this.updateUnreadCount();
            
            // Update API if available
            if (window.WealthFlowAPI) {
                await window.WealthFlowAPI.notifications.markAllAsRead();
            }
            
            // Update AppState
            if (window.AppState) {
                window.AppState.setNotifications(this.notifications);
            }
            
            // Update UI
            this.updateNotificationBadge();
            this.renderNotificationList();
            
            this.showSuccess('All notifications marked as read');
            
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            this.showError('Failed to mark all as read');
        }
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId) {
        try {
            // Remove from local state
            this.notifications = this.notifications.filter(n => n.id !== notificationId);
            
            // Update unread count
            this.updateUnreadCount();
            
            // Update API if available
            if (window.WealthFlowAPI) {
                await window.WealthFlowAPI.notifications.delete(notificationId);
            }
            
            // Update AppState
            if (window.AppState) {
                window.AppState.setNotifications(this.notifications);
            }
            
            // Update UI
            this.updateNotificationBadge();
            this.renderNotificationList();
            
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    }

    /**
     * Clear all notifications
     */
    async clearAllNotifications() {
        if (!confirm('Are you sure you want to clear all notifications?')) {
            return;
        }
        
        try {
            // Clear local state
            this.notifications = [];
            this.unreadCount = 0;
            
            // Update API if available
            if (window.WealthFlowAPI) {
                // Would need a clear all endpoint
            }
            
            // Update AppState
            if (window.AppState) {
                window.AppState.setNotifications([]);
            }
            
            // Update UI
            this.updateNotificationBadge();
            this.renderNotificationList();
            
            this.showSuccess('All notifications cleared');
            
        } catch (error) {
            console.error('Failed to clear all notifications:', error);
            this.showError('Failed to clear notifications');
        }
    }

    /**
     * Update unread count
     */
    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.is_read).length;
        this.updateNotificationBadge();
    }

    /**
     * Update notification badge
     */
    updateNotificationBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount.toString();
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    /**
     * Toggle notification dropdown
     */
    toggleNotificationDropdown() {
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            
            // Mark all as read when opening dropdown
            if (dropdown.classList.contains('show') && this.unreadCount > 0) {
                setTimeout(() => {
                    this.markAllAsRead();
                }, 3000); // Mark as read after 3 seconds of viewing
            }
            
            // Render notification list if not already rendered
            if (dropdown.classList.contains('show')) {
                this.renderNotificationList();
            }
        }
    }

    /**
     * Toggle notifications on/off
     */
    toggleNotifications() {
        this.notificationSettings.enabled = !this.notificationSettings.enabled;
        this.saveSettings();
        this.updateSettingsUI();
        
        const status = this.notificationSettings.enabled ? 'enabled' : 'disabled';
        this.showSuccess(`Notifications ${status}`);
    }

    /**
     * Update setting from UI
     */
    updateSetting(event) {
        const setting = event.target;
        const settingType = setting.dataset.settingType;
        const settingKey = setting.dataset.settingKey;
        
        if (settingType === 'type') {
            this.notificationSettings.types[settingKey] = setting.checked;
        } else if (settingKey) {
            this.notificationSettings[settingKey] = setting.checked;
        }
        
        this.saveSettings();
    }

    /**
     * Update settings UI
     */
    updateSettingsUI() {
        // Update main toggle
        const toggle = document.getElementById('notification-toggle');
        if (toggle) {
            toggle.checked = this.notificationSettings.enabled;
            toggle.parentElement.classList.toggle('active', this.notificationSettings.enabled);
        }
        
        // Update individual settings
        Object.keys(this.notificationSettings).forEach(key => {
            if (key !== 'types' && key !== 'scheduleTime') {
                const element = document.querySelector(`[data-setting-key="${key}"]`);
                if (element) {
                    element.checked = this.notificationSettings[key];
                }
            }
        });
        
        // Update type settings
        if (this.notificationSettings.types) {
            Object.keys(this.notificationSettings.types).forEach(key => {
                const element = document.querySelector(`[data-setting-type="type"][data-setting-key="${key}"]`);
                if (element) {
                    element.checked = this.notificationSettings.types[key];
                }
            });
        }
        
        // Update schedule time
        const timeInput = document.getElementById('notification-time');
        if (timeInput) {
            timeInput.value = this.notificationSettings.scheduleTime;
        }
    }

    /**
     * Render notification list
     */
    renderNotificationList() {
        const container = document.getElementById('notification-list');
        const emptyState = document.getElementById('notification-empty');
        
        if (!container) return;
        
        if (this.notifications.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            container.innerHTML = '';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        // Show only recent notifications (last 10)
        const recentNotifications = this.notifications.slice(0, 10);
        
        let html = '';
        
        recentNotifications.forEach(notification => {
            const timeAgo = this.getTimeAgo(notification.timestamp);
            const icon = this.getNotificationIcon(notification.type);
            const priorityClass = notification.important ? 'priority' : '';
            const readClass = notification.is_read ? 'read' : '';
            
            html += `
                <div class="notification-item ${priorityClass} ${readClass}" data-notification-id="${notification.id}">
                    <div class="notification-icon">${icon}</div>
                    <div class="notification-content">
                        <div class="notification-title">${this.escapeHtml(notification.title || 'Notification')}</div>
                        <div class="notification-message">${this.escapeHtml(notification.message)}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    <div class="notification-actions">
                        ${!notification.is_read ? `
                            <button class="btn btn-text btn-sm mark-read" title="Mark as read">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M20 6L9 17l-5-5"></path>
                                </svg>
                            </button>
                        ` : ''}
                        <button class="btn btn-text btn-sm delete-notification" title="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Add event listeners
        this.attachNotificationListeners();
    }

    /**
     * Attach notification event listeners
     */
    attachNotificationListeners() {
        // Mark as read buttons
        document.querySelectorAll('.mark-read').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const notificationId = e.currentTarget.closest('.notification-item').dataset.notificationId;
                this.markAsRead(notificationId);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-notification').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const notificationId = e.currentTarget.closest('.notification-item').dataset.notificationId;
                this.deleteNotification(notificationId);
            });
        });
        
        // Notification item clicks
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-actions')) {
                    const notificationId = item.dataset.notificationId;
                    const notification = this.notifications.find(n => n.id === notificationId);
                    
                    // Mark as read
                    if (notification && !notification.is_read) {
                        this.markAsRead(notificationId);
                    }
                    
                    // Navigate if URL exists
                    if (notification && notification.url) {
                        window.location.href = notification.url;
                    }
                }
            });
        });
    }

    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return past.toLocaleDateString();
    }

    /**
     * Get notification icon
     */
    getNotificationIcon(type) {
        const icons = {
            balance_alert: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                    <path d="M16 10h2"></path>
                    <path d="M6 10h2"></path>
                    <circle cx="12" cy="10" r="1"></circle>
                </svg>
            `,
            bill_reminder: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            `,
            budget_warning: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            `,
            transfer_complete: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17 1l4 4-4 4"></path>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <path d="M7 23l-4-4 4-4"></path>
                    <path d="M21 13v2a4 4 0 0 0 4 4H3"></path>
                </svg>
            `,
            goal_progress: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            `,
            security_alert: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
            `,
            default: `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            `
        };
        
        return icons[type] || icons.default;
    }

    // ============================================
    // NOTIFICATION TRIGGERS
    // ============================================

    /**
     * Check for bills due
     */
    async checkForBillsDue() {
        if (!this.isNotificationTypeEnabled('bill_reminder')) return;
        
        try {
            // In a real app, this would check the database for upcoming bills
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Mock logic - in real app, check actual bills
            const hasUpcomingBills = Math.random() > 0.7; // 30% chance
            
            if (hasUpcomingBills) {
                await this.createNotification({
                    type: 'bill_reminder',
                    title: 'Upcoming Bill Due',
                    message: 'You have bills due tomorrow. Check your expenses.',
                    url: '/expenses.html',
                    important: true
                });
            }
        } catch (error) {
            console.error('Failed to check for bills due:', error);
        }
    }

    /**
     * Check for budget warnings
     */
    async checkBudgetWarnings() {
        if (!this.isNotificationTypeEnabled('budget_warning')) return;
        
        try {
            // In a real app, this would check budget usage
            const isOverBudget = Math.random() > 0.8; // 20% chance
            
            if (isOverBudget) {
                await this.createNotification({
                    type: 'budget_warning',
                    title: 'Budget Warning',
                    message: 'You\'re approaching your monthly budget limit.',
                    url: '/budgets.html',
                    important: true
                });
            }
        } catch (error) {
            console.error('Failed to check budget warnings:', error);
        }
    }

    /**
     * Check goal progress
     */
    async checkGoalProgress() {
        if (!this.isNotificationTypeEnabled('goal_progress')) return;
        
        try {
            // In a real app, this would check goal progress
            const goalAchieved = Math.random() > 0.9; // 10% chance
            
            if (goalAchieved) {
                await this.createNotification({
                    type: 'goal_progress',
                    title: 'Goal Progress',
                    message: 'Great progress on your savings goal!',
                    url: '/goals.html',
                    important: false
                });
            }
        } catch (error) {
            console.error('Failed to check goal progress:', error);
        }
    }

    /**
     * Send balance alert
     */
    async sendBalanceAlert(accountId, accountName, currentBalance, threshold) {
        if (!this.isNotificationTypeEnabled('balance_alert')) return;
        
        await this.createNotification({
            type: 'balance_alert',
            title: 'Low Balance Alert',
            message: `${accountName} balance is low: ${this.formatCurrency(currentBalance)}`,
            url: '/accounts.html',
            important: true
        });
    }

    /**
     * Send transfer complete notification
     */
    async sendTransferComplete(amount, fromAccount, toAccount) {
        if (!this.isNotificationTypeEnabled('transfer_complete')) return;
        
        await this.createNotification({
            type: 'transfer_complete',
            title: 'Transfer Complete',
            message: `Transferred ${this.formatCurrency(amount)} from ${fromAccount} to ${toAccount}`,
            url: '/transfer.html',
            important: false
        });
    }

    /**
     * Send security alert
     */
    async sendSecurityAlert(message) {
        if (!this.isNotificationTypeEnabled('security_alert')) return;
        
        await this.createNotification({
            type: 'security_alert',
            title: 'Security Alert',
            message: message,
            url: '/settings.html',
            important: true
        });
    }

    // ============================================
    // MOCK DATA
    // ============================================

    /**
     * Load mock notifications
     */
    loadMockNotifications() {
        this.notifications = [
            {
                id: '1',
                type: 'transfer_complete',
                title: 'Transfer Complete',
                message: 'Successfully transferred $500.00 from Checking to Savings',
                timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
                is_read: false,
                url: '/transfer.html',
                important: false
            },
            {
                id: '2',
                type: 'bill_reminder',
                title: 'Bill Due Tomorrow',
                message: 'Electricity bill of $120.50 is due tomorrow',
                timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                is_read: false,
                url: '/expenses.html',
                important: true
            },
            {
                id: '3',
                type: 'budget_warning',
                title: 'Budget Warning',
                message: 'You\'ve used 85% of your Dining budget this month',
                timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                is_read: true,
                url: '/budgets.html',
                important: false
            },
            {
                id: '4',
                type: 'goal_progress',
                title: 'Goal Progress',
                message: 'You\'re 75% towards your vacation savings goal!',
                timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                is_read: true,
                url: '/goals.html',
                important: false
            },
            {
                id: '5',
                type: 'balance_alert',
                title: 'Low Balance',
                message: 'Checking account balance is below $100',
                timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
                is_read: true,
                url: '/accounts.html',
                important: true
            }
        ];
        
        this.updateUnreadCount();
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

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
     * Show error message
     */
    showError(message) {
        if (window.AppState) {
            window.AppState.addError({
                message: message,
                type: 'danger',
                autoClear: true,
                duration: 5000
            });
        } else {
            alert(message);
        }
    }
}

// ============================================
// GLOBAL NOTIFICATION FUNCTIONS
// ============================================

/**
 * Global function to show notification
 */
function showNotification(title, message, type = 'default', important = false) {
    if (window.notificationManager) {
        window.notificationManager.createNotification({
            title: title,
            message: message,
            type: type,
            important: important
        });
    } else {
        console.warn('Notification manager not initialized');
    }
}

/**
 * Global function to show transfer notification
 */
function notifyTransferComplete(amount, fromAccount, toAccount) {
    showNotification(
        'Transfer Complete',
        `Successfully transferred ${formatCurrency(amount)} from ${fromAccount} to ${toAccount}`,
        'transfer_complete'
    );
}

/**
 * Global function to show low balance alert
 */
function notifyLowBalance(accountName, balance, threshold) {
    showNotification(
        'Low Balance Alert',
        `${accountName} balance is ${formatCurrency(balance)} (below ${formatCurrency(threshold)})`,
        'balance_alert',
        true
    );
}

// ============================================
// INITIALIZE NOTIFICATION MANAGER
// ============================================

// Create global instance
const notificationManager = new NotificationManager();

// Export for use in other modules
window.notificationManager = notificationManager;
window.showNotification = showNotification;
window.notifyTransferComplete = notifyTransferComplete;
window.notifyLowBalance = notifyLowBalance;

// Helper function for currency formatting
function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

console.log('🔔 Notification System loaded');
