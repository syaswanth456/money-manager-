
// ============================================
// COMMON.JS - Shared functions across pages
// ============================================

/**
 * Logout function used across multiple pages
 */
async function logout() {
    try {
        if (window.WealthFlowAuth && WealthFlowAuth.signOut) {
            await WealthFlowAuth.signOut();
        } else {
            // Fallback: clear localStorage and redirect
            localStorage.removeItem('wealthflow_token');
            localStorage.removeItem('wealthflow_user');
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Logout failed:', error);
        window.location.href = '/index.html';
    }
}

/**
 * Format currency consistently
 */
function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

/**
 * Format date consistently
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

/**
 * Show loading overlay
 */
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }
}

/**
 * Get query parameter
 */
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * Set query parameter
 */
function setQueryParam(name, value) {
    const urlParams = new URLSearchParams(window.location.search);
    if (value) {
        urlParams.set(name, value);
    } else {
        urlParams.delete(name);
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
}

/**
 * Debounce function for search inputs
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show success toast
 */
function showSuccess(message, duration = 3000) {
    if (window.AppState) {
        window.AppState.addError({
            message: message,
            type: 'success',
            autoClear: true,
            duration: duration
        });
    } else {
        // Fallback alert
        alert(message);
    }
}

/**
 * Show error toast
 */
function showError(message, duration = 5000) {
    if (window.AppState) {
        window.AppState.addError({
            message: message,
            type: 'danger',
            autoClear: true,
            duration: duration
        });
    } else {
        // Fallback alert
        alert(message);
    }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate required fields
 */
function validateRequired(fields) {
    for (const field of fields) {
        if (!field.value || field.value.trim() === '') {
            field.focus();
            return false;
        }
    }
    return true;
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Get current month and year
 */
function getCurrentMonthYear() {
    const now = new Date();
    return {
        month: now.getMonth() + 1, // 1-12
        year: now.getFullYear(),
        monthName: now.toLocaleString('default', { month: 'long' })
    };
}

/**
 * Calculate percentage
 */
function calculatePercentage(part, total) {
    if (total === 0) return 0;
    return (part / total) * 100;
}

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

/**
 * Download file
 */
function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Parse CSV string to array
 */
function parseCSV(csvText) {
    const rows = csvText.split('\n');
    return rows.map(row => {
        // Handle quoted fields with commas
        const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
        const values = [];
        let match;
        while ((match = regex.exec(row)) !== null) {
            values.push(match[1].replace(/^"|"$/g, ''));
        }
        return values;
    });
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file is image
 */
function isImageFile(filename) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    return imageExtensions.includes(ext);
}

/**
 * Delay function
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncate text
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Export for use in other modules
window.Common = {
    logout,
    formatCurrency,
    formatDate,
    formatDateForInput,
    showLoading,
    hideLoading,
    getQueryParam,
    setQueryParam,
    debounce,
    escapeHtml,
    showSuccess,
    showError,
    isValidEmail,
    validateRequired,
    formatNumber,
    getCurrentMonthYear,
    calculatePercentage,
    generateId,
    copyToClipboard,
    downloadFile,
    parseCSV,
    formatFileSize,
    isImageFile,
    delay,
    truncateText
};

// Auto-initialize common utilities
console.log('🔧 Common utilities loaded');
