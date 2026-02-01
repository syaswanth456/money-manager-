// Auth middleware for protected pages
async function requireAuth() {
    const auth = window.WealthFlowAuth;
    
    if (!auth) {
        console.error('Auth module not loaded');
        redirectToLogin();
        return false;
    }
    
    // Wait for auth initialization
    await new Promise(resolve => {
        const check = () => {
            if (auth.getState && !auth.getState().isLoading) {
                resolve();
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });
    
    // Check authentication
    if (!auth.isAuthenticated()) {
        console.log('🔒 Authentication required, redirecting to login');
        redirectToLogin();
        return false;
    }
    
    return true;
}

function redirectToLogin() {
    // Store current URL for redirect back after login
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/index.html' && !currentPath.includes('auth')) {
        sessionStorage.setItem('redirect_after_login', currentPath);
    }
    
    // Redirect to login
    window.location.href = '/index.html';
}

function redirectAfterLogin() {
    const redirectTo = sessionStorage.getItem('redirect_after_login');
    if (redirectTo && redirectTo !== '/index.html') {
        sessionStorage.removeItem('redirect_after_login');
        window.location.href = redirectTo;
    } else {
        window.location.href = '/dashboard.html';
    }
}

// Protect pages that require authentication
const protectedPages = ['dashboard', 'accounts', 'expenses', 'income', 'transfer', 'settings'];

if (protectedPages.some(page => window.location.pathname.includes(page))) {
    requireAuth().then(authenticated => {
        if (authenticated) {
            // Load page content
            console.log('✅ Access granted to protected page');
        }
    });
}

// Handle login redirects
if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
    const auth = window.WealthFlowAuth;
    if (auth && auth.isAuthenticated && auth.isAuthenticated()) {
        redirectAfterLogin();
    }
}

// Export functions
window.AuthMiddleware = {
    requireAuth,
    redirectToLogin,
    redirectAfterLogin
};
