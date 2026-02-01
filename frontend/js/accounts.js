// ============================================
// ACCOUNTS.JS - Accounts Management
// ============================================

class AccountsManager {
    constructor() {
        this.accounts = [];
        this.filteredAccounts = [];
        this.currentFilter = 'all';
        this.editingAccountId = null;
        this.deletingAccountId = null;
        
        this.init();
    }

    /**
     * Initialize the accounts manager
     */
    init() {
        console.log('💰 Initializing Accounts Manager...');
        
        // Wait for app to be ready
        if (window.AppInitializer) {
            window.AppInitializer.initialize().then(() => {
                this.setupEventListeners();
                this.loadAccounts();
            });
        } else {
            this.setupEventListeners();
            this.loadAccounts();
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add account button
        document.getElementById('add-account-btn')?.addEventListener('click', () => this.showAccountForm());
        document.getElementById('add-first-account')?.addEventListener('click', () => this.showAccountForm());
        
        // Tab filters
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.filterAccounts(e.target.dataset.type));
        });
        
        // Account type change
        document.getElementById('account-type')?.addEventListener('change', (e) => this.toggleAccountTypeFields(e.target.value));
        
        // Color picker
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.getElementById('account-color').value = e.target.dataset.color;
            });
        });
        
        // Form modals
        document.getElementById('close-form-modal')?.addEventListener('click', () => this.hideAccountForm());
        document.getElementById('cancel-form')?.addEventListener('click', () => this.hideAccountForm());
        document.getElementById('save-account')?.addEventListener('click', () => this.saveAccount());
        
        // Delete modal
        document.getElementById('close-delete-modal')?.addEventListener('click', () => this.hideDeleteConfirm());
        document.getElementById('cancel-delete')?.addEventListener('click', () => this.hideDeleteConfirm());
        document.getElementById('confirm-delete')?.addEventListener('click', () => this.deleteAccount());
        
        // Details modal
        document.getElementById('close-account-modal')?.addEventListener('click', () => this.hideAccountDetails());
        
        // Form submission
        document.getElementById('account-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAccount();
        });
    }

    /**
     * Load accounts from API/State
     */
    async loadAccounts() {
        console.log('📥 Loading accounts...');
        
        // Show loading state
        this.showLoading();
        
        try {
            // Try to load from AppState first
            if (window.AppState) {
                const state = window.AppState.getState();
                this.accounts = state.accounts || [];
                
                if (this.accounts.length > 0) {
                    this.renderAccounts();
                    return;
                }
            }
            
            // Load from API if not in state
            if (window.WealthFlowAPI) {
                const response = await window.WealthFlowAPI.accounts.getAll();
                this.accounts = response.accounts || response || [];
                this.renderAccounts();
            } else {
                // Fallback to mock data for development
                this.loadMockAccounts();
            }
            
        } catch (error) {
            console.error('Failed to load accounts:', error);
            this.showError('Failed to load accounts. Please try again.');
            this.renderAccounts(); // Will show empty state
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Render accounts based on current filter
     */
    renderAccounts() {
        console.log('🎨 Rendering accounts...');
        
        // Apply filter
        this.applyFilter();
        
        const container = document.getElementById('accounts-container');
        const loadingSection = document.getElementById('accounts-loading');
        const emptyState = document.getElementById('empty-state');
        
        if (!container) return;
        
        // Hide loading
        if (loadingSection) {
            loadingSection.style.display = 'none';
        }
        
        // Show empty state if no accounts
        if (this.filteredAccounts.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            container.innerHTML = '';
            this.updateSummary();
            return;
        }
        
        // Hide empty state
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        // Render accounts
        container.innerHTML = this.filteredAccounts
            .map(account => this.createAccountCard(account))
            .join('');
        
        // Add event listeners to account cards
        this.attachAccountCardEvents();
        
        // Update summary
        this.updateSummary();
    }

    /**
     * Create account card HTML
     */
    createAccountCard(account) {
        const typeIcon = this.getAccountTypeIcon(account.type);
        const typeLabel = this.getAccountTypeLabel(account.type);
        const balance = this.formatCurrency(account.balance);
        const color = account.color || '#2563eb';
        const isActive = account.is_active !== false;
        
        // Determine balance color
        let balanceColor = 'text-gray-800';
        if (account.type === 'credit') {
            balanceColor = account.balance < 0 ? 'text-danger' : 'text-success';
        } else if (account.type === 'loan') {
            balanceColor = 'text-warning';
        }
        
        return `
            <div class="account-card ${!isActive ? 'account-inactive' : ''}" data-account-id="${account.id}">
                <div class="account-card-header">
                    <div class="account-type" style="background-color: ${color};">
                        ${typeIcon}
                    </div>
                    <div class="account-actions">
                        <button class="btn btn-text btn-sm edit-account" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn btn-text btn-sm delete-account" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="account-card-body">
                    <h3 class="account-name">${this.escapeHtml(account.name)}</h3>
                    <div class="account-type-label">${typeLabel}</div>
                    ${account.bank_name ? `<div class="account-bank">${this.escapeHtml(account.bank_name)}</div>` : ''}
                    ${account.account_number ? `<div class="account-number">****${account.account_number.slice(-4)}</div>` : ''}
                </div>
                <div class="account-card-footer">
                    <div class="account-balance ${balanceColor}">${balance}</div>
                    ${!isActive ? '<div class="account-status">Inactive</div>' : ''}
                </div>
            </div>
        `;
    }

    /**
     * Attach events to account cards
     */
    attachAccountCardEvents() {
        // Edit buttons
        document.querySelectorAll('.edit-account').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const accountId = btn.closest('.account-card').dataset.accountId;
                this.editAccount(accountId);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-account').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const accountId = btn.closest('.account-card').dataset.accountId;
                this.confirmDelete(accountId);
            });
        });
        
        // Card click for details
        document.querySelectorAll('.account-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.account-actions')) {
                    const accountId = card.dataset.accountId;
                    this.showAccountDetails(accountId);
                }
            });
        });
    }

    /**
     * Apply current filter to accounts
     */
    applyFilter() {
        if (this.currentFilter === 'all') {
            this.filteredAccounts = this.accounts;
        } else {
            this.filteredAccounts = this.accounts.filter(account => account.type === this.currentFilter);
        }
        
        // Update active tab
        this.updateActiveTab();
    }

    /**
     * Filter accounts by type
     */
    filterAccounts(type) {
        console.log(`🔍 Filtering accounts by: ${type}`);
        this.currentFilter = type;
        this.renderAccounts();
    }

    /**
     * Update active tab UI
     */
    updateActiveTab() {
        document.querySelectorAll('.tab').forEach(tab => {
            if (tab.dataset.type === this.currentFilter) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    /**
     * Update summary statistics
     */
    updateSummary() {
        const totalBalance = this.accounts.reduce((sum, account) => {
            // For credit cards, balance is negative (amount owed)
            const balance = account.type === 'credit' ? -Math.abs(account.balance || 0) : (account.balance || 0);
            return sum + parseFloat(balance);
        }, 0);
        
        const activeAccounts = this.accounts.filter(account => account.is_active !== false).length;
        const totalAccounts = this.accounts.length;
        
        // Update UI
        document.getElementById('total-balance').textContent = this.formatCurrency(totalBalance);
        document.getElementById('active-accounts').textContent = activeAccounts;
        document.getElementById('total-accounts').textContent = totalAccounts;
        
        // Update balance change (placeholder)
        document.getElementById('balance-change').textContent = '+0.0% this month';
    }

    /**
     * Show account form for adding/editing
     */
    showAccountForm(accountId = null) {
        this.editingAccountId = accountId;
        const modal = document.getElementById('account-form-modal');
        const title = document.getElementById('modal-form-title');
        
        if (accountId) {
            // Edit mode
            title.textContent = 'Edit Account';
            const account = this.accounts.find(a => a.id === accountId);
            if (account) {
                this.populateAccountForm(account);
            }
        } else {
            // Add mode
            title.textContent = 'Add New Account';
            this.resetAccountForm();
        }
        
        modal.classList.add('show');
        document.getElementById('account-name').focus();
    }

    /**
     * Hide account form
     */
    hideAccountForm() {
        document.getElementById('account-form-modal').classList.remove('show');
        this.editingAccountId = null;
    }

    /**
     * Populate form with account data
     */
    populateAccountForm(account) {
        document.getElementById('account-id').value = account.id || '';
        document.getElementById('account-name').value = account.name || '';
        document.getElementById('account-type').value = account.type || '';
        document.getElementById('initial-balance').value = account.balance || '0.00';
        document.getElementById('account-currency').value = account.currency || 'USD';
        document.getElementById('account-color').value = account.color || '#2563eb';
        document.getElementById('is-active').checked = account.is_active !== false;
        document.getElementById('account-notes').value = account.notes || '';
        
        // Type-specific fields
        if (account.type === 'bank') {
            document.getElementById('bank-name').value = account.bank_name || '';
            document.getElementById('account-number').value = account.account_number || '';
        } else if (account.type === 'credit') {
            document.getElementById('credit-limit').value = account.credit_limit || '';
            document.getElementById('due-date').value = account.due_date || '';
            document.getElementById('card-number').value = account.card_number || '';
        } else if (account.type === 'loan') {
            document.getElementById('loan-amount').value = account.loan_amount || '';
            document.getElementById('interest-rate').value = account.interest_rate || '';
            document.getElementById('emi-amount').value = account.emi_amount || '';
            document.getElementById('emi-due-date').value = account.emi_due_date || '';
        }
        
        // Show type-specific fields
        this.toggleAccountTypeFields(account.type);
    }

    /**
     * Reset account form
     */
    resetAccountForm() {
        document.getElementById('account-form').reset();
        document.getElementById('account-id').value = '';
        document.getElementById('account-type').value = '';
        document.getElementById('initial-balance').value = '0.00';
        document.getElementById('account-currency').value = 'USD';
        document.getElementById('account-color').value = '#2563eb';
        document.getElementById('is-active').checked = true;
        
        // Hide all type-specific fields
        document.querySelectorAll('.account-type-fields').forEach(field => {
            field.style.display = 'none';
        });
    }

    /**
     * Toggle account type specific fields
     */
    toggleAccountTypeFields(type) {
        // Hide all fields first
        document.querySelectorAll('.account-type-fields').forEach(field => {
            field.style.display = 'none';
        });
        
        // Show relevant fields
        if (type) {
            const fieldId = `${type}-fields`;
            const field = document.getElementById(fieldId);
            if (field) {
                field.style.display = 'block';
            }
        }
    }

    /**
     * Save account (create or update)
     */
    async saveAccount() {
        // Validate form
        if (!this.validateAccountForm()) {
            return;
        }
        
        // Get form data
        const formData = this.getAccountFormData();
        
        try {
            // Show loading
            this.showLoading();
            
            if (window.WealthFlowAPI) {
                let savedAccount;
                
                if (this.editingAccountId) {
                    // Update existing account
                    savedAccount = await window.WealthFlowAPI.accounts.update(this.editingAccountId, formData);
                    this.showSuccess('Account updated successfully');
                } else {
                    // Create new account
                    savedAccount = await window.WealthFlowAPI.accounts.create(formData);
                    this.showSuccess('Account created successfully');
                }
                
                // Update local state
                if (window.AppState) {
                    if (this.editingAccountId) {
                        window.AppState.updateAccount(savedAccount);
                    } else {
                        window.AppState.updateAccount(savedAccount);
                        this.accounts.push(savedAccount);
                    }
                } else {
                    // Update local array
                    const index = this.accounts.findIndex(a => a.id === savedAccount.id);
                    if (index >= 0) {
                        this.accounts[index] = savedAccount;
                    } else {
                        this.accounts.push(savedAccount);
                    }
                }
                
                // Hide form and refresh
                this.hideAccountForm();
                this.renderAccounts();
                
            } else {
                // Mock save for development
                this.mockSaveAccount(formData);
            }
            
        } catch (error) {
            console.error('Failed to save account:', error);
            this.showError(`Failed to save account: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Validate account form
     */
    validateAccountForm() {
        const name = document.getElementById('account-name').value.trim();
        const type = document.getElementById('account-type').value;
        
        if (!name) {
            this.showError('Account name is required');
            document.getElementById('account-name').focus();
            return false;
        }
        
        if (!type) {
            this.showError('Account type is required');
            document.getElementById('account-type').focus();
            return false;
        }
        
        return true;
    }

    /**
     * Get form data as object
     */
    getAccountFormData() {
        const form = document.getElementById('account-form');
        const formData = new FormData(form);
        const data = {};
        
        // Convert FormData to object
        for (const [key, value] of formData.entries()) {
            if (value) {
                data[key] = value;
            }
        }
        
        // Convert numeric fields
        const numericFields = ['balance', 'credit_limit', 'loan_amount', 'interest_rate', 'emi_amount'];
        numericFields.forEach(field => {
            if (data[field]) {
                data[field] = parseFloat(data[field]);
            }
        });
        
        // Convert boolean field
        data.is_active = document.getElementById('is-active').checked;
        
        return data;
    }

    /**
     * Edit an account
     */
    editAccount(accountId) {
        this.showAccountForm(accountId);
    }

    /**
     * Show account details
     */
    async showAccountDetails(accountId) {
        const account = this.accounts.find(a => a.id === accountId);
        if (!account) return;
        
        const modal = document.getElementById('account-details-modal');
        const content = document.getElementById('account-details-content');
        
        document.getElementById('modal-account-name').textContent = account.name;
        
        // Load account details
        content.innerHTML = this.createAccountDetailsHTML(account);
        
        modal.classList.add('show');
    }

    /**
     * Create account details HTML
     */
    createAccountDetailsHTML(account) {
        const typeLabel = this.getAccountTypeLabel(account.type);
        const balance = this.formatCurrency(account.balance);
        const color = account.color || '#2563eb';
        const created = new Date(account.created_at).toLocaleDateString();
        
        let detailsHTML = `
            <div class="account-details">
                <div class="account-header" style="border-left-color: ${color};">
                    <div class="account-title">
                        <h4>${this.escapeHtml(account.name)}</h4>
                        <span class="account-type-badge">${typeLabel}</span>
                    </div>
                    <div class="account-balance-large">${balance}</div>
                </div>
                
                <div class="account-info-grid">
        `;
        
        // Add type-specific details
        if (account.bank_name) {
            detailsHTML += `
                <div class="info-item">
                    <label>Bank Name</label>
                    <div>${this.escapeHtml(account.bank_name)}</div>
                </div>
            `;
        }
        
        if (account.account_number) {
            detailsHTML += `
                <div class="info-item">
                    <label>Account Number</label>
                    <div>****${account.account_number.slice(-4)}</div>
                </div>
            `;
        }
        
        if (account.credit_limit) {
            detailsHTML += `
                <div class="info-item">
                    <label>Credit Limit</label>
                    <div>${this.formatCurrency(account.credit_limit)}</div>
                </div>
            `;
        }
        
        if (account.due_date) {
            detailsHTML += `
                <div class="info-item">
                    <label>Due Date</label>
                    <div>${new Date(account.due_date).toLocaleDateString()}</div>
                </div>
            `;
        }
        
        if (account.interest_rate) {
            detailsHTML += `
                <div class="info-item">
                    <label>Interest Rate</label>
                    <div>${account.interest_rate}%</div>
                </div>
            `;
        }
        
        detailsHTML += `
                    <div class="info-item">
                        <label>Currency</label>
                        <div>${account.currency || 'USD'}</div>
                    </div>
                    <div class="info-item">
                        <label>Status</label>
                        <div>${account.is_active !== false ? 'Active' : 'Inactive'}</div>
                    </div>
                    <div class="info-item">
                        <label>Created</label>
                        <div>${created}</div>
                    </div>
                </div>
        `;
        
        if (account.notes) {
            detailsHTML += `
                <div class="account-notes">
                    <label>Notes</label>
                    <div class="notes-content">${this.escapeHtml(account.notes)}</div>
                </div>
            `;
        }
        
        detailsHTML += `
                <div class="account-actions-details">
                    <button class="btn btn-primary edit-from-details" data-account-id="${account.id}">
                        Edit Account
                    </button>
                    <button class="btn btn-outline view-transactions" data-account-id="${account.id}">
                        View Transactions
                    </button>
                </div>
            </div>
        `;
        
        return detailsHTML;
    }

    /**
     * Hide account details
     */
    hideAccountDetails() {
        document.getElementById('account-details-modal').classList.remove('show');
    }

    /**
     * Confirm account deletion
     */
    confirmDelete(accountId) {
        this.deletingAccountId = accountId;
        const account = this.accounts.find(a => a.id === accountId);
        
        if (account) {
            document.getElementById('delete-account-name').textContent = account.name;
            document.getElementById('delete-confirm-modal').classList.add('show');
        }
    }

    /**
     * Hide delete confirmation
     */
    hideDeleteConfirm() {
        document.getElementById('delete-confirm-modal').classList.remove('show');
        this.deletingAccountId = null;
    }

    /**
     * Delete account
     */
    async deleteAccount() {
        if (!this.deletingAccountId) return;
        
        try {
            // Show loading
            this.showLoading();
            
            if (window.WealthFlowAPI) {
                // Delete from API
                await window.WealthFlowAPI.accounts.delete(this.deletingAccountId);
                
                // Update local state
                if (window.AppState) {
                    window.AppState.removeAccount(this.deletingAccountId);
                }
                
                // Remove from local array
                this.accounts = this.accounts.filter(a => a.id !== this.deletingAccountId);
                
                this.showSuccess('Account deleted successfully');
                
            } else {
                // Mock delete for development
                this.accounts = this.accounts.filter(a => a.id !== this.deletingAccountId);
                this.showSuccess('Account deleted (mock)');
            }
            
            // Hide modal and refresh
            this.hideDeleteConfirm();
            this.renderAccounts();
            
        } catch (error) {
            console.error('Failed to delete account:', error);
            this.showError(`Failed to delete account: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Get account type icon
     */
    getAccountTypeIcon(type) {
        const icons = {
            bank: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h.01M10 16h.01M14 16h.01M18 16h.01"></path>
                   </svg>`,
            wallet: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4z"></path>
                   </svg>`,
            credit: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                   </svg>`,
            cash: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                    <path d="M16 10a2 2 0 1 1 0 4"></path>
                   </svg>`,
            loan: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                   </svg>`,
            investment: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                       </svg>`
        };
        
        return icons[type] || icons.bank;
    }

    /**
     * Get account type label
     */
    getAccountTypeLabel(type) {
        const labels = {
            bank: 'Bank Account',
            wallet: 'Digital Wallet',
            credit: 'Credit Card',
            cash: 'Cash',
            loan: 'Loan',
            investment: 'Investment'
        };
        
        return labels[type] || 'Account';
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
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show loading state
     */
    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.style.opacity = '1';
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
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
            alert(message); // Fallback
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
            alert(message); // Fallback
        }
    }

    // ============================================
    // MOCK DATA FOR DEVELOPMENT
    // ============================================

    loadMockAccounts() {
        console.log('📊 Loading mock accounts for development');
        
        this.accounts = [
            {
                id: '1',
                name: 'Chase Checking',
                type: 'bank',
                bank_name: 'Chase Bank',
                account_number: '1234',
                balance: 5420.75,
                currency: 'USD',
                color: '#2563eb',
                is_active: true,
                created_at: '2024-01-15'
            },
            {
                id: '2',
                name: 'PayPal Wallet',
                type: 'wallet',
                balance: 325.50,
                currency: 'USD',
                color: '#10b981',
                is_active: true,
                created_at: '2024-02-01'
            },
            {
                id: '3',
                name: 'Chase Sapphire',
                type: 'credit',
                credit_limit: 10000,
                due_date: '2024-03-15',
                balance: -1250.25,
                currency: 'USD',
                color: '#8b5cf6',
                is_active: true,
                created_at: '2023-11-20'
            },
            {
                id: '4',
                name: 'Cash in Hand',
                type: 'cash',
                balance: 250.00,
                currency: 'USD',
                color: '#f59e0b',
                is_active: true,
                created_at: '2024-01-01'
            },
            {
                id: '5',
                name: 'Car Loan',
                type: 'loan',
                loan_amount: 25000,
                interest_rate: 5.5,
                emi_amount: 475.50,
                emi_due_date: '2024-03-05',
                balance: 19500.00,
                currency: 'USD',
                color: '#ef4444',
                is_active: true,
                created_at: '2023-08-10'
            },
            {
                id: '6',
                name: 'Robinhood',
                type: 'investment',
                balance: 12500.75,
                currency: 'USD',
                color: '#ec4899',
                is_active: true,
                created_at: '2023-12-05'
            }
        ];
        
        // Simulate API delay
        setTimeout(() => {
            this.renderAccounts();
        }, 500);
    }

    mockSaveAccount(formData) {
        if (this.editingAccountId) {
            // Update existing
            const index = this.accounts.findIndex(a => a.id === this.editingAccountId);
            if (index >= 0) {
                this.accounts[index] = {
                    ...this.accounts[index],
                    ...formData,
                    id: this.editingAccountId
                };
            }
            this.showSuccess('Account updated (mock)');
        } else {
            // Create new
            const newAccount = {
                ...formData,
                id: Date.now().toString(),
                created_at: new Date().toISOString()
            };
            this.accounts.push(newAccount);
            this.showSuccess('Account created (mock)');
        }
        
        this.hideAccountForm();
        this.renderAccounts();
    }
}

// ============================================
// INITIALIZE ACCOUNTS MANAGER
// ============================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.accountsManager = new AccountsManager();
    });
} else {
    window.accountsManager = new AccountsManager();
}

console.log('💰 Accounts Manager module loaded');
