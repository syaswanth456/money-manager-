[file name]: income.html
[file content begin]
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Income - WealthFlow</title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/pwa/manifest.json">
    
    <!-- CSS -->
    <link rel="stylesheet" href="/css/base.css">
    <link rel="stylesheet" href="/css/layout.css">
    <link rel="stylesheet" href="/css/components.css">
    <link rel="stylesheet" href="/css/animations.css">
    <link rel="stylesheet" href="/css/responsive.css">
    
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    
    <!-- App Configuration -->
    <script src="/js/config.js"></script>
</head>
<body>
    <!-- Loading Overlay -->
    <div id="loading-overlay" class="loading-overlay">
        <div class="spinner spinner-lg"></div>
        <p class="loading-text">Loading Income...</p>
    </div>

    <!-- Main Container -->
    <div class="app-container">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <h2>WealthFlow</h2>
                </div>
            </div>
            
            <nav class="sidebar-nav">
                <ul>
                    <li>
                        <a href="/dashboard.html">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a href="/accounts.html">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                                <path d="M16 10h2"></path>
                                <path d="M6 10h2"></path>
                                <circle cx="12" cy="10" r="1"></circle>
                            </svg>
                            <span>Accounts</span>
                        </a>
                    </li>
                    <li>
                        <a href="/expenses.html">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M12 1v22"></path>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                            <span>Expenses</span>
                        </a>
                    </li>
                    <li class="active">
                        <a href="/income.html">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="12" y1="19" x2="12" y2="5"></line>
                                <polyline points="5 12 12 5 19 12"></polyline>
                            </svg>
                            <span>Income</span>
                        </a>
                    </li>
                    <li>
                        <a href="/transfer.html">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M7 17l9.2-9.2M17 17v-5h-5"></path>
                                <circle cx="12" cy="12" r="10"></circle>
                            </svg>
                            <span>Transfer</span>
                        </a>
                    </li>
                </ul>
                
                <div class="sidebar-divider"></div>
                
                <ul>
                    <li>
                        <a href="/budgets.html">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M12 20V10"></path>
                                <path d="M18 20V4"></path>
                                <path d="M6 20v-4"></path>
                            </svg>
                            <span>Budgets</span>
                        </a>
                    </li>
                    <li>
                        <a href="/goals.html">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                            </svg>
                            <span>Goals</span>
                        </a>
                    </li>
                    <li>
                        <a href="/settings.html">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            <span>Settings</span>
                        </a>
                    </li>
                </ul>
            </nav>
            
            <div class="sidebar-footer">
                <div class="user-profile">
                    <div class="user-avatar">
                        <img id="user-avatar" src="" alt="User">
                    </div>
                    <div class="user-info">
                        <div id="user-name" class="user-name">Loading...</div>
                        <div id="user-email" class="user-email">Loading...</div>
                    </div>
                    <button class="btn btn-text btn-sm" onclick="logout()">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Header -->
            <header class="content-header">
                <div class="header-left">
                    <h1 class="page-title">Income</h1>
                    <p class="page-subtitle">Track your income and cashback rewards</p>
                </div>
                <div class="header-right">
                    <div class="header-actions">
                        <button id="add-income-btn" class="btn btn-primary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>Add Income</span>
                        </button>
                        <button id="add-cashback" class="btn btn-success">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M8 12h8"></path>
                                <path d="M12 16V8"></path>
                            </svg>
                            <span>Add Cashback</span>
                        </button>
                    </div>
                </div>
            </header>

            <!-- Income Overview Cards -->
            <section class="content-section">
                <h2 class="section-title">Income Overview</h2>
                <div class="cards-grid">
                    <div class="card">
                        <div class="card-header">
                            <div class="card-icon success">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="12" y1="19" x2="12" y2="5"></line>
                                    <polyline points="5 12 12 5 19 12"></polyline>
                                </svg>
                            </div>
                            <div class="card-title">Total Income</div>
                        </div>
                        <div class="card-body">
                            <div class="card-value" id="total-income">$0.00</div>
                            <div class="card-change positive" id="income-change">+0%</div>
                        </div>
                        <div class="card-footer">
                            <span>All-time total income</span>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div class="card-icon success">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                                </svg>
                            </div>
                            <div class="card-title">This Month</div>
                        </div>
                        <div class="card-body">
                            <div class="card-value" id="month-income">$0.00</div>
                            <div class="card-subtext">vs last month</div>
                        </div>
                        <div class="card-footer">
                            <span>Monthly income trend</span>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div class="card-icon success">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                </svg>
                            </div>
                            <div class="card-title">Avg Monthly</div>
                        </div>
                        <div class="card-body">
                            <div class="card-value" id="avg-monthly">$0.00</div>
                            <div class="card-subtext">Last 12 months</div>
                        </div>
                        <div class="card-footer">
                            <span>Average monthly income</span>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <div class="card-icon warning">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M8 12h8"></path>
                                    <path d="M12 16V8"></path>
                                </svg>
                            </div>
                            <div class="card-title">Cashback</div>
                        </div>
                        <div class="card-body">
                            <div class="card-value" id="total-cashback">$0.00</div>
                            <div class="card-subtext" id="cashback-count">0 transactions</div>
                        </div>
                        <div class="card-footer">
                            <span>Rewards & cashback</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Income Table & Filters -->
            <section class="content-section">
                <div class="section-header">
                    <h2 class="section-title">Income History</h2>
                    <div class="section-actions">
                        <div class="filters-row">
                            <div class="quick-filters">
                                <button data-filter="all" class="btn btn-outline btn-sm active">All</button>
                                <button data-filter="salary" class="btn btn-outline btn-sm">Salary</button>
                                <button data-filter="cashback" class="btn btn-outline btn-sm">Cashback</button>
                                <button data-filter="recurring" class="btn btn-outline btn-sm">Recurring</button>
                            </div>
                            
                            <div class="filter-group">
                                <input type="date" id="date-from" class="input input-sm">
                                <span>to</span>
                                <input type="date" id="date-to" class="input input-sm">
                            </div>
                            
                            <select id="income-type-select" class="select select-sm">
                                <option value="">All Types</option>
                                <option value="salary">Salary</option>
                                <option value="freelance">Freelance</option>
                                <option value="investment">Investment</option>
                                <option value="cashback">Cashback</option>
                                <option value="gift">Gift</option>
                                <option value="other">Other</option>
                            </select>
                            
                            <div class="search-box">
                                <input type="text" id="income-search" placeholder="Search income..." class="input input-sm">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            
                            <button id="export-income" class="btn btn-text btn-sm" title="Export">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                            </button>
                            
                            <button id="refresh-income" class="btn btn-text btn-sm" title="Refresh">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M23 4v6h-6"></path>
                                    <path d="M1 20v-6h6"></path>
                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th class="table-sort" data-sort="date">
                                    Date
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </th>
                                <th>Description</th>
                                <th>Type</th>
                                <th>Account</th>
                                <th class="table-sort" data-sort="amount">
                                    Amount
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="income-tbody">
                            <!-- Income rows will be inserted here -->
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="5" class="text-right">
                                    <span id="table-summary">Showing 0-0 of 0 income</span>
                                </td>
                                <td colspan="2">
                                    <strong id="table-total">$0.00</strong>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div class="table-footer">
                    <div id="income-pagination" class="pagination">
                        <!-- Pagination will be inserted here -->
                    </div>
                </div>
            </section>

            <!-- Income Analytics -->
            <div class="two-column-layout">
                <!-- Left Column: Income Sources Breakdown -->
                <div class="column">
                    <section class="content-section">
                        <div class="section-header">
                            <h2 class="section-title">Income Sources</h2>
                            <select id="breakdown-period" class="select select-sm">
                                <option value="month">This Month</option>
                                <option value="quarter">This Quarter</option>
                                <option value="year">This Year</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>
                        
                        <div class="chart-container">
                            <canvas id="income-source-chart"></canvas>
                        </div>
                        
                        <div class="chart-legend" id="income-sources-list">
                            <!-- Income sources list will be inserted here -->
                        </div>
                    </section>
                </div>
                
                <!-- Right Column: Cashback Stats -->
                <div class="column">
                    <section class="content-section">
                        <div class="section-header">
                            <h2 class="section-title">Cashback & Rewards</h2>
                            <span class="badge badge-success">Active</span>
                        </div>
                        
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-label">This Month</div>
                                <div class="stat-value text-success" id="cashback-month">$0.00</div>
                                <div class="stat-trend positive">+0%</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Last Month</div>
                                <div class="stat-value" id="cashback-last-month">$0.00</div>
                                <div class="stat-change">vs previous</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Avg Monthly</div>
                                <div class="stat-value" id="cashback-avg">$0.00</div>
                                <div class="stat-trend">6 months</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">Total</div>
                                <div class="stat-value text-success" id="cashback-total">$0.00</div>
                                <div class="stat-trend">All-time</div>
                            </div>
                        </div>
                        
                        <div class="divider"></div>
                        
                        <h3 class="subsection-title">Recent Cashback</h3>
                        <div id="recent-cashback">
                            <!-- Recent cashback list will be inserted here -->
                        </div>
                    </section>
                </div>
            </div>
        </main>
    </div>

    <!-- Income Form Modal -->
    <div id="income-form-modal" class="modal">
        <div class="modal-content modal-lg">
            <div class="modal-header">
                <h3 id="modal-income-title">Add Income</h3>
                <button id="close-income-modal" class="btn btn-text">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <div class="modal-body">
                <form id="income-form">
                    <input type="hidden" id="income-id" name="id">
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="income-amount">Amount *</label>
                            <input type="number" id="income-amount" name="amount" step="0.01" min="0.01" required 
                                   placeholder="0.00" class="input input-lg">
                        </div>
                        
                        <div class="form-group">
                            <label for="income-date">Date *</label>
                            <input type="date" id="income-date" name="date" required class="input">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="income-description">Description *</label>
                        <input type="text" id="income-description" name="description" required 
                               placeholder="Salary, Freelance work, etc." class="input">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="income-category">Category *</label>
                            <select id="income-category" name="category_id" required class="select">
                                <option value="">Select Category</option>
                                <!-- Categories will be populated by JS -->
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="income-source-type">Income Type</label>
                            <select id="income-source-type" name="source_type" class="select">
                                <option value="salary">Salary</option>
                                <option value="freelance">Freelance</option>
                                <option value="investment">Investment</option>
                                <option value="cashback">Cashback/Rewards</option>
                                <option value="gift">Gift</option>
                                <option value="refund">Refund</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="income-payer">Payer/Company (Optional)</label>
                        <input type="text" id="income-payer" name="payer" 
                               placeholder="Company name, client name, etc." class="input">
                    </div>
                    
                    <div class="form-group">
                        <label for="income-account">Destination Account *</label>
                        <select id="income-account" name="account_id" required class="select">
                            <option value="">Select Account</option>
                            <!-- Accounts will be populated by JS -->
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="checkbox">
                                <input type="checkbox" id="income-recurring" name="is_recurring">
                                <span>Recurring Income</span>
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox">
                                <input type="checkbox" id="income-taxable" name="is_taxable" checked>
                                <span>Taxable Income</span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Recurring Options (hidden by default) -->
                    <div id="recurring-income-options" class="form-group" style="display: none;">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="recurring-income-frequency">Frequency</label>
                                <select id="recurring-income-frequency" name="recurring_frequency" class="select">
                                    <option value="weekly">Weekly</option>
                                    <option value="biweekly">Bi-weekly</option>
                                    <option value="monthly" selected>Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="next-income-occurrence">Next Occurrence</label>
                                <input type="date" id="next-income-occurrence" name="next_occurrence" class="input">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tax Options (shown when taxable is checked) -->
                    <div id="tax-options" class="form-group">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="tax-amount">Tax Amount (Optional)</label>
                                <input type="number" id="tax-amount" name="tax_amount" step="0.01" min="0" 
                                       placeholder="0.00" class="input">
                            </div>
                            
                            <div class="form-group">
                                <label for="tax-rate">Tax Rate % (Optional)</label>
                                <input type="number" id="tax-rate" name="tax_rate" step="0.1" min="0" max="100" 
                                       placeholder="0.0" class="input">
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="income-notes">Notes (Optional)</label>
                        <textarea id="income-notes" name="notes" rows="3" 
                                  placeholder="Additional details..." class="textarea"></textarea>
                    </div>
                </form>
            </div>
            
            <div class="modal-footer">
                <button id="cancel-income" class="btn btn-text">Cancel</button>
                <button id="save-income" class="btn btn-primary">Save Income</button>
            </div>
        </div>
    </div>

    <!-- Cashback Form Modal -->
    <div id="cashback-form-modal" class="modal">
        <div class="modal-content modal-md">
            <div class="modal-header">
                <h3>Add Cashback</h3>
                <button id="close-cashback-modal" class="btn btn-text">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <div class="modal-body">
                <form id="cashback-form">
                    <div class="form-group">
                        <label for="cashback-amount">Amount *</label>
                        <input type="number" id="cashback-amount" name="amount" step="0.01" min="0.01" required 
                               placeholder="0.00" class="input input-lg">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="cashback-date">Date *</label>
                            <input type="date" id="cashback-date" name="date" required class="input">
                        </div>
                        
                        <div class="form-group">
                            <label for="cashback-type">Type</label>
                            <select id="cashback-type" name="cashback_type" class="select">
                                <option value="credit_card">Credit Card</option>
                                <option value="debit_card">Debit Card</option>
                                <option value="online_payment">Online Payment</option>
                                <option value="shopping">Shopping Rewards</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="cashback-source">Source *</label>
                        <input type="text" id="cashback-source" name="source" required 
                               placeholder="Bank, Store, Service, etc." class="input">
                    </div>
                    
                    <div class="form-group">
                        <label for="cashback-description">Description (Optional)</label>
                        <input type="text" id="cashback-description" name="description" 
                               placeholder="E.g., 5% cashback on dining" class="input">
                    </div>
                    
                    <div class="form-group">
                        <label for="cashback-account">Destination Account *</label>
                        <select id="cashback-account" name="account_id" required class="select">
                            <option value="">Select Account</option>
                            <!-- Accounts will be populated by JS -->
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="cashback-notes">Notes (Optional)</label>
                        <textarea id="cashback-notes" name="notes" rows="2" 
                                  placeholder="Additional details..." class="textarea"></textarea>
                    </div>
                </form>
            </div>
            
            <div class="modal-footer">
                <button id="cancel-cashback" class="btn btn-text">Cancel</button>
                <button id="save-cashback" class="btn btn-success">Save Cashback</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="delete-income-modal" class="modal">
        <div class="modal-content modal-sm">
            <div class="modal-header">
                <h3>Delete Income</h3>
                <button id="close-delete-income" class="btn btn-text">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="warning-message">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <p>Are you sure you want to delete this income record?</p>
                    <p class="text-muted">This action cannot be undone.</p>
                </div>
            </div>
            
            <div class="modal-footer">
                <button id="cancel-delete-income" class="btn btn-text">Cancel</button>
                <button id="confirm-delete-income" class="btn btn-danger">Delete</button>
            </div>
        </div>
    </div>

    <!-- JavaScript -->
    <script src="/js/auth.js"></script>
    <script src="/js/api.js"></script>
    <script src="/js/state.js"></script>
    <script src="/js/init.js"></script>
    <script src="/js/income.js"></script>
    
    <script>
        // Initialize app
        window.addEventListener('DOMContentLoaded', async () => {
            await window.AppInitializer.initialize();
            
            // Load user info
            const auth = window.WealthFlowAuth;
            if (auth && auth.isAuthenticated()) {
                const user = auth.getCurrentUser();
                if (user) {
                    document.getElementById('user-name').textContent = user.name || 'User';
                    document.getElementById('user-email').textContent = user.email || '';
                    
                    if (user.avatar_url) {
                        document.getElementById('user-avatar').src = user.avatar_url;
                    }
                }
            }
        });
        
        // Logout function
        async function logout() {
            if (window.WealthFlowAuth) {
                await WealthFlowAuth.signOut();
            }
        }
    </script>
</body>
</html>
[file content end]
