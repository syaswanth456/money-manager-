-- ============================================
-- MONEY MANAGER DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (Extends Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    currency TEXT DEFAULT 'USD',
    monthly_budget DECIMAL(15,2) DEFAULT 0.00,
    notification_enabled BOOLEAN DEFAULT TRUE,
    notification_time TIME DEFAULT '09:00:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- 2. ACCOUNTS TABLE
-- ============================================
CREATE TYPE account_type AS ENUM ('bank', 'wallet', 'cash', 'credit', 'loan', 'investment');

CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type account_type NOT NULL,
    name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50),
    bank_name VARCHAR(100),
    balance DECIMAL(15,2) DEFAULT 0.00 CHECK (balance >= 0),
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    due_date DATE,
    interest_rate DECIMAL(5,2) DEFAULT 0.00,
    color VARCHAR(7) DEFAULT '#2563eb',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for faster queries
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_type ON public.accounts(type);

-- RLS Policies
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own accounts"
    ON public.accounts FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- 3. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    icon VARCHAR(50) DEFAULT 'receipt',
    color VARCHAR(7) DEFAULT '#6b7280',
    monthly_budget DECIMAL(15,2) DEFAULT 0.00,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default categories
INSERT INTO public.categories (name, type, icon, color, is_default) VALUES
    -- Income categories
    ('Salary', 'income', 'bank', '#10b981', TRUE),
    ('Freelance', 'income', 'code', '#3b82f6', TRUE),
    ('Investment', 'income', 'trending-up', '#8b5cf6', TRUE),
    ('Cashback', 'income', 'credit-card', '#f59e0b', TRUE),
    ('Gift', 'income', 'gift', '#ef4444', TRUE),
    -- Expense categories
    ('Food', 'expense', 'utensils', '#ef4444', TRUE),
    ('Transport', 'expense', 'car', '#3b82f6', TRUE),
    ('Shopping', 'expense', 'shopping-bag', '#8b5cf6', TRUE),
    ('Entertainment', 'expense', 'film', '#ec4899', TRUE),
    ('Bills', 'expense', 'file-text', '#10b981', TRUE),
    ('Healthcare', 'expense', 'heart', '#f59e0b', TRUE),
    ('Education', 'expense', 'book', '#6366f1', TRUE);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own categories"
    ON public.categories FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- 4. TRANSACTIONS TABLE
-- ============================================
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME DEFAULT CURRENT_TIME,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    next_occurrence DATE,
    receipt_url TEXT,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for faster queries
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);

-- RLS Policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own transactions"
    ON public.transactions FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- 5. BUDGETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    spent DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT valid_dates CHECK (end_date > start_date)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own budgets"
    ON public.budgets FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- 6. NOTIFICATIONS TABLE
-- ============================================
CREATE TYPE notification_type AS ENUM (
    'balance_alert',
    'bill_reminder',
    'transfer',
    'budget_warning',
    'emi_due',
    'credit_card_due',
    'system'
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for notification scheduling
CREATE INDEX idx_notifications_scheduled ON public.notifications(scheduled_for) 
    WHERE sent_at IS NULL;

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- 7. GOALS TABLE (Optional)
-- ============================================
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0.00,
    target_date DATE,
    icon VARCHAR(50) DEFAULT 'target',
    color VARCHAR(7) DEFAULT '#8b5cf6',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals"
    ON public.goals FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at 
    BEFORE UPDATE ON public.accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON public.transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at 
    BEFORE UPDATE ON public.budgets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at 
    BEFORE UPDATE ON public.goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle account balance updates on transactions
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- For income: add to account balance
    IF NEW.type = 'income' THEN
        UPDATE public.accounts 
        SET balance = balance + NEW.amount
        WHERE id = NEW.account_id;
    
    -- For expense: subtract from account balance
    ELSIF NEW.type = 'expense' THEN
        UPDATE public.accounts 
        SET balance = balance - NEW.amount
        WHERE id = NEW.account_id;
    
    -- For transfer: subtract from source, add to destination
    ELSIF NEW.type = 'transfer' AND NEW.to_account_id IS NOT NULL THEN
        -- Subtract from source account
        UPDATE public.accounts 
        SET balance = balance - NEW.amount
        WHERE id = NEW.account_id;
        
        -- Add to destination account
        UPDATE public.accounts 
        SET balance = balance + NEW.amount
        WHERE id = NEW.to_account_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_balance
    AFTER INSERT ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Function to create notification for low balance
CREATE OR REPLACE FUNCTION check_low_balance()
RETURNS TRIGGER AS $$
DECLARE
    user_currency TEXT;
    threshold DECIMAL(15,2) := 100.00; -- $100 threshold
BEGIN
    -- Get user's currency
    SELECT currency INTO user_currency 
    FROM public.users 
    WHERE id = NEW.user_id;
    
    -- If balance falls below threshold, create notification
    IF NEW.balance < threshold THEN
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            message,
            metadata
        ) VALUES (
            NEW.user_id,
            'balance_alert',
            'Low Balance Alert',
            'Your ' || NEW.name || ' account balance is ' || 
            user_currency || ' ' || NEW.balance || '. Consider adding funds.',
            jsonb_build_object('account_id', NEW.id, 'balance', NEW.balance)
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_low_balance_alert
    AFTER UPDATE OF balance ON public.accounts
    FOR EACH ROW 
    WHEN (NEW.balance < 100 AND OLD.balance >= 100)
    EXECUTE FUNCTION check_low_balance();

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Monthly summary view
CREATE OR REPLACE VIEW public.monthly_summary AS
SELECT 
    t.user_id,
    DATE_TRUNC('month', t.date) as month,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as net_flow
FROM public.transactions t
GROUP BY t.user_id, DATE_TRUNC('month', t.date);

-- Category spending view
CREATE OR REPLACE VIEW public.category_spending AS
SELECT 
    t.user_id,
    c.name as category,
    c.type,
    DATE_TRUNC('month', t.date) as month,
    COUNT(*) as transaction_count,
    SUM(t.amount) as total_amount
FROM public.transactions t
LEFT JOIN public.categories c ON t.category_id = c.id
WHERE t.type = 'expense'
GROUP BY t.user_id, c.name, c.type, DATE_TRUNC('month', t.date);

-- ============================================
-- SETUP COMPLETE MESSAGE
-- ============================================
DO $$ 
BEGIN
    RAISE NOTICE '
    ✅ DATABASE SCHEMA CREATED SUCCESSFULLY!
    
    Tables Created:
    - users          (Extends Supabase Auth)
    - accounts       (Bank, wallet, cash accounts)
    - categories     (Income/Expense categories)
    - transactions   (All financial transactions)
    - budgets        (Budget tracking)
    - notifications  (User notifications)
    - goals          (Savings goals)
    
    Features Enabled:
    - Row Level Security (RLS) on all tables
    - Automatic balance updates on transactions
    - Low balance alerts
    - Analytics views
    - Updated_at timestamps
    
    Next Steps:
    1. Enable Google OAuth in Supabase Dashboard
    2. Set up email templates for auth
    3. Configure storage for receipt uploads
    ';
END $$;
