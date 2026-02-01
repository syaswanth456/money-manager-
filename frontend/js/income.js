// ============================================
// INCOME.JS - Income Management
// ============================================

class IncomeManager {
    constructor() {
        this.income = [];
        this.categories = [];
        this.accounts = [];
        this.filteredIncome = [];
        this.cashback = [];
        
        // Filter state
        this.filters = {
            dateFrom: null,
            dateTo: null,
            incomeType: null,
            searchQuery: '',
            period: 'all'
        };
        
        // Sort state
        this.sortField = 'date';
        this.sortDirection = 'desc';
        
        // Pagination
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalPages = 1;
        
        // Charts
        this.incomeChart = null;
        
        // State for editing/deleting
        this.editingIncomeId = null;
        this.deletingIncomeId = null;
        
        this.init();
    }

    /**
     * Initialize the income manager
     */
    init() {
        console.log('💰 Initializing Income Manager...');
        
        // Wait for app to be ready
        if (window.AppInitializer) {
            window.AppInitializer.initialize().then(() => {
                this.setupEventListeners();
                this.loadInitialData();
            });
        } else {
            this.setupEventListeners();
            this.loadInitialData();
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add income button
        document.getElementById('add-income-btn')?.addEventListener('click', () => this.showIncomeForm());
        
        // Add cashback button
        document.getElementById('add-cashback')?.addEventListener('click', () => this.showCashbackForm());
        
        // Quick filters
        document.querySelectorAll('.quick-filters button').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickFilter(e.target.dataset.filter));
        });
        
        // Date filters
        const dateFrom = document.getElementById('date-from');
        const dateTo = document.getElementById('date-to');
        
        if (dateFrom) {
            dateFrom.addEventListener('change', (e) => {
                this.filters.dateFrom = e.target.value;
                this.applyFilters();
            });
        }
        
        if (dateTo) {
            dateTo.addEventListener('change', (e) => {
                this.filters.dateTo = e.target.value;
                this.applyFilters();
            });
        }
        
        // Income type filter
        document.getElementById('income-type-select')?.addEventListener('change', (e) => {
            this.filters.incomeType = e.target.value || null;
            this.applyFilters();
        });
        
        // Search
        document.getElementById('income-search')?.addEventListener('input', (e) => {
            this.filters.searchQuery = e.target.value;
            this.applyFilters();
        });
        
        // Table sorting
        document.querySelectorAll('.table-sort').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const field = e.target.dataset.sort;
                this.handleSort(field);
            });
        });
        
        // Export button
        document.getElementById('export-income')?.addEventListener('click', () => this.exportIncome());
        
        // Refresh button
        document.getElementById('refresh-income')?.addEventListener('click', () => this.refreshData());
        
        // Breakdown period
        document.getElementById('breakdown-period')?.addEventListener('change', (e) => {
            this.updateIncomeBreakdown(e.target.value);
        });
        
        // Income form modals
        document.getElementById('close-income-modal')?.addEventListener('click', () => this.hideIncomeForm());
        document.getElementById('cancel-income')?.addEventListener('click', () => this.hideIncomeForm());
        document.getElementById('save-income')?.addEventListener('click', () => this.saveIncome());
        
        // Cashback form modals
        document.getElementById('close-cashback-modal')?.addEventListener('click', () => this.hideCashbackForm());
        document.getElementById('cancel-cashback')?.addEventListener('click', () => this.hideCashbackForm());
        document.getElementById('save-cashback')?.addEventListener('click', () => this.saveCashback());
        
        // Delete modal
        document.getElementById('close-delete-income')?.addEventListener('click', () => this.hideDeleteConfirm());
        document.getElementById('cancel-delete-income')?.addEventListener('click', () => this.hideDeleteConfirm());
        document.getElementById('confirm-delete-income')?.addEventListener('click', () => this.deleteIncome());
        
        // Form submissions
        document.getElementById('income-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveIncome();
        });
        
        document.getElementById('cashback-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCashback();
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        console.log('📥 Loading income data...');
        
        this.showLoading();
        
        try {
            // Load data from state or API
            await this.loadIncome();
            await this.loadCategories();
            await this.loadAccounts();
            
            // Separate cashback from other income
            this.separateCashback();
            
            // Update UI
            this.updateSummary();
            this.applyFilters();
            this.updateIncomeBreakdown('month');
            this.updateCashbackStats();
            
        } catch (error) {
            console.error('Failed to load income data:', error);
            this.showError('Failed to load income. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Load income transactions
     */
    async loadIncome() {
        try {
            // Try to load from AppState first
            if (window.AppState) {
                const state = window.AppState.getState();
                this.income = state.transactions?.filter(t => t.type === 'income') || [];
                
                if (this.income.length > 0) {
                    return;
                }
            }
            
            // Load from API
            if (window.WealthFlowAPI) {
                const response = await window.WealthFlowAPI.transactions.getAll({
                    type: 'income',
                    limit: 1000
                });
                
                this.income = response.transactions || response || [];
            } else {
                // Load mock data
                this.loadMockIncome();
            }
            
        } catch (error) {
            console.error('Failed to load income:', error);
            throw error;
        }
    }

    /**
     * Load categories
     */
    async loadCategories() {
        try {
            // Try to load from AppState
            if (window.AppState) {
                const state = window.AppState.getState();
                this.categories = state.categories?.filter(c => c.type === 'income') || [];
                
                if (this.categories.length > 0) {
                    this.populateCategoryFilters();
                    return;
                }
            }
            
            // Load from API
            if (window.WealthFlowAPI) {
                const response = await window.WealthFlowAPI.categories.getAll();
                const allCategories = response.categories || response || [];
                this.categories = allCategories.filter(c => c.type === 'income');
                this.populateCategoryFilters();
            }
            
        } catch (error) {
            console.error('Failed to load categories:', error);
            // Use default categories
            this.categories = this.getDefaultCategories();
            this.populateCategoryFilters();
        }
    }

    /**
     * Load accounts
     */
    async loadAccounts() {
        try {
            // Try to load from AppState
            if (window.AppState) {
                const state = window.AppState.getState();
                this.accounts = state.accounts || [];
                
                if (this.accounts.length > 0) {
                    this.populateAccountFilters();
                    return;
                }
            }
            
            // Load from API
            if (window.WealthFlowAPI) {
                const response = await window.WealthFlowAPI.accounts.getAll();
                this.accounts = response.accounts || response || [];
                this.populateAccountFilters();
            }
            
        } catch (error) {
            console.error('Failed to load accounts:', error);
        }
    }

    /**
     * Separate cashback from other income
     */
    separateCashback() {
        this.cashback = this.income.filter(item => 
            item.source_type === 'cashback' || 
            item.category_id === this.getCashbackCategoryId()
        );
    }

    /**
     * Get cashback category ID
     */
    getCashbackCategoryId() {
        const cashbackCategory = this.categories.find(c => 
            c.name.toLowerCase().includes('cashback') || 
            c.name.toLowerCase().includes('reward')
        );
        return cashbackCategory?.id || null;
    }

    /**
     * Populate category filters
     */
    populateCategoryFilters() {
        const incomeCategory = document.getElementById('income-category');
        
        if (!incomeCategory) return;
        
        // Clear existing options (keep first option)
        while (incomeCategory.options.length > 1) {
            incomeCategory.remove(1);
        }
        
        // Add categories
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            incomeCategory.appendChild(option);
        });
    }

    /**
     * Populate account filters
     */
    populateAccountFilters() {
        const incomeAccount = document.getElementById('income-account');
        const cashbackAccount = document.getElementById('cashback-account');
        
        if (!incomeAccount || !cashbackAccount) return;
        
        // Clear existing options (keep first option)
        while (incomeAccount.options.length > 1) {
            incomeAccount.remove(1);
        }
        
        while (cashbackAccount.options.length > 1) {
            cashbackAccount.remove(1);
        }
        
        // Add active accounts
        this.accounts
            .filter(account => account.is_active !== false)
            .forEach(account => {
                // For income form
                const option1 = document.createElement('option');
                option1.value = account.id;
                option1.textContent = `${account.name} (${this.formatCurrency(account.balance)})`;
                incomeAccount.appendChild(option1);
                
                // For cashback form
                const option2 = document.createElement('option');
                option2.value = account.id;
                option2.textContent = `${account.name} (${this.formatCurrency(account.balance)})`;
                cashbackAccount.appendChild(option2);
            });
    }

    /**
     * Apply filters to income
     */
    applyFilters() {
        let filtered = [...this.income];
        
        // Apply period filter
        filtered = this.applyPeriodFilter(filtered);
        
        // Apply date range filter
        if (this.filters.dateFrom) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.date);
                const fromDate = new Date(this.filters.dateFrom);
                return itemDate >= fromDate;
            });
        }
        
        if (this.filters.dateTo) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.date);
                const toDate = new Date(this.filters.dateTo);
                return itemDate <= toDate;
            });
        }
        
        // Apply income type filter
        if (this.filters.incomeType) {
            filtered = filtered.filter(item => 
                item.source_type === this.filters.incomeType
            );
        }
        
        // Apply search filter
        if (this.filters.searchQuery) {
            const query = this.filters.searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.description.toLowerCase().includes(query) ||
                (item.payer && item.payer.toLowerCase().includes(query)) ||
                (item.notes && item.notes.toLowerCase().includes(query))
            );
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aValue = a[this.sortField];
            let bValue = b[this.sortField];
            
            if (this.sortField === 'date') {
                aValue = new Date(a.date);
                bValue = new Date(b.date);
            }
            
            if (this.sortField === 'amount') {
                aValue = parseFloat(a.amount);
                bValue = parseFloat(b.amount);
            }
            
            if (this.sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
        
        this.filteredIncome = filtered;
        this.updatePagination();
        this.renderIncomeTable();
        this.updateTableSummary();
    }

    /**
     * Apply period filter
     */
    applyPeriodFilter(income) {
        const now = new Date();
        
        switch (this.filters.period) {
            case 'salary':
                return income.filter(item => item.source_type === 'salary');
                
            case 'cashback':
                return income.filter(item => 
                    item.source_type === 'cashback' || 
                    item.category_id === this.getCashbackCategoryId()
                );
                
            case 'recurring':
                return income.filter(item => item.is_recurring === true);
                
            default:
                return income;
        }
    }

    /**
     * Handle quick filter
     */
    handleQuickFilter(filter) {
        // Update active button
        document.querySelectorAll('.quick-filters button').forEach(btn => {
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Clear other filters
        document.getElementById('income-type-select').value = '';
        
        // Update filter
        this.filters.period = filter;
        this.filters.incomeType = null;
        
        this.applyFilters();
    }

    /**
     * Handle table sort
     */
    handleSort(field) {
        if (this.sortField === field) {
            // Toggle direction
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // New field, default to desc
            this.sortField = field;
            this.sortDirection = 'desc';
        }
        
        // Update sort indicators
        document.querySelectorAll('.table-sort').forEach(btn => {
            const icon = btn.querySelector('svg');
            if (btn.dataset.sort === field) {
                icon.style.transform = this.sortDirection === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)';
            } else {
                icon.style.transform = 'rotate(0deg)';
            }
        });
        
        this.applyFilters();
    }

    /**
     * Update pagination
     */
    updatePagination() {
        this.totalPages = Math.ceil(this.filteredIncome.length / this.pageSize);
        this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
        
        this.renderPagination();
    }

    /**
     * Render pagination controls
     */
    renderPagination() {
        const pagination = document.getElementById('income-pagination');
        if (!pagination) return;
        
        if (this.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '<div class="flex items-center space-x-1">';
        
        // Previous button
        html += `
            <button class="btn btn-text btn-sm ${this.currentPage === 1 ? 'disabled' : ''}" 
                    ${this.currentPage === 1 ? 'disabled' : ''}
                    onclick="window.incomeManager.goToPage(${this.currentPage - 1})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
        `;
        
        // Page numbers
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
        
        // Adjust if we're near the end
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="btn btn-sm ${i === this.currentPage ? 'btn-primary' : 'btn-text'}" 
                        onclick="window.incomeManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        html += `
            <button class="btn btn-text btn-sm ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
                    ${this.currentPage === this.totalPages ? 'disabled' : ''}
                    onclick="window.incomeManager.goToPage(${this.currentPage + 1})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        `;
        
        html += '</div>';
        pagination.innerHTML = html;
    }

    /**
     * Go to specific page
     */
    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.renderIncomeTable();
            this.renderPagination();
        }
    }

    /**
     * Render income table
     */
    renderIncomeTable() {
        const tbody = document.getElementById('income-tbody');
        if (!tbody) return;
        
        if (this.filteredIncome.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="text-center py-8">
                            <div class="empty-state-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <line x1="12" y1="19" x2="12" y2="5"></line>
                                    <polyline points="5 12 12 5 19 12"></polyline>
                                </svg>
                            </div>
                            <p class="text-gray-500 mt-2">No income found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Calculate pagination slice
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageIncome = this.filteredIncome.slice(startIndex, endIndex);
        
        // Calculate total for this page
        let pageTotal = 0;
        
        // Build table rows
        let html = '';
        
        pageIncome.forEach(income => {
            const amount = parseFloat(income.amount);
            pageTotal += amount;
            
            const date = new Date(income.date).toLocaleDateString();
            const category = this.getCategoryName(income.category_id);
            const account = this.getAccountName(income.account_id);
            const sourceType = this.getSourceTypeLabel(income.source_type);
            const status = this.getIncomeStatus(income);
            const isCashback = income.source_type === 'cashback' || 
                              income.category_id === this.getCashbackCategoryId();
            
            html += `
                <tr data-income-id="${income.id}">
                    <td>
                        <div class="flex items-center">
                            <div class="date-badge">${date}</div>
                            ${income.is_recurring ? `
                                <span class="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded" title="Recurring">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M17 1l4 4-4 4"></path>
                                        <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                                        <path d="M7 23l-4-4 4-4"></path>
                                        <path d="M21 13v2a4 4 0 0 0 4 4H3"></path>
                                    </svg>
                                </span>
                            ` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="income-description">
                            <div class="font-medium">${this.escapeHtml(income.description)}</div>
                            ${income.payer ? `<div class="text-sm text-gray-500">From: ${this.escapeHtml(income.payer)}</div>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="type-badge ${isCashback ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                            ${sourceType}
                        </div>
                    </td>
                    <td>
                        <div class="text-sm">${account}</div>
                    </td>
                    <td>
                        <div class="font-semibold text-success">${this.formatCurrency(amount)}</div>
                    </td>
                    <td>
                        <div class="status-badge ${status.class}">${status.text}</div>
                    </td>
                    <td>
                        <div class="flex items-center space-x-2">
                            <button class="btn btn-text btn-sm edit-income" title="Edit">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn btn-text btn-sm delete-income" title="Delete">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Update total
        document.getElementById('table-total').textContent = this.formatCurrency(pageTotal);
        
        // Attach event listeners
        this.attachTableRowEvents();
    }

    /**
     * Get income status
     */
    getIncomeStatus(income) {
        const today = new Date();
        const incomeDate = new Date(income.date);
        
        if (income.is_recurring && income.next_occurrence) {
            const nextDate = new Date(income.next_occurrence);
            if (nextDate <= today) {
                return { text: 'Due', class: 'bg-red-100 text-red-800' };
            } else {
                return { text: 'Scheduled', class: 'bg-blue-100 text-blue-800' };
            }
        }
        
        if (incomeDate > today) {
            return { text: 'Future', class: 'bg-yellow-100 text-yellow-800' };
        }
        
        return { text: 'Received', class: 'bg-green-100 text-green-800' };
    }

    /**
     * Attach event listeners to table rows
     */
    attachTableRowEvents() {
        // Edit buttons
        document.querySelectorAll('.edit-income').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const incomeId = btn.closest('tr').dataset.incomeId;
                this.editIncome(incomeId);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-income').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const incomeId = btn.closest('tr').dataset.incomeId;
                this.confirmDelete(incomeId);
            });
        });
    }

    /**
     * Update table summary
     */
    updateTableSummary() {
        const summary = document.getElementById('table-summary');
        if (!summary) return;
        
        const total = this.filteredIncome.length;
        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, total);
        
        summary.textContent = `Showing ${start}-${end} of ${total} income transactions`;
    }

    /**
     * Update summary cards
     */
    updateSummary() {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        // Total income
        const totalIncome = this.income.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        
        // This month's income
        const monthIncome = this.income
            .filter(item => {
                const date = new Date(item.date);
                return date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            })
            .reduce((sum, item) => sum + parseFloat(item.amount), 0);
        
        // Last month's income
        const lastMonthIncome = this.income
            .filter(item => {
                const date = new Date(item.date);
                return date.getMonth() === lastMonth && 
                       date.getFullYear() === lastMonthYear;
            })
            .reduce((sum, item) => sum + parseFloat(item.amount), 0);
        
        // Average monthly income (last 12 months)
        const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 12, today.getDate());
        const recentIncome = this.income
            .filter(item => new Date(item.date) >= twelveMonthsAgo)
            .reduce((sum, item) => sum + parseFloat(item.amount), 0);
        
        const avgMonthly = recentIncome / 12;
        
        // Cashback total
        const cashbackTotal = this.cashback.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        
        // Calculate percentage change
        const incomeChange = lastMonthIncome > 0 ? 
            ((monthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1) : 0;
        
        // Update UI
        document.getElementById('total-income').textContent = this.formatCurrency(totalIncome);
        document.getElementById('month-income').textContent = this.formatCurrency(monthIncome);
        document.getElementById('avg-monthly').textContent = this.formatCurrency(avgMonthly);
        document.getElementById('total-cashback').textContent = this.formatCurrency(cashbackTotal);
        document.getElementById('income-change').textContent = `${incomeChange >= 0 ? '+' : ''}${incomeChange}%`;
        document.getElementById('cashback-count').textContent = `${this.cashback.length} transactions`;
    }

    /**
     * Update cashback stats
     */
    updateCashbackStats() {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        // This month's cashback
        const monthCashback = this.cashback
            .filter(item => {
                const date = new Date(item.date);
                return date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            })
            .reduce((sum, item) => sum + parseFloat(item.amount), 0);
        
        // Last month's cashback
        const lastMonthCashback = this.cashback
            .filter(item => {
                const date = new Date(item.date);
                return date.getMonth() === lastMonth && 
                       date.getFullYear() === lastMonthYear;
            })
            .reduce((sum, item) => sum + parseFloat(item.amount), 0);
        
        // Average monthly cashback (last 6 months)
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
        const recentCashback = this.cashback
            .filter(item => new Date(item.date) >= sixMonthsAgo)
            .reduce((sum, item) => sum + parseFloat(item.amount), 0);
        
        const avgCashback = recentCashback / 6;
        
        // Total cashback
        const totalCashback = this.cashback.reduce((sum, item) => sum + parseFloat(item.amount), 0);
        
        // Update UI
        document.getElementById('cashback-month').textContent = this.formatCurrency(monthCashback);
        document.getElementById('cashback-last-month').textContent = this.formatCurrency(lastMonthCashback);
        document.getElementById('cashback-avg').textContent = this.formatCurrency(avgCashback);
        document.getElementById('cashback-total').textContent = this.formatCurrency(totalCashback);
        
        // Update recent cashback list
        this.updateRecentCashback();
    }

    /**
     * Update recent cashback list
     */
    updateRecentCashback() {
        const list = document.getElementById('recent-cashback');
        if (!list) return;
        
        // Get recent cashback (last 5)
        const recent = [...this.cashback]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
        
        if (recent.length === 0) {
            list.innerHTML = '<div class="text-center py-4 text-gray-500">No recent cashback transactions</div>';
            return;
        }
        
        let html = '<div class="space-y-3">';
        
        recent.forEach(item => {
            const date = new Date(item.date).toLocaleDateString();
            const source = item.payer || item.description;
            
            html += `
                <div class="cashback-item">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="font-medium">${this.escapeHtml(source)}</div>
                            <div class="text-sm text-gray-500">${date}</div>
                        </div>
                        <div class="text-success font-semibold">${this.formatCurrency(item.amount)}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        list.innerHTML = html;
    }

    /**
     * Update income breakdown
     */
    updateIncomeBreakdown(period = 'month') {
        // Calculate income by source type for the period
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
            case 'year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            default:
                startDate = new Date(0); // All time
        }
        
        const periodIncome = this.income.filter(item => new Date(item.date) >= startDate);
        
        // Group by source type
        const sourceTotals = {};
        periodIncome.forEach(item => {
            const sourceType = item.source_type || 'other';
            const amount = parseFloat(item.amount);
            
            if (!sourceTotals[sourceType]) {
                sourceTotals[sourceType] = 0;
            }
            sourceTotals[sourceType] += amount;
        });
        
        // Convert to array and sort
        const sourcesArray = Object.entries(sourceTotals)
            .map(([sourceType, amount]) => ({
                sourceType,
                amount,
                label: this.getSourceTypeLabel(sourceType),
                color: this.getSourceTypeColor(sourceType)
            }))
            .sort((a, b) => b.amount - a.amount);
        
        // Update chart
        this.updateIncomeChart(sourcesArray);
        
        // Update list
        this.updateIncomeSourcesList(sourcesArray);
    }

    /**
     * Update income chart
     */
    updateIncomeChart(sourcesArray) {
        const ctx = document.getElementById('income-source-chart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.incomeChart) {
            this.incomeChart.destroy();
        }
        
        // Prepare data
        const labels = sourcesArray.slice(0, 6).map(s => s.label);
        const data = sourcesArray.slice(0, 6).map(s => s.amount);
        const colors = sourcesArray.slice(0, 6).map(s => s.color);
        
        // Create chart
        this.incomeChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const total = data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${this.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update income sources list
     */
    updateIncomeSourcesList(sourcesArray) {
        const list = document.getElementById('income-sources-list');
        if (!list) return;
        
        const total = sourcesArray.reduce((sum, s) => sum + s.amount, 0);
        
        let html = '<div class="space-y-3">';
        
        sourcesArray.forEach(source => {
            const percentage = total > 0 ? ((source.amount / total) * 100).toFixed(1) : 0;
            
            html += `
                <div class="source-item">
                    <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center">
                            <div class="source-color" style="background-color: ${source.color};"></div>
                            <span class="text-sm font-medium">${source.label}</span>
                        </div>
                        <div class="text-sm font-semibold">${this.formatCurrency(source.amount)}</div>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="text-xs text-gray-500">${percentage}% of total</div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${percentage}%; background-color: ${source.color};"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        list.innerHTML = html || '<p class="text-gray-500 text-center">No income in this period</p>';
    }

    /**
     * Show income form
     */
    showIncomeForm(incomeId = null) {
        this.editingIncomeId = incomeId;
        const modal = document.getElementById('income-form-modal');
        const title = document.getElementById('modal-income-title');
        
        if (incomeId) {
            // Edit mode
            title.textContent = 'Edit Income';
            const income = this.income.find(i => i.id === incomeId);
            if (income) {
                this.populateIncomeForm(income);
            }
        } else {
            // Add mode
            title.textContent = 'Add Income';
            this.resetIncomeForm();
        }
        
        modal.classList.add('show');
        document.getElementById('income-amount').focus();
    }

    /**
     * Hide income form
     */
    hideIncomeForm() {
        document.getElementById('income-form-modal').classList.remove('show');
        this.editingIncomeId = null;
    }

    /**
     * Populate income form
     */
    populateIncomeForm(income) {
        document.getElementById('income-id').value = income.id || '';
        document.getElementById('income-amount').value = income.amount || '';
        document.getElementById('income-date').value = income.date || '';
        document.getElementById('income-description').value = income.description || '';
        document.getElementById('income-category').value = income.category_id || '';
        document.getElementById('income-account').value = income.account_id || '';
        document.getElementById('income-source-type').value = income.source_type || 'salary';
        document.getElementById('income-payer').value = income.payer || '';
        document.getElementById('income-recurring').checked = income.is_recurring || false;
        document.getElementById('recurring-income-frequency').value = income.recurring_frequency || 'monthly';
        document.getElementById('next-income-occurrence').value = income.next_occurrence || '';
        document.getElementById('income-taxable').checked = income.is_taxable !== false;
        document.getElementById('tax-amount').value = income.tax_amount || '';
        document.getElementById('tax-rate').value = income.tax_rate || '';
        document.getElementById('income-notes').value = income.notes || '';
        
        // Show/hide recurring options
        document.getElementById('recurring-income-options').style.display = 
            income.is_recurring ? 'block' : 'none';
            
        // Show/hide tax options
        document.getElementById('tax-options').style.display = 
            income.is_taxable !== false ? 'block' : 'none';
    }

    /**
     * Reset income form
     */
    resetIncomeForm() {
        document.getElementById('income-form').reset();
        document.getElementById('income-id').value = '';
        document.getElementById('income-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('income-source-type').value = 'salary';
        document.getElementById('income-recurring').checked = false;
        document.getElementById('income-taxable').checked = true;
        document.getElementById('recurring-income-options').style.display = 'none';
    }

    /**
     * Show cashback form
     */
    showCashbackForm() {
        const modal = document.getElementById('cashback-form-modal');
        this.resetCashbackForm();
        modal.classList.add('show');
        document.getElementById('cashback-amount').focus();
    }

    /**
     * Hide cashback form
     */
    hideCashbackForm() {
        document.getElementById('cashback-form-modal').classList.remove('show');
    }

    /**
     * Reset cashback form
     */
    resetCashbackForm() {
        document.getElementById('cashback-form').reset();
        document.getElementById('cashback-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('cashback-type').value = 'credit_card';
    }

    /**
     * Save income (create or update)
     */
    async saveIncome() {
        // Validate form
        if (!this.validateIncomeForm()) {
            return;
        }
        
        // Get form data
        const formData = this.getIncomeFormData();
        
        try {
            this.showLoading();
            
            if (window.WealthFlowAPI) {
                let savedIncome;
                
                if (this.editingIncomeId) {
                    // Update existing income
                    savedIncome = await window.WealthFlowAPI.transactions.update(this.editingIncomeId, formData);
                    this.showSuccess('Income updated successfully');
                } else {
                    // Create new income
                    savedIncome = await window.WealthFlowAPI.transactions.create(formData);
                    this.showSuccess('Income added successfully');
                }
                
                // Update local state
                if (window.AppState) {
                    if (this.editingIncomeId) {
                        window.AppState.updateTransaction(savedIncome);
                    } else {
                        window.AppState.addTransaction(savedIncome);
                    }
                } else {
                    // Update local array
                    const index = this.income.findIndex(i => i.id === savedIncome.id);
                    if (index >= 0) {
                        this.income[index] = savedIncome;
                    } else {
                        this.income.push(savedIncome);
                    }
                }
                
                // Hide form and refresh
                this.hideIncomeForm();
                this.refreshData();
                
            } else {
                // Mock save
                this.mockSaveIncome(formData);
            }
            
        } catch (error) {
            console.error('Failed to save income:', error);
            this.showError(`Failed to save income: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Save cashback
     */
    async saveCashback() {
        // Validate form
        if (!this.validateCashbackForm()) {
            return;
        }
        
        // Get form data
        const formData = this.getCashbackFormData();
        
        try {
            this.showLoading();
            
            if (window.WealthFlowAPI) {
                // Create cashback as income transaction
                const savedCashback = await window.WealthFlowAPI.transactions.create(formData);
                this.showSuccess('Cashback added successfully');
                
                // Update local state
                if (window.AppState) {
                    window.AppState.addTransaction(savedCashback);
                } else {
                    this.income.push(savedCashback);
                }
                
                // Hide form and refresh
                this.hideCashbackForm();
                this.refreshData();
                
            } else {
                // Mock save
                this.mockSaveCashback(formData);
            }
            
        } catch (error) {
            console.error('Failed to save cashback:', error);
            this.showError(`Failed to save cashback: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Validate income form
     */
    validateIncomeForm() {
        const amount = document.getElementById('income-amount').value;
        const description = document.getElementById('income-description').value.trim();
        const category = document.getElementById('income-category').value;
        const account = document.getElementById('income-account').value;
        
        if (!amount || parseFloat(amount) <= 0) {
            this.showError('Please enter a valid amount');
            document.getElementById('income-amount').focus();
            return false;
        }
        
        if (!description) {
            this.showError('Description is required');
            document.getElementById('income-description').focus();
            return false;
        }
        
        if (!category) {
            this.showError('Category is required');
            document.getElementById('income-category').focus();
            return false;
        }
        
        if (!account) {
            this.showError('Account is required');
            document.getElementById('income-account').focus();
            return false;
        }
        
        return true;
    }

    /**
     * Validate cashback form
     */
    validateCashbackForm() {
        const amount = document.getElementById('cashback-amount').value;
        const source = document.getElementById('cashback-source').value.trim();
        const account = document.getElementById('cashback-account').value;
        
        if (!amount || parseFloat(amount) <= 0) {
            this.showError('Please enter a valid amount');
            document.getElementById('cashback-amount').focus();
            return false;
        }
        
        if (!source) {
            this.showError('Source is required');
            document.getElementById('cashback-source').focus();
            return false;
        }
        
        if (!account) {
            this.showError('Account is required');
            document.getElementById('cashback-account').focus();
            return false;
        }
        
        return true;
    }

    /**
     * Get income form data
     */
    getIncomeFormData() {
        const form = document.getElementById('income-form');
        const formData = new FormData(form);
        const data = {};
        
        // Convert FormData to object
        for (const [key, value] of formData.entries()) {
            if (value) {
                data[key] = value;
            }
        }
        
        // Convert numeric fields
        data.amount = parseFloat(data.amount);
        if (data.tax_amount) data.tax_amount = parseFloat(data.tax_amount);
        if (data.tax_rate) data.tax_rate = parseFloat(data.tax_rate);
        
        // Handle boolean fields
        data.is_recurring = document.getElementById('income-recurring').checked;
        data.is_taxable = document.getElementById('income-taxable').checked;
        
        // Set source_type
        data.source_type = data.source_type || 'salary';
        
        return data;
    }

    /**
     * Get cashback form data
     */
    getCashbackFormData() {
        const form = document.getElementById('cashback-form');
        const formData = new FormData(form);
        const data = {};
        
        // Convert FormData to object
        for (const [key, value] of formData.entries()) {
            if (value) {
                data[key] = value;
            }
        }
        
        // Convert numeric field
        data.amount = parseFloat(data.amount);
        
        // Set type and source_type
        data.type = 'income';
        data.source_type = 'cashback';
        
        // Use source as description if description is empty
        if (!data.description && data.source) {
            data.description = `Cashback from ${data.source}`;
        }
        
        // Set payer as source
        data.payer = data.source;
        
        return data;
    }

    /**
     * Edit an income
     */
    editIncome(incomeId) {
        this.showIncomeForm(incomeId);
    }

    /**
     * Confirm delete
     */
    confirmDelete(incomeId) {
        this.deletingIncomeId = incomeId;
        document.getElementById('delete-income-modal').classList.add('show');
    }

    /**
     * Hide delete confirmation
     */
    hideDeleteConfirm() {
        document.getElementById('delete-income-modal').classList.remove('show');
        this.deletingIncomeId = null;
    }

    /**
     * Delete income
     */
    async deleteIncome() {
        if (!this.deletingIncomeId) return;
        
        try {
            this.showLoading();
            
            if (window.WealthFlowAPI) {
                // Delete from API
                await window.WealthFlowAPI.transactions.delete(this.deletingIncomeId);
                
                // Update local state
                if (window.AppState) {
                    window.AppState.removeTransaction(this.deletingIncomeId);
                }
                
                // Remove from local array
                this.income = this.income.filter(i => i.id !== this.deletingIncomeId);
                
                this.showSuccess('Income deleted successfully');
                
            } else {
                // Mock delete
                this.income = this.income.filter(i => i.id !== this.deletingIncomeId);
                this.showSuccess('Income deleted (mock)');
            }
            
            // Hide modal and refresh
            this.hideDeleteConfirm();
            this.refreshData();
            
        } catch (error) {
            console.error('Failed to delete income:', error);
            this.showError(`Failed to delete income: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Export income
     */
    exportIncome() {
        // Create CSV data
        const headers = ['Date', 'Description', 'Type', 'Source', 'Account', 'Amount', 'Tax Amount', 'Notes'];
        const rows = this.filteredIncome.map(income => [
            income.date,
            income.description,
            this.getSourceTypeLabel(income.source_type),
            income.payer || '',
            this.getAccountName(income.account_id),
            income.amount,
            income.tax_amount || '',
            income.notes || ''
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `income-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('Income exported successfully');
    }

    /**
     * Refresh data
     */
    async refreshData() {
        try {
            await this.loadIncome();
            await this.loadCategories();
            await this.loadAccounts();
            
            this.separateCashback();
            this.updateSummary();
            this.applyFilters();
            this.updateIncomeBreakdown();
            this.updateCashbackStats();
            
            this.showSuccess('Data refreshed');
        } catch (error) {
            console.error('Failed to refresh data:', error);
            this.showError('Failed to refresh data');
        }
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Get category name by ID
     */
    getCategoryName(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.name : 'Uncategorized';
    }

    /**
     * Get account name by ID
     */
    getAccountName(accountId) {
        const account = this.accounts.find(a => a.id === accountId);
        return account ? account.name : 'Unknown Account';
    }

    /**
     * Get source type label
     */
    getSourceTypeLabel(sourceType) {
        const labels = {
            salary: 'Salary',
            freelance: 'Freelance',
            investment: 'Investment',
            cashback: 'Cashback/Rewards',
            gift: 'Gift',
            refund: 'Refund',
            other: 'Other'
        };
        
        return labels[sourceType] || 'Other';
    }

    /**
     * Get source type color
     */
    getSourceTypeColor(sourceType) {
        const colors = {
            salary: '#10b981',
            freelance: '#3b82f6',
            investment: '#8b5cf6',
            cashback: '#f59e0b',
            gift: '#ec4899',
            refund: '#6366f1',
            other: '#6b7280'
        };
        
        return colors[sourceType] || '#6b7280';
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

    /**
     * Get default categories
     */
    getDefaultCategories() {
        return [
            { id: '101', name: 'Salary', type: 'income', color: '#10b981' },
            { id: '102', name: 'Freelance', type: 'income', color: '#3b82f6' },
            { id: '103', name: 'Investment', type: 'income', color: '#8b5cf6' },
            { id: '104', name: 'Cashback', type: 'income', color: '#f59e0b' },
            { id: '105', name: 'Gift', type: 'income', color: '#ec4899' },
            { id: '106', name: 'Refund', type: 'income', color: '#6366f1' },
            { id: '107', name: 'Other Income', type: 'income', color: '#6b7280' }
        ];
    }

    // ============================================
    // MOCK DATA FOR DEVELOPMENT
    // ============================================

    loadMockIncome() {
        console.log('📊 Loading mock income for development');
        
        this.income = [
            {
                id: '101',
                type: 'income',
                amount: 3500.00,
                description: 'Monthly Salary',
                category_id: '101',
                account_id: '1',
                date: new Date().toISOString().split('T')[0],
                source_type: 'salary',
                payer: 'Tech Corp Inc.',
                is_recurring: true,
                recurring_frequency: 'monthly',
                is_taxable: true,
                tax_amount: 700.00,
                tax_rate: 20.0,
                notes: 'Regular monthly salary'
            },
            {
                id: '102',
                type: 'income',
                amount: 850.50,
                description: 'Freelance Web Design',
                category_id: '102',
                account_id: '2',
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                source_type: 'freelance',
                payer: 'Startup ABC',
                is_taxable: true,
                notes: 'Website redesign project'
            },
            {
                id: '103',
                type: 'income',
                amount: 150.25,
                description: 'Stock Dividends',
                category_id: '103',
                account_id: '6',
                date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
                source_type: 'investment',
                payer: 'Investment Account',
                is_recurring: true,
                recurring_frequency: 'quarterly',
                is_taxable: true,
                tax_rate: 15.0
            },
            {
                id: '104',
                type: 'income',
                amount: 25.75,
                description: 'Credit Card Cashback',
                category_id: '104',
                account_id: '3',
                date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
                source_type: 'cashback',
                payer: 'Chase Bank',
                notes: '5% cashback on dining'
            },
            {
                id: '105',
                type: 'income',
                amount: 100.00,
                description: 'Birthday Gift',
                category_id: '105',
                account_id: '1',
                date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
                source_type: 'gift',
                payer: 'Family',
                is_taxable: false
            }
        ];
        
        // Separate cashback
        this.separateCashback();
        
        // Simulate API delay
        setTimeout(() => {
            this.updateSummary();
            this.applyFilters();
            this.updateIncomeBreakdown();
            this.updateCashbackStats();
        }, 500);
    }

    mockSaveIncome(formData) {
        if (this.editingIncomeId) {
            // Update existing
            const index = this.income.findIndex(i => i.id === this.editingIncomeId);
            if (index >= 0) {
                this.income[index] = {
                    ...this.income[index],
                    ...formData,
                    id: this.editingIncomeId
                };
            }
            this.showSuccess('Income updated (mock)');
        } else {
            // Create new
            const newIncome = {
                ...formData,
                id: Date.now().toString(),
                date: formData.date || new Date().toISOString().split('T')[0],
                type: 'income'
            };
            this.income.push(newIncome);
            this.showSuccess('Income added (mock)');
        }
        
        this.separateCashback();
        this.hideIncomeForm();
        this.refreshData();
    }

    mockSaveCashback(formData) {
        // Create cashback
        const newCashback = {
            ...formData,
            id: Date.now().toString(),
            date: formData.date || new Date().toISOString().split('T')[0],
            type: 'income',
            source_type: 'cashback',
            category_id: this.getCashbackCategoryId() || '104'
        };
        
        this.income.push(newCashback);
        this.separateCashback();
        this.hideCashbackForm();
        this.refreshData();
        
        this.showSuccess('Cashback added (mock)');
    }
}

// ============================================
// INITIALIZE INCOME MANAGER
// ============================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.incomeManager = new IncomeManager();
    });
} else {
    window.incomeManager = new IncomeManager();
}

console.log('💰 Income Manager module loaded');
