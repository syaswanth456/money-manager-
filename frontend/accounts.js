<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#2563eb">
    <meta name="description" content="Manage Accounts - WealthFlow">
    
    <!-- PWA Meta Tags -->
    <link rel="manifest" href="/pwa/manifest.json">
    <link rel="icon" href="/pwa/icons/icon-192x192.png" type="image/png">
    <link rel="apple-touch-icon" href="/pwa/icons/icon-192x192.png">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="/css/base.css">
    <link rel="stylesheet" href="/css/layout.css">
    <link rel="stylesheet" href="/css/components.css">
    <link rel="stylesheet" href="/css/animations.css">
    <link rel="stylesheet" href="/css/responsive.css">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <title>Accounts - WealthFlow</title>
</head>
<body>
    <!-- App Container -->
    <div class="app-container">
        <!-- Loading Overlay -->
        <div class="loading-overlay" id="loading-overlay">
            <div class="loading-content">
                <div class="spinner spinner-lg"></div>
                <p class="mt-4">Loading your accounts...</p>
            </div>
        </div>

        <!-- Sidebar Navigation -->
        <aside class="sidebar" id="sidebar">
            <!-- Sidebar Header -->
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <div class="logo-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                    </div>
                    <h1 class="logo-text">WealthFlow</h1>
                </div>
                <button class="sidebar-close" id="sidebar-close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            <!-- User Profile -->
            <div class="user-profile">
                <div class="avatar avatar-lg">
                    <img src="" alt="Profile" id="user-avatar" class="avatar-img">
                    <div class="avatar-fallback" id="user-initials"></div>
                </div>
                <div class="user-info">
                    <h3 id="user-name">Loading...</h3>
                    <p id="user-email" class="text-gray-500">user@example.com</p>
                </div>
            </div>

            <!-- Main Navigation -->
            <nav class="sidebar-nav">
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="/dashboard.html" class="nav-link">
                            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li class="nav-item active">
                        <a href="/accounts.html" class="nav-link">
                            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h.01M10 16h.01M14 16h.01M18 16h.01"></path>
                            </svg>
                            <span>Accounts</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/expenses.html" class="nav-link">
                            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path>
                                <path d="M9 5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V5z"></path>
                                <line x1="9" y1="12" x2="15" y2="12"></line>
                            </svg>
                            <span>Expenses</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/income.html" class="nav-link">
                            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            <span>Income</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/transfer.html" class="nav-link">
                            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="17 1 21 5 17 9"></polyline>
                                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                                <polyline points="7 23 3 19 7 15"></polyline>
                                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                            </svg>
                            <span>Transfer</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/budgets.html" class="nav-link">
                            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 20v-6M6 20V10M18 20V4"></path>
                            </svg>
                            <span>Budgets</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/goals.html" class="nav-link">
                            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>Goals</span>
                        </a>
                    </li>
                </ul>

                <!-- Secondary Navigation -->
                <div class="sidebar-divider"></div>
                
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="/settings.html" class="nav-link">
                            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            <span>Settings</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" id="logout-btn">
                            <svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            <span>Logout</span>
                        </a>
                    </li>
                </ul>
            </nav>

            <!-- App Version -->
            <div class="sidebar-footer">
                <p class="text-xs text-gray-500">WealthFlow v1.0.0</p>
            </div>
        </aside>

        <!-- Sidebar Overlay (Mobile) -->
        <div class="sidebar-overlay" id="sidebar-overlay"></div>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Top Header -->
            <header class="top-header">
                <div class="header-left">
                    <button class="mobile-menu-toggle" id="mobile-menu-toggle">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                    <div class="header-title">
                        <h2>Accounts</h2>
                        <p class="text-gray-500 text-sm">Manage your bank accounts, wallets, and cards</p>
                    </div>
                </div>

                <div class="header-right">
                    <!-- Quick Actions -->
                    <div class="quick-actions">
                        <button class="btn btn-primary btn-sm" id="add-account-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Account
                        </button>
                    </div>

                    <!-- User Menu -->
                    <div class="user-dropdown">
                        <button class="user-menu-btn" id="user-menu-btn">
                            <div class="avatar avatar-sm">
                                <img src="" alt="Profile" id="header-avatar" class="avatar-img">
                                <div class="avatar-fallback" id="header-initials"></div>
                            </div>
                        </button>
                        <div class="user-menu" id="user-menu">
                            <!-- User menu content (same as dashboard) -->
                        </div>
                    </div>
                </div>
            </header>

            <!-- Accounts Content -->
            <div class="accounts-content">
                <!-- Total Balance Summary -->
                <div class="balance-summary">
                    <div class="card">
                        <div class="card-body">
                            <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h3 class="text-lg font-semibold mb-2">Total Balance</h3>
                                    <div class="flex items-baseline">
                                        <span class="text-3xl font-bold" id="total-balance">$0.00</span>
                                        <span class="text-sm text-gray-500 ml-2" id="balance-change">+0.0% this month</span>
                                    </div>
                                </div>
                                <div class="mt-4 md:mt-0">
                                    <div class="flex items-center space-x-4">
                                        <div class="text-center">
                                            <div class="text-sm text-gray-500">Active Accounts</div>
                                            <div class="text-xl font-semibold" id="active-accounts">0</div>
                                        </div>
                                        <div class="text-center">
                                            <div class="text-sm text-gray-500">Accounts</div>
                                            <div class="text-xl font-semibold" id="total-accounts">0</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Account Types Tabs -->
                <div class="account-tabs">
                    <div class="tabs">
                        <button class="tab active" data-type="all">All Accounts</button>
                        <button class="tab" data-type="bank">Bank Accounts</button>
                        <button class="tab" data-type="wallet">Digital Wallets</button>
                        <button class="tab" data-type="credit">Credit Cards</button>
                        <button class="tab" data-type="cash">Cash</button>
                        <button class="tab" data-type="loan">Loans</button>
                        <button class="tab" data-type="investment">Investments</button>
                    </div>
                </div>

                <!-- Accounts Grid -->
                <div class="accounts-grid">
                    <!-- Accounts will be loaded here -->
                    <div class="loading-section" id="accounts-loading">
                        <div class="skeleton-card">
                            <div class="skeleton skeleton-text" style="width: 60%;"></div>
                            <div class="skeleton skeleton-text" style="width: 40%; margin-top: 20px;"></div>
                            <div class="skeleton skeleton-text" style="width: 80%; margin-top: 10px;"></div>
                        </div>
                        <div class="skeleton-card">
                            <div class="skeleton skeleton-text" style="width: 60%;"></div>
                            <div class="skeleton skeleton-text" style="width: 40%; margin-top: 20px;"></div>
                            <div class="skeleton skeleton-text" style="width: 80%; margin-top: 10px;"></div>
                        </div>
                        <div class="skeleton-card">
                            <div class="skeleton skeleton-text" style="width: 60%;"></div>
                            <div class="skeleton skeleton-text" style="width: 40%; margin-top: 20px;"></div>
                            <div class="skeleton skeleton-text" style="width: 80%; margin-top: 10px;"></div>
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div class="empty-state" id="empty-state" style="display: none;">
                        <div class="empty-state-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                                <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h.01M10 16h.01M14 16h.01M18 16h.01"></path>
                            </svg>
                        </div>
                        <h3 class="empty-state-title">No Accounts Yet</h3>
                        <p class="empty-state-description">Add your first account to start tracking your finances</p>
                        <button class="btn btn-primary mt-4" id="add-first-account">Add Your First Account</button>
                    </div>

                    <!-- Accounts Container -->
                    <div class="accounts-container" id="accounts-container"></div>
                </div>

                <!-- Account Details Modal -->
                <div class="modal" id="account-details-modal">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-header">
                            <h3 class="modal-title" id="modal-account-name">Account Details</h3>
                            <button class="modal-close" id="close-account-modal">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="account-details-content" id="account-details-content">
                                <!-- Details will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Add/Edit Account Modal -->
                <div class="modal" id="account-form-modal">
                    <div class="modal-dialog">
                        <div class="modal-header">
                            <h3 class="modal-title" id="modal-form-title">Add New Account</h3>
                            <button class="modal-close" id="close-form-modal">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="account-form">
                                <input type="hidden" id="account-id" name="id">
                                
                                <div class="form-group">
                                    <label for="account-name">Account Name *</label>
                                    <input type="text" id="account-name" name="name" class="form-control" 
                                           placeholder="e.g., Chase Checking, PayPal, Cash" required>
                                </div>

                                <div class="form-group">
                                    <label for="account-type">Account Type *</label>
                                    <select id="account-type" name="type" class="form-control" required>
                                        <option value="">Select Type</option>
                                        <option value="bank">Bank Account</option>
                                        <option value="wallet">Digital Wallet</option>
                                        <option value="credit">Credit Card</option>
                                        <option value="cash">Cash</option>
                                        <option value="loan">Loan</option>
                                        <option value="investment">Investment</option>
                                    </select>
                                </div>

                                <!-- Bank Account Specific Fields -->
                                <div class="account-type-fields" id="bank-fields" style="display: none;">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="bank-name">Bank Name</label>
                                            <input type="text" id="bank-name" name="bank_name" class="form-control" 
                                                   placeholder="e.g., Chase, Bank of America">
                                        </div>
                                        <div class="form-group">
                                            <label for="account-number">Account Number</label>
                                            <input type="text" id="account-number" name="account_number" class="form-control" 
                                                   placeholder="Last 4 digits">
                                        </div>
                                    </div>
                                </div>

                                <!-- Credit Card Specific Fields -->
                                <div class="account-type-fields" id="credit-fields" style="display: none;">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="credit-limit">Credit Limit</label>
                                            <input type="number" id="credit-limit" name="credit_limit" class="form-control" 
                                                   placeholder="0.00" step="0.01">
                                        </div>
                                        <div class="form-group">
                                            <label for="due-date">Due Date</label>
                                            <input type="date" id="due-date" name="due_date" class="form-control">
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="card-number">Card Number</label>
                                        <input type="text" id="card-number" name="card_number" class="form-control" 
                                               placeholder="**** **** **** ****">
                                    </div>
                                </div>

                                <!-- Loan Specific Fields -->
                                <div class="account-type-fields" id="loan-fields" style="display: none;">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="loan-amount">Loan Amount</label>
                                            <input type="number" id="loan-amount" name="loan_amount" class="form-control" 
                                                   placeholder="0.00" step="0.01">
                                        </div>
                                        <div class="form-group">
                                            <label for="interest-rate">Interest Rate (%)</label>
                                            <input type="number" id="interest-rate" name="interest_rate" class="form-control" 
                                                   placeholder="0.00" step="0.01">
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="emi-amount">EMI Amount</label>
                                            <input type="number" id="emi-amount" name="emi_amount" class="form-control" 
                                                   placeholder="0.00" step="0.01">
                                        </div>
                                        <div class="form-group">
                                            <label for="emi-due-date">EMI Due Date</label>
                                            <input type="date" id="emi-due-date" name="emi_due_date" class="form-control">
                                        </div>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="initial-balance">Initial Balance *</label>
                                    <input type="number" id="initial-balance" name="balance" class="form-control" 
                                           placeholder="0.00" step="0.01" required>
                                    <small class="text-gray-500">Current balance in this account</small>
                                </div>

                                <div class="form-group">
                                    <label for="account-currency">Currency</label>
                                    <select id="account-currency" name="currency" class="form-control">
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="INR">INR (₹)</option>
                                        <option value="CAD">CAD ($)</option>
                                        <option value="AUD">AUD ($)</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="account-color">Color</label>
                                    <div class="color-picker">
                                        <input type="color" id="account-color" name="color" value="#2563eb" class="color-input">
                                        <div class="color-options">
                                            <button type="button" class="color-option" style="background-color: #2563eb;" data-color="#2563eb"></button>
                                            <button type="button" class="color-option" style="background-color: #10b981;" data-color="#10b981"></button>
                                            <button type="button" class="color-option" style="background-color: #f59e0b;" data-color="#f59e0b"></button>
                                            <button type="button" class="color-option" style="background-color: #ef4444;" data-color="#ef4444"></button>
                                            <button type="button" class="color-option" style="background-color: #8b5cf6;" data-color="#8b5cf6"></button>
                                            <button type="button" class="color-option" style="background-color: #ec4899;" data-color="#ec4899"></button>
                                        </div>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="checkbox">
                                        <input type="checkbox" id="is-active" name="is_active" checked>
                                        <span>Active Account</span>
                                    </label>
                                    <small class="text-gray-500">Inactive accounts are hidden from most views</small>
                                </div>

                                <div class="form-group">
                                    <label for="account-notes">Notes</label>
                                    <textarea id="account-notes" name="notes" class="form-control" rows="3" 
                                              placeholder="Any additional information about this account..."></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" id="cancel-form">Cancel</button>
                            <button class="btn btn-primary" id="save-account">Save Account</button>
                        </div>
                    </div>
                </div>

                <!-- Delete Confirmation Modal -->
                <div class="modal" id="delete-confirm-modal">
                    <div class="modal-dialog">
                        <div class="modal-header">
                            <h3 class="modal-title">Delete Account</h3>
                            <button class="modal-close" id="close-delete-modal">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center">
                                <div class="text-red-600 mb-4">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                </div>
                                <h4 class="text-lg font-semibold mb-2">Are you sure?</h4>
                                <p class="text-gray-600 mb-4">You are about to delete <strong id="delete-account-name"></strong>. This action cannot be undone.</p>
                                <div class="alert alert-warning">
                                    <p class="text-sm"><strong>Warning:</strong> All transactions associated with this account will also be deleted.</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" id="cancel-delete">Cancel</button>
                            <button class="btn btn-danger" id="confirm-delete">Delete Account</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <footer class="main-footer">
                <div class="container">
                    <div class="flex flex-col md:flex-row justify-between items-center">
                        <div class="text-sm text-gray-500">
                            © 2024 WealthFlow. All rights reserved.
                        </div>
                        <div class="flex items-center space-x-4 mt-2 md:mt-0">
                            <a href="/privacy.html" class="text-sm text-gray-500 hover:text-gray-700">Privacy Policy</a>
                            <a href="/terms.html" class="text-sm text-gray-500 hover:text-gray-700">Terms of Service</a>
                            <a href="/help.html" class="text-sm text-gray-500 hover:text-gray-700">Help Center</a>
                        </div>
                    </div>
                </div>
            </footer>
        </main>

        <!-- Floating Action Button (Mobile) -->
        <button class="fab" id="fab">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        </button>
    </div>

    <!-- JavaScript Files -->
    <script src="/js/auth.js" defer></script>
    <script src="/js/auth-middleware.js" defer></script>
    <script src="/js/api.js" defer></script>
    <script src="/js/state.js" defer></script>
    <script src="/js/accounts.js" defer></script>
    
    <!-- Accounts Page JavaScript -->
    <script>
        // Set current date
        document.addEventListener('DOMContentLoaded', function() {
            // Check if user is authenticated
            if (window.WealthFlowAuth && WealthFlowAuth.isAuthenticated()) {
                const user = WealthFlowAuth.getCurrentUser();
                if (user) {
                    updateUserDisplay(user);
                }
            }
        });

        function updateUserDisplay(user) {
            const name = user.name || user.email.split('@')[0];
            const email = user.email;
            
            // Set user name and email
            document.querySelectorAll('#user-name').forEach(el => {
                el.textContent = name;
            });
            
            document.querySelectorAll('#user-email').forEach(el => {
                el.textContent = email;
            });
            
            // Set initials for avatars
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
            document.querySelectorAll('.avatar-fallback').forEach(el => {
                el.textContent = initials;
            });
            
            // Try to load user photo if available
            if (user.photoURL) {
                document.querySelectorAll('.avatar-img').forEach(img => {
                    img.src = user.photoURL;
                    img.style.display = 'block';
                });
                document.querySelectorAll('.avatar-fallback').forEach(fallback => {
                    fallback.style.display = 'none';
                });
            }
        }

        // Mobile menu toggle
        document.getElementById('mobile-menu-toggle')?.addEventListener('click', function() {
            document.getElementById('sidebar').classList.add('open');
            document.getElementById('sidebar-overlay').classList.add('open');
        });

        document.getElementById('sidebar-close')?.addEventListener('click', function() {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebar-overlay').classList.remove('open');
        });

        document.getElementById('sidebar-overlay')?.addEventListener('click', function() {
            document.getElementById('sidebar').classList.remove('open');
            this.classList.remove('open');
        });

        // Logout functionality
        document.querySelectorAll('#logout-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.WealthFlowAuth) {
                    WealthFlowAuth.signOut();
                }
            });
        });

        // FAB for mobile
        document.getElementById('fab')?.addEventListener('click', function() {
            showAccountForm();
        });

        // Initialize the page
        window.addEventListener('load', function() {
            // Hide loading overlay
            setTimeout(() => {
                document.getElementById('loading-overlay').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('loading-overlay').style.display = 'none';
                }, 300);
            }, 500);
        });
    </script>
</body>
</html>
