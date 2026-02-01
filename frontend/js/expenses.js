// ============================================
// EXPENSES.JS - Expenses Management
// ============================================

class ExpensesManager {
    constructor() {
        this.expenses = [];
        this.categories = [];
        this.accounts = [];
        this.filteredExpenses = [];
        
        // Filter state
        this.filters = {
            dateFrom: null,
            dateTo: null,
            categoryId: null,
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
        
        // Chart
        this.categoryChart = null;
        
        // State for editing/deleting
        this.editingExpenseId = null;
        this.deletingExpenseId = null;
        
        this.init();
    }

    /**
     * Initialize the expenses manager
     */
    init() {
        console.log('💸 Initializing Expenses Manager...');
        
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
        // Add expense button
        document.getElementById('add-expense-btn')?.addEventListener('click', () => this.showExpenseForm());
        
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
        
        // Category filter
        document.getElementById('category-select')?.addEventListener('change', (e) => {
            this.filters.categoryId = e.target.value || null;
            this.applyFilters();
        });
        
        // Search
        document.getElementById('expense-search')?.addEventListener('input', (e) => {
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
        document.getElementById('export-expenses')?.addEventListener('click', () => this.exportExpenses());
        
        // Refresh button
        document.getElementById('refresh-expenses')?.addEventListener('click', () => this.refreshData());
        
        // Breakdown period
        document.getElementById('breakdown-period')?.addEventListener('change', (e) => {
            this.updateCategoryBreakdown(e.target.value);
        });
        
        // Form modals
        document.getElementById('close-expense-modal')?.addEventListener('click', () => this.hideExpenseForm());
        document.getElementById('cancel-expense')?.addEventListener('click', () => this.hideExpenseForm());
        document.getElementById('save-expense')?.addEventListener('click', () => this.saveExpense());
        
        // Delete modal
        document.getElementById('close-delete-expense')?.addEventListener('click', () => this.hideDeleteConfirm());
        document.getElementById('cancel-delete-expense')?.addEventListener('click', () => this.hideDeleteConfirm());
        document.getElementById('confirm-delete-expense')?.addEventListener('click', () => this.deleteExpense());
        
        // Form submission
        document.getElementById('expense-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveExpense();
        });
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        console.log('📥 Loading expenses data...');
        
        this.showLoading();
        
        try {
            // Load data from state or API
            await this.loadExpenses();
            await this.loadCategories();
            await this.loadAccounts();
            
            // Update UI
            this.updateSummary();
            this.applyFilters();
            this.updateCategoryBreakdown('month');
            
        } catch (error) {
            console.error('Failed to load expenses data:', error);
            this.showError('Failed to load expenses. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Load expenses
     */
    async loadExpenses() {
        try {
            // Try to load from AppState first
            if (window.AppState) {
                const state = window.AppState.getState();
                this.expenses = state.transactions?.filter(t => t.type === 'expense') || [];
                
                if (this.expenses.length > 0) {
                    return;
                }
            }
            
            // Load from API
            if (window.WealthFlowAPI) {
                const response = await window.WealthFlowAPI.transactions.getAll({
                    type: 'expense',
                    limit: 1000
                });
                
                this.expenses = response.transactions || response || [];
            } else {
                // Load mock data
                this.loadMockExpenses();
            }
            
        } catch (error) {
            console.error('Failed to load expenses:', error);
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
                this.categories = state.categories?.filter(c => c.type === 'expense') || [];
                
                if (this.categories.length > 0) {
                    this.populateCategoryFilters();
                    return;
                }
            }
            
            // Load from API
            if (window.WealthFlowAPI) {
                const response = await window.WealthFlowAPI.categories.getAll();
                const allCategories = response.categories || response || [];
                this.categories = allCategories.filter(c => c.type === 'expense');
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
     * Populate category filters
     */
    populateCategoryFilters() {
        const categorySelect = document.getElementById('category-select');
        const expenseCategory = document.getElementById('expense-category');
        
        if (!categorySelect || !expenseCategory) return;
        
        // Clear existing options (keep first option)
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }
        
        while (expenseCategory.options.length > 1) {
            expenseCategory.remove(1);
        }
        
        // Add categories
        this.categories.forEach(category => {
            const option1 = document.createElement('option');
            option1.value = category.id;
            option1.textContent = category.name;
            categorySelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = category.id;
            option2.textContent = category.name;
            expenseCategory.appendChild(option2);
        });
    }

    /**
     * Populate account filters
     */
    populateAccountFilters() {
        const accountSelect = document.getElementById('expense-account');
        
        if (!accountSelect) return;
        
        // Clear existing options (keep first option)
        while (accountSelect.options.length > 1) {
            accountSelect.remove(1);
        }
        
        // Add active accounts
        this.accounts
            .filter(account => account.is_active !== false)
            .forEach(account => {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = `${account.name} (${this.formatCurrency(account.balance)})`;
                accountSelect.appendChild(option);
            });
    }

    /**
     * Apply filters to expenses
     */
    applyFilters() {
        let filtered = [...this.expenses];
        
        // Apply period filter
        filtered = this.applyPeriodFilter(filtered);
        
        // Apply date range filter
        if (this.filters.dateFrom) {
            filtered = filtered.filter(expense => {
                const expenseDate = new Date(expense.date);
                const fromDate = new Date(this.filters.dateFrom);
                return expenseDate >= fromDate;
            });
        }
        
        if (this.filters.dateTo) {
            filtered = filtered.filter(expense => {
                const expenseDate = new Date(expense.date);
                const toDate = new Date(this.filters.dateTo);
                return expenseDate <= toDate;
            });
        }
        
        // Apply category filter
        if (this.filters.categoryId) {
            filtered = filtered.filter(expense => 
                expense.category_id === this.filters.categoryId
            );
        }
        
        // Apply search filter
        if (this.filters.searchQuery) {
            const query = this.filters.searchQuery.toLowerCase();
            filtered = filtered.filter(expense => 
                expense.description.toLowerCase().includes(query) ||
                (expense.notes && expense.notes.toLowerCase().includes(query)) ||
                (expense.tags && expense.tags.some(tag => tag.toLowerCase().includes(query)))
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
        
        this.filteredExpenses = filtered;
        this.updatePagination();
        this.renderExpensesTable();
        this.updateTableSummary();
    }

    /**
     * Apply period filter
     */
    applyPeriodFilter(expenses) {
        const now = new Date();
        
        switch (this.filters.period) {
            case 'today':
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                return expenses.filter(expense => {
                    const expenseDate = new Date(expense.date);
                    return expenseDate >= today;
                });
                
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return expenses.filter(expense => {
                    const expenseDate = new Date(expense.date);
                    return expenseDate >= weekAgo;
                });
                
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                return expenses.filter(expense => {
                    const expenseDate = new Date(expense.date);
                    return expenseDate >= monthAgo;
                });
                
            case 'year':
                const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                return expenses.filter(expense => {
                    const expenseDate = new Date(expense.date);
                    return expenseDate >= yearAgo;
                });
                
            default:
                return expenses;
        }
    }

    /**
     * Handle quick filter
     */
    handleQuickFilter(period) {
        // Update active button
        document.querySelectorAll('.quick-filters button').forEach(btn => {
            if (btn.dataset.filter === period) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Clear date inputs
        document.getElementById('date-from').value = '';
        document.getElementById('date-to').value = '';
        
        // Update filter
        this.filters.period = period;
        this.filters.dateFrom = null;
        this.filters.dateTo = null;
        
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
        this.totalPages = Math.ceil(this.filteredExpenses.length / this.pageSize);
        this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
        
        this.renderPagination();
    }

    /**
     * Render pagination controls
     */
    renderPagination() {
        const pagination = document.getElementById('expenses-pagination');
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
                    onclick="window.expensesManager.goToPage(${this.currentPage - 1})">
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
                        onclick="window.expensesManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        html += `
            <button class="btn btn-text btn-sm ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
                    ${this.currentPage === this.totalPages ? 'disabled' : ''}
                    onclick="window.expensesManager.goToPage(${this.currentPage + 1})">
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
            this.renderExpensesTable();
            this.renderPagination();
        }
    }

    /**
     * Render expenses table
     */
    renderExpensesTable() {
        const tbody = document.getElementById('expenses-tbody');
        if (!tbody) return;
        
        if (this.filteredExpenses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="text-center py-8">
                            <div class="empty-state-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                </svg>
                            </div>
                            <p class="text-gray-500 mt-2">No expenses found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Calculate pagination slice
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageExpenses = this.filteredExpenses.slice(startIndex, endIndex);
        
        // Calculate total for this page
        let pageTotal = 0;
        
        // Build table rows
        let html = '';
        
        pageExpenses.forEach(expense => {
            const amount = parseFloat(expense.amount);
            pageTotal += amount;
            
            const date = new Date(expense.date).toLocaleDateString();
            const category = this.getCategoryName(expense.category_id);
            const account = this.getAccountName(expense.account_id);
            const color = this.getCategoryColor(expense.category_id);
            
            html += `
                <tr data-expense-id="${expense.id}">
                    <td>
                        <div class="flex items-center">
                            <div class="date-badge">${date}</div>
                        </div>
                    </td>
                    <td>
                        <div class="expense-description">
                            <div class="font-medium">${this.escapeHtml(expense.description)}</div>
                            ${expense.notes ? `<div class="text-sm text-gray-500 truncate">${this.escapeHtml(expense.notes)}</div>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="category-badge" style="background-color: ${color}20; color: ${color}; border-color: ${color}40;">
                            ${category}
                        </div>
                    </td>
                    <td>
                        <div class="text-sm">${account}</div>
                    </td>
                    <td>
                        <div class="font-semibold text-danger">-${this.formatCurrency(amount)}</div>
                    </td>
                    <td>
                        <div class="flex items-center space-x-2">
                            <button class="btn btn-text btn-sm edit-expense" title="Edit">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="btn btn-text btn-sm delete-expense" title="Delete">
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
        document.getElementById('table-total').textContent = `-${this.formatCurrency(pageTotal)}`;
        
        // Attach event listeners
        this.attachTableRowEvents();
    }

    /**
     * Attach event listeners to table rows
     */
    attachTableRowEvents() {
        // Edit buttons
        document.querySelectorAll('.edit-expense').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const expenseId = btn.closest('tr').dataset.expenseId;
                this.editExpense(expenseId);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-expense').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const expenseId = btn.closest('tr').dataset.expenseId;
                this.confirmDelete(expenseId);
            });
        });
        
        // Row click for details (optional)
        document.querySelectorAll('tbody tr[data-expense-id]').forEach(row => {
            row.addEventListener('click', (e) => {
                if (!e.target.closest('td:last-child')) {
                    const expenseId = row.dataset.expenseId;
                    // Could show details modal here
                }
            });
        });
    }

    /**
     * Update table summary
     */
    updateTableSummary() {
        const summary = document.getElementById('table-summary');
        if (!summary) return;
        
        const total = this.filteredExpenses.length;
        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, total);
        
        summary.textContent = `Showing ${start}-${end} of ${total} expenses`;
    }

    /**
     * Update summary cards
     */
    updateSummary() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Today's expenses
        const todayExpenses = this.expenses
            .filter(e => e.date === todayStr)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        
        // This month's expenses
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const monthExpenses = this.expenses
            .filter(e => {
                const date = new Date(e.date);
                return date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            })
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        
        // Average daily (last 30 days)
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentExpenses = this.expenses
            .filter(e => new Date(e.date) >= thirtyDaysAgo)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        
        const avgDaily = recentExpenses / 30;
        
        // Update UI
        document.getElementById('today-expenses').textContent = this.formatCurrency(todayExpenses);
        document.getElementById('month-expenses').textContent = this.formatCurrency(monthExpenses);
        document.getElementById('avg-daily').textContent = this.formatCurrency(avgDaily);
        document.getElementById('category-count').textContent = this.categories.length;
    }

    /**
     * Update category breakdown
     */
    updateCategoryBreakdown(period = 'month') {
        // Calculate expenses by category for the period
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
        
        const periodExpenses = this.expenses.filter(e => new Date(e.date) >= startDate);
        
        // Group by category
        const categoryTotals = {};
        periodExpenses.forEach(expense => {
            const categoryId = expense.category_id;
            const amount = parseFloat(expense.amount);
            
            if (!categoryTotals[categoryId]) {
                categoryTotals[categoryId] = 0;
            }
            categoryTotals[categoryId] += amount;
        });
        
        // Convert to array and sort
        const categoriesArray = Object.entries(categoryTotals)
            .map(([categoryId, amount]) => ({
                categoryId,
                amount,
                category: this.getCategoryName(categoryId),
                color: this.getCategoryColor(categoryId)
            }))
            .sort((a, b) => b.amount - a.amount);
        
        // Update chart
        this.updateCategoryChart(categoriesArray);
        
        // Update list
        this.updateCategoryList(categoriesArray);
    }

    /**
     * Update category chart
     */
    updateCategoryChart(categoriesArray) {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }
        
        // Prepare data
        const labels = categoriesArray.slice(0, 8).map(c => c.category);
        const data = categoriesArray.slice(0, 8).map(c => c.amount);
        const colors = categoriesArray.slice(0, 8).map(c => c.color);
        
        // Create chart
        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
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
                },
                cutout: '70%'
            }
        });
    }

    /**
     * Update category list
     */
    updateCategoryList(categoriesArray) {
        const list = document.getElementById('category-breakdown-list');
        if (!list) return;
        
        const total = categoriesArray.reduce((sum, c) => sum + c.amount, 0);
        
        let html = '';
        
        categoriesArray.forEach(category => {
            const percentage = total > 0 ? ((category.amount / total) * 100).toFixed(1) : 0;
            
            html += `
                <div class="category-item">
                    <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center">
                            <div class="category-color" style="background-color: ${category.color};"></div>
                            <span class="text-sm font-medium">${category.category}</span>
                        </div>
                        <div class="text-sm font-semibold">${this.formatCurrency(category.amount)}</div>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="text-xs text-gray-500">${percentage}% of total</div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${percentage}%; background-color: ${category.color};"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        list.innerHTML = html || '<p class="text-gray-500 text-center">No expenses in this period</p>';
    }

    /**
     * Show expense form
     */
    showExpenseForm(expenseId = null) {
        this.editingExpenseId = expenseId;
        const modal = document.getElementById('expense-form-modal');
        const title = document.getElementById('modal-expense-title');
        
        if (expenseId) {
            // Edit mode
            title.textContent = 'Edit Expense';
            const expense = this.expenses.find(e => e.id === expenseId);
            if (expense) {
                this.populateExpenseForm(expense);
            }
        } else {
            // Add mode
            title.textContent = 'Add Expense';
            this.resetExpenseForm();
        }
        
        modal.classList.add('show');
        document.getElementById('expense-amount').focus();
    }

    /**
     * Hide expense form
     */
    hideExpenseForm() {
        document.getElementById('expense-form-modal').classList.remove('show');
        this.editingExpenseId = null;
    }

    /**
     * Populate expense form
     */
    populateExpenseForm(expense) {
        document.getElementById('expense-id').value = expense.id || '';
        document.getElementById('expense-amount').value = expense.amount || '';
        document.getElementById('expense-date').value = expense.date || '';
        document.getElementById('expense-description').value = expense.description || '';
        document.getElementById('expense-category').value = expense.category_id || '';
        document.getElementById('expense-account').value = expense.account_id || '';
        document.getElementById('expense-recurring').checked = expense.is_recurring || false;
        document.getElementById('recurring-frequency').value = expense.recurring_frequency || 'monthly';
        document.getElementById('next-occurrence').value = expense.next_occurrence || '';
        document.getElementById('expense-tags').value = expense.tags ? expense.tags.join(', ') : '';
        document.getElementById('expense-notes').value = expense.notes || '';
        
        // Show/hide recurring options
        document.getElementById('recurring-options').style.display = 
            expense.is_recurring ? 'block' : 'none';
    }

    /**
     * Reset expense form
     */
    resetExpenseForm() {
        document.getElementById('expense-form').reset();
        document.getElementById('expense-id').value = '';
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('expense-recurring').checked = false;
        document.getElementById('recurring-options').style.display = 'none';
        document.getElementById('receipt-preview').innerHTML = '';
    }

    /**
     * Save expense (create or update)
     */
    async saveExpense() {
        // Validate form
        if (!this.validateExpenseForm()) {
            return;
        }
        
        // Get form data
        const formData = this.getExpenseFormData();
        
        try {
            this.showLoading();
            
            if (window.WealthFlowAPI) {
                let savedExpense;
                
                if (this.editingExpenseId) {
                    // Update existing expense
                    savedExpense = await window.WealthFlowAPI.transactions.update(this.editingExpenseId, formData);
                    this.showSuccess('Expense updated successfully');
                } else {
                    // Create new expense
                    savedExpense = await window.WealthFlowAPI.transactions.create(formData);
                    this.showSuccess('Expense added successfully');
                }
                
                // Update local state
                if (window.AppState) {
                    if (this.editingExpenseId) {
                        window.AppState.updateTransaction(savedExpense);
                    } else {
                        window.AppState.addTransaction(savedExpense);
                    }
                } else {
                    // Update local array
                    const index = this.expenses.findIndex(e => e.id === savedExpense.id);
                    if (index >= 0) {
                        this.expenses[index] = savedExpense;
                    } else {
                        this.expenses.push(savedExpense);
                    }
                }
                
                // Hide form and refresh
                this.hideExpenseForm();
                this.refreshData();
                
            } else {
                // Mock save
                this.mockSaveExpense(formData);
            }
            
        } catch (error) {
            console.error('Failed to save expense:', error);
            this.showError(`Failed to save expense: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Validate expense form
     */
    validateExpenseForm() {
        const amount = document.getElementById('expense-amount').value;
        const description = document.getElementById('expense-description').value.trim();
        const category = document.getElementById('expense-category').value;
        const account = document.getElementById('expense-account').value;
        
        if (!amount || parseFloat(amount) <= 0) {
            this.showError('Please enter a valid amount');
            document.getElementById('expense-amount').focus();
            return false;
        }
        
        if (!description) {
            this.showError('Description is required');
            document.getElementById('expense-description').focus();
            return false;
        }
        
        if (!category) {
            this.showError('Category is required');
            document.getElementById('expense-category').focus();
            return false;
        }
        
        if (!account) {
            this.showError('Account is required');
            document.getElementById('expense-account').focus();
            return false;
        }
        
        return true;
    }

    /**
     * Get expense form data
     */
    getExpenseFormData() {
        const form = document.getElementById('expense-form');
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
        
        // Handle tags
        if (data.tags) {
            data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        
        // Handle boolean
        data.is_recurring = document.getElementById('expense-recurring').checked;
        
        // Handle file upload (would need separate endpoint)
        const receiptFile = document.getElementById('expense-receipt').files[0];
        if (receiptFile) {
            // In a real app, you would upload this to a storage service
            data.receipt_file = receiptFile;
        }
        
        return data;
    }

    /**
     * Edit an expense
     */
    editExpense(expenseId) {
        this.showExpenseForm(expenseId);
    }

    /**
     * Confirm delete
     */
    confirmDelete(expenseId) {
        this.deletingExpenseId = expenseId;
        document.getElementById('delete-expense-modal').classList.add('show');
    }

    /**
     * Hide delete confirmation
     */
    hideDeleteConfirm() {
        document.getElementById('delete-expense-modal').classList.remove('show');
        this.deletingExpenseId = null;
    }

    /**
     * Delete expense
     */
    async deleteExpense() {
        if (!this.deletingExpenseId) return;
        
        try {
            this.showLoading();
            
            if (window.WealthFlowAPI) {
                // Delete from API
                await window.WealthFlowAPI.transactions.delete(this.deletingExpenseId);
                
                // Update local state
                if (window.AppState) {
                    window.AppState.removeTransaction(this.deletingExpenseId);
                }
                
                // Remove from local array
                this.expenses = this.expenses.filter(e => e.id !== this.deletingExpenseId);
                
                this.showSuccess('Expense deleted successfully');
                
            } else {
                // Mock delete
                this.expenses = this.expenses.filter(e => e.id !== this.deletingExpenseId);
                this.showSuccess('Expense deleted (mock)');
            }
            
            // Hide modal and refresh
            this.hideDeleteConfirm();
            this.refreshData();
            
        } catch (error) {
            console.error('Failed to delete expense:', error);
            this.showError(`Failed to delete expense: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Export expenses
     */
    exportExpenses() {
        // Create CSV data
        const headers = ['Date', 'Description', 'Category', 'Account', 'Amount', 'Notes'];
        const rows = this.filteredExpenses.map(expense => [
            expense.date,
            expense.description,
            this.getCategoryName(expense.category_id),
            this.getAccountName(expense.account_id),
            expense.amount,
            expense.notes || ''
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
        a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('Expenses exported successfully');
    }

    /**
     * Refresh data
     */
    async refreshData() {
        try {
            await this.loadExpenses();
            await this.loadCategories();
            await this.loadAccounts();
            
            this.updateSummary();
            this.applyFilters();
            this.updateCategoryBreakdown();
            
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
     * Get category color by ID
     */
    getCategoryColor(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? (category.color || '#6b7280') : '#6b7280';
    }

    /**
     * Get account name by ID
     */
    getAccountName(accountId) {
        const account = this.accounts.find(a => a.id === accountId);
        return account ? account.name : 'Unknown Account';
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
            { id: '1', name: 'Food & Dining', type: 'expense', color: '#ef4444' },
            { id: '2', name: 'Transportation', type: 'expense', color: '#3b82f6' },
            { id: '3', name: 'Shopping', type: 'expense', color: '#8b5cf6' },
            { id: '4', name: 'Entertainment', type: 'expense', color: '#ec4899' },
            { id: '5', name: 'Bills & Utilities', type: 'expense', color: '#10b981' },
            { id: '6', name: 'Healthcare', type: 'expense', color: '#f59e0b' },
            { id: '7', name: 'Education', type: 'expense', color: '#6366f1' }
        ];
    }

    // ============================================
    // MOCK DATA FOR DEVELOPMENT
    // ============================================

    loadMockExpenses() {
        console.log('📊 Loading mock expenses for development');
        
        this.expenses = [
            {
                id: '1',
                type: 'expense',
                amount: 25.50,
                description: 'Lunch at Cafe',
                category_id: '1',
                account_id: '1',
                date: new Date().toISOString().split('T')[0],
                tags: ['food', 'lunch'],
                notes: 'Team lunch meeting'
            },
            {
                id: '2',
                type: 'expense',
                amount: 45.75,
                description: 'Gas',
                category_id: '2',
                account_id: '1',
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                tags: ['transport', 'car']
            },
            {
                id: '3',
                type: 'expense',
                amount: 120.00,
                description: 'Groceries',
                category_id: '1',
                account_id: '2',
                date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
                tags: ['food', 'groceries'],
                notes: 'Weekly grocery shopping'
            },
            {
                id: '4',
                type: 'expense',
                amount: 60.00,
                description: 'Netflix Subscription',
                category_id: '4',
                account_id: '3',
                date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
                tags: ['entertainment', 'subscription'],
                is_recurring: true,
                recurring_frequency: 'monthly'
            },
            {
                id: '5',
                type: 'expense',
                amount: 150.00,
                description: 'Electricity Bill',
                category_id: '5',
                account_id: '1',
                date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
                tags: ['bills', 'utilities']
            }
        ];
        
        // Simulate API delay
        setTimeout(() => {
            this.updateSummary();
            this.applyFilters();
            this.updateCategoryBreakdown();
        }, 500);
    }

    mockSaveExpense(formData) {
        if (this.editingExpenseId) {
            // Update existing
            const index = this.expenses.findIndex(e => e.id === this.editingExpenseId);
            if (index >= 0) {
                this.expenses[index] = {
                    ...this.expenses[index],
                    ...formData,
                    id: this.editingExpenseId
                };
            }
            this.showSuccess('Expense updated (mock)');
        } else {
            // Create new
            const newExpense = {
                ...formData,
                id: Date.now().toString(),
                date: formData.date || new Date().toISOString().split('T')[0]
            };
            this.expenses.push(newExpense);
            this.showSuccess('Expense added (mock)');
        }
        
        this.hideExpenseForm();
        this.refreshData();
    }
}

// ============================================
// INITIALIZE EXPENSES MANAGER
// ============================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.expensesManager = new ExpensesManager();
    });
} else {
    window.expensesManager = new ExpensesManager();
}

console.log('💸 Expenses Manager module loaded');
