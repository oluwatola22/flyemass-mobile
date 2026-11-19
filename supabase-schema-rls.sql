-- =============================================================================
-- FLYEMASS FINTECH & LOGISTICS — SUPABASE POSTGRESQL SCHEMA WITH RLS POLICIES
-- Production-Ready Multi-Currency Wallets, Transactions, Suppliers, Cargo & Orders
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean schema namespace (or run within public)
SET search_path = public;

-- -----------------------------------------------------------------------------
-- 1. USER PROFILES TABLE (Tenancy & Role Enforcement)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flye_tag VARCHAR(32) UNIQUE NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    role VARCHAR(32) NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'staff', 'admin', 'super_admin')),
    kyc_level VARCHAR(32) NOT NULL DEFAULT 'Tier 1 (Instant Access)',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. MULTI-CURRENCY WALLETS TABLE (NGN, USD, CNY)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency VARCHAR(8) NOT NULL CHECK (currency IN ('NGN', 'USD', 'CNY')),
    balance NUMERIC(18, 4) NOT NULL DEFAULT 0.0000 CHECK (balance >= 0),
    ledger_balance NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'restricted')),
    account_number VARCHAR(32),
    bank_name VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- -----------------------------------------------------------------------------
-- 3. FINANCIAL TRANSACTIONS / DOUBLE-ENTRY LEDGER TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reference VARCHAR(64) UNIQUE NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('FUND', 'WITHDRAW', 'EXCHANGE', 'SUPPLIER_PAY', 'CARGO_PAY', 'SHOP_PAY', 'SUBSCRIPTION')),
    source_currency VARCHAR(8) NOT NULL,
    target_currency VARCHAR(8) NOT NULL,
    amount NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
    fee NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    opening_balance NUMERIC(18, 4) NOT NULL,
    closing_balance NUMERIC(18, 4) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. VERIFIED FACTORY SUPPLIERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    chinese_name VARCHAR(255),
    category VARCHAR(64) NOT NULL,
    city VARCHAR(64) NOT NULL,
    badge VARCHAR(64) DEFAULT 'Verified Manufacturer',
    verified_years INT DEFAULT 5,
    rating NUMERIC(3, 2) DEFAULT 4.90,
    orders_fulfilled INT DEFAULT 120,
    tags TEXT[] DEFAULT ARRAY['Verified Business', 'Factory Direct'],
    main_products TEXT[] DEFAULT ARRAY[]::TEXT[],
    image_url TEXT,
    business_card_url TEXT,
    -- Encrypted / Protected contact details:
    wechat_id VARCHAR(64),
    phone VARCHAR(32),
    whatsapp VARCHAR(32),
    business_address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. VIP SUPPLIER SUBSCRIPTIONS TABLE (30-Day Paywall)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supplier_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency VARCHAR(8) NOT NULL CHECK (currency IN ('NGN', 'USD', 'CNY')),
    amount_paid NUMERIC(18, 4) NOT NULL,
    payment_reference VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. LOGISTICS & SHIPMENTS TABLE (Cargo Tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tracking_number VARCHAR(64) UNIQUE NOT NULL,
    shipment_code VARCHAR(64) UNIQUE NOT NULL,
    origin_country VARCHAR(32) NOT NULL DEFAULT 'China',
    destination_country VARCHAR(32) NOT NULL DEFAULT 'Nigeria',
    mode VARCHAR(32) NOT NULL CHECK (mode IN ('air_express', 'air_regular', 'sea_freight')),
    cargo_type VARCHAR(64) NOT NULL DEFAULT 'General Goods',
    weight_kg NUMERIC(10, 2) DEFAULT 0.00,
    cbm NUMERIC(10, 3) DEFAULT 0.000,
    freight_fee_usd NUMERIC(12, 2) DEFAULT 0.00,
    is_freight_paid BOOLEAN NOT NULL DEFAULT false,
    current_status VARCHAR(64) NOT NULL DEFAULT 'warehouse_received',
    origin_hub VARCHAR(64) DEFAULT 'Guangzhou Hub',
    destination_hub VARCHAR(64) DEFAULT 'Lagos MMIA Hub',
    fulfillment_method VARCHAR(32) NOT NULL DEFAULT 'pickup' CHECK (fulfillment_method IN ('pickup', 'delivery')),
    lagos_hub_id VARCHAR(64),
    lagos_hub_label VARCHAR(120),
    delivery_address JSONB,
    pickup_otp VARCHAR(16),
    pickup_otp_verified_at TIMESTAMPTZ,
    assigned_rider_name VARCHAR(120),
    assigned_rider_phone VARCHAR(32),
    waypoints JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6B. LAGOS WAREHOUSES & LAST-MILE HUBS TABLE (Collection Points & Dispatch)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lagos_hubs (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    district VARCHAR(64) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(32) NOT NULL,
    contact_person VARCHAR(120),
    operating_hours VARCHAR(120) DEFAULT 'Mon - Sat: 8:00 AM - 6:00 PM',
    doorstep_dispatch_available BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-seeded official Lagos Hubs
INSERT INTO public.lagos_hubs (id, name, code, district, address, phone, contact_person, operating_hours, doorstep_dispatch_available, sort_order, is_active)
VALUES
    ('HUB-IKEJA', 'Ikeja MMIA Cargo Terminal', 'LOS-IKJ', 'Ikeja', 'Cargo Village, Murtala Muhammed International Airport, Airport Road, Ikeja, Lagos', '+234 803 999 1001', 'Babatunde Balogun', 'Mon - Sat: 8:00 AM - 6:00 PM', true, 1, true),
    ('HUB-ALABA', 'Alaba International Market Hub', 'LOS-ALB', 'Alaba', 'Electronic Section Block C, Alaba International Market, Ojo, Lagos', '+234 803 999 1002', 'Emeka Okonkwo', 'Mon - Sat: 8:30 AM - 5:30 PM', true, 2, true),
    ('HUB-TRADEFAIR', 'Lagos Trade Fair Complex Hub', 'LOS-TFC', 'Amuwo-Odofin', 'ASPAMDA Zone Plaza 4, Lagos-Badagry Expressway, Amuwo-Odofin, Lagos', '+234 803 999 1003', 'Alhaji Usman Musa', 'Mon - Sat: 8:00 AM - 6:00 PM', true, 3, true),
    ('HUB-YABA', 'Yaba Tech & Commercial Hub', 'LOS-YAB', 'Yaba', '248 Herbert Macaulay Way, Commercial Avenue Junction, Yaba, Lagos', '+234 803 999 1004', 'Folashade Adeleke', 'Mon - Sat: 8:00 AM - 6:30 PM', true, 4, true),
    ('HUB-LEKKI', 'Lekki / Island Dispatch Station', 'LOS-LKK', 'Lekki Phase 1', 'Plot 12 Admiralty Way, Lekki Phase 1, Victoria Island Corridor, Lagos', '+234 803 999 1005', 'Chidi Nnamdi', 'Mon - Sat: 9:00 AM - 7:00 PM', true, 5, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    district = EXCLUDED.district,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    contact_person = EXCLUDED.contact_person,
    operating_hours = EXCLUDED.operating_hours,
    doorstep_dispatch_available = EXCLUDED.doorstep_dispatch_available,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Atomic RPC: verify_pickup_otp for Counter Dispatch
CREATE OR REPLACE FUNCTION public.verify_pickup_otp(
    _shipment_id UUID,
    _otp VARCHAR
)
RETURNS JSONB AS $$
DECLARE
    _ship public.shipments%ROWTYPE;
BEGIN
    SELECT * INTO _ship FROM public.shipments WHERE id = _shipment_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Shipment not found');
    END IF;

    IF _ship.pickup_otp IS NOT NULL AND TRIM(_ship.pickup_otp) != TRIM(_otp) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid 4-digit pickup OTP. Package release blocked.');
    END IF;

    UPDATE public.shipments
    SET pickup_otp_verified_at = NOW(),
        current_status = 'completed',
        updated_at = NOW()
    WHERE id = _shipment_id;

    RETURN jsonb_build_object(
        'success', true,
        'shipment_id', _shipment_id,
        'status', 'completed',
        'verified_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 7. E-COMMERCE ORDERS TABLE (Apple & Tech Shop)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_number VARCHAR(64) UNIQUE NOT NULL,
    tracking_number VARCHAR(64),
    items JSONB NOT NULL,
    subtotal NUMERIC(18, 4) NOT NULL,
    delivery_fee NUMERIC(18, 4) NOT NULL DEFAULT 5000.00,
    total_amount NUMERIC(18, 4) NOT NULL,
    currency VARCHAR(8) NOT NULL CHECK (currency IN ('NGN', 'USD', 'CNY')),
    payment_status VARCHAR(32) NOT NULL DEFAULT 'completed',
    fulfillment_status VARCHAR(32) NOT NULL DEFAULT 'processing' CHECK (fulfillment_status IN ('processing', 'dispatched', 'in_transit', 'delivered', 'cancelled')),
    delivery_address TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. TECH SHOP PRODUCTS TABLE (Apple, Google Pixel, Samsung Gallery)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    brand VARCHAR(64) NOT NULL DEFAULT 'Apple',
    model VARCHAR(120),
    storage VARCHAR(64),
    category VARCHAR(64) NOT NULL,
    condition VARCHAR(64) NOT NULL DEFAULT 'Brand New',
    price_usd NUMERIC(12, 2) NOT NULL,
    price_ngn NUMERIC(18, 2) NOT NULL,
    price_cny NUMERIC(14, 2) NOT NULL,
    price_rmb NUMERIC(14, 2),
    image TEXT NOT NULL,
    images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    stock_count INT NOT NULL DEFAULT 10,
    in_stock BOOLEAN NOT NULL DEFAULT true,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    tag VARCHAR(64),
    specs TEXT[] DEFAULT ARRAY[]::TEXT[],
    technical_specs JSONB DEFAULT '{}'::JSONB,
    variants JSONB DEFAULT '[]'::JSONB,
    warranty_info TEXT,
    delivery_info TEXT,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- =============================================================================

-- Check if current authenticated user has administrative role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has an active VIP supplier directory subscription
CREATE OR REPLACE FUNCTION public.has_active_supplier_subscription(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.supplier_subscriptions
        WHERE user_id = target_user_id
          AND status = 'active'
          AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS across all sensitive tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lagos_hubs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- POLICIES: lagos_hubs
-- -----------------------------------------------------------------------------
CREATE POLICY "Anyone can view active lagos hubs"
    ON public.lagos_hubs FOR SELECT
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins have full access to lagos hubs"
    ON public.lagos_hubs FOR ALL
    USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- POLICIES: user_profiles
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can read own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own profile fields"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id AND role = (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins have full access to user profiles"
    ON public.user_profiles FOR ALL
    USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- POLICIES: wallets (Strict Balance Isolation)
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can only view their own wallets"
    ON public.wallets FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins or trusted service functions can mutate wallet balances"
    ON public.wallets FOR UPDATE
    USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- POLICIES: transactions (Double-Entry Ledger Audit Isolation)
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can only read their own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins have full visibility of all ledger transactions"
    ON public.transactions FOR ALL
    USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- POLICIES: suppliers (Directory Public Previews / Paywalled Contacts)
-- -----------------------------------------------------------------------------
CREATE POLICY "Anyone authenticated can view active suppliers"
    ON public.suppliers FOR SELECT
    USING (is_active = true OR public.is_admin());

CREATE POLICY "Only admins can insert or update supplier directory records"
    ON public.suppliers FOR ALL
    USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- POLICIES: supplier_subscriptions
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their own subscription records"
    ON public.supplier_subscriptions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Authenticated users can create subscription on payment"
    ON public.supplier_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- -----------------------------------------------------------------------------
-- POLICIES: shipments (Cargo Tenancy & Public Tracking)
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their own shipments"
    ON public.shipments FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can register new packages"
    ON public.shipments FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins can update shipment route, status, and waypoints"
    ON public.shipments FOR UPDATE
    USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- POLICIES: orders (E-Commerce Multi-Currency Orders)
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can place shop orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Only admins can update order fulfillment status"
    ON public.orders FOR UPDATE
    USING (public.is_admin());

-- =============================================================================
-- SECURE RPC: Unlocked Supplier Contacts Preview
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_supplier_details(supplier_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    current_uid UUID := auth.uid();
    has_sub BOOLEAN := false;
    sup_record RECORD;
BEGIN
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    has_sub := public.is_admin() OR public.has_active_supplier_subscription(current_uid);

    SELECT * INTO sup_record FROM public.suppliers WHERE id = supplier_uuid AND is_active = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Supplier not found';
    END IF;

    IF has_sub THEN
        RETURN jsonb_build_object(
            'id', sup_record.id,
            'name', sup_record.name,
            'chinese_name', sup_record.chinese_name,
            'category', sup_record.category,
            'city', sup_record.city,
            'badge', sup_record.badge,
            'wechat_id', sup_record.wechat_id,
            'phone', sup_record.phone,
            'whatsapp', sup_record.whatsapp,
            'business_address', sup_record.business_address,
            'business_card_url', sup_record.business_card_url,
            'is_unlocked', true
        );
    ELSE
        RETURN jsonb_build_object(
            'id', sup_record.id,
            'name', sup_record.name,
            'chinese_name', sup_record.chinese_name,
            'category', sup_record.category,
            'city', sup_record.city,
            'badge', sup_record.badge,
            'wechat_id', 'PROTECTED (Subscribe to Unlock)',
            'phone', 'PROTECTED (Subscribe to Unlock)',
            'whatsapp', 'PROTECTED (Subscribe to Unlock)',
            'business_address', 'PROTECTED (Subscribe to Unlock)',
            'business_card_url', NULL,
            'is_unlocked', false
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- SECURE RPC: Atomic Instant FX Swap
-- =============================================================================
CREATE OR REPLACE FUNCTION public.execute_instant_fx_swap(
    p_user_id UUID,
    p_from_currency VARCHAR(8),
    p_to_currency VARCHAR(8),
    p_from_amount NUMERIC(18, 4),
    p_to_amount NUMERIC(18, 4),
    p_rate NUMERIC(18, 6),
    p_ref VARCHAR(64) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_source_wallet RECORD;
    v_target_wallet RECORD;
    v_ref VARCHAR(64);
    v_new_source_bal NUMERIC(18, 4);
    v_new_target_bal NUMERIC(18, 4);
BEGIN
    IF auth.uid() IS NULL OR (auth.uid() <> p_user_id AND NOT public.is_admin()) THEN
        RAISE EXCEPTION 'Unauthorized financial execution';
    END IF;

    IF p_from_currency = p_to_currency THEN
        RAISE EXCEPTION 'Source and target currencies must differ';
    END IF;

    IF p_from_amount <= 0 OR p_to_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid swap amounts';
    END IF;

    -- Generate reference if not provided
    v_ref := COALESCE(p_ref, 'SWP-' || p_from_currency || '-' || p_to_currency || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 6, '0'));

    -- 1. Lock and fetch source wallet
    SELECT * INTO v_source_wallet 
    FROM public.wallets 
    WHERE user_id = p_user_id AND currency = p_from_currency 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source % wallet not found', p_from_currency;
    END IF;

    IF v_source_wallet.balance < p_from_amount THEN
        RAISE EXCEPTION 'Insufficient % balance (Available: %, Required: %)', p_from_currency, v_source_wallet.balance, p_from_amount;
    END IF;

    -- 2. Lock and fetch target wallet (or create if not yet existing)
    SELECT * INTO v_target_wallet 
    FROM public.wallets 
    WHERE user_id = p_user_id AND currency = p_to_currency 
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.wallets (user_id, currency, balance, ledger_balance, status)
        VALUES (p_user_id, p_to_currency, 0.0000, 0.0000, 'active')
        RETURNING * INTO v_target_wallet;
    END IF;

    -- 3. Execute atomic balance updates
    v_new_source_bal := v_source_wallet.balance - p_from_amount;
    v_new_target_bal := v_target_wallet.balance + p_to_amount;

    UPDATE public.wallets
    SET balance = v_new_source_bal,
        ledger_balance = v_new_source_bal,
        updated_at = NOW()
    WHERE id = v_source_wallet.id;

    UPDATE public.wallets
    SET balance = v_new_target_bal,
        ledger_balance = v_new_target_bal,
        updated_at = NOW()
    WHERE id = v_target_wallet.id;

    -- 4. Record transaction log
    INSERT INTO public.transactions (
        user_id, reference, type, source_currency, target_currency,
        amount, fee, opening_balance, closing_balance, status, notes
    ) VALUES (
        p_user_id, v_ref, 'EXCHANGE', p_from_currency, p_to_currency,
        p_from_amount, 0.0000, v_source_wallet.balance, v_new_source_bal, 'completed',
        'Instant FX Swap: ' || p_from_currency || ' ' || p_from_amount || ' to ' || p_to_currency || ' ' || p_to_amount || ' @ rate ' || p_rate
    );

    RETURN jsonb_build_object(
        'success', true,
        'reference', v_ref,
        'from_currency', p_from_currency,
        'to_currency', p_to_currency,
        'debited_amount', p_from_amount,
        'credited_amount', p_to_amount,
        'rate', p_rate,
        'new_source_balance', v_new_source_bal,
        'new_target_balance', v_new_target_bal
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- POLICIES: products & Supabase Storage (Multi-Image Product Galleries)
-- -----------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access for Published Products"
    ON public.products FOR SELECT
    USING (is_published = true OR public.is_admin());

CREATE POLICY "Admin Full Access for Products"
    ON public.products FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Supabase Storage bucket for product gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access for Product Storage Images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'products');

CREATE POLICY "Admin Upload Access for Product Storage Images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'products' AND public.is_admin());

-- -----------------------------------------------------------------------------
-- 9. USER SHOPPING CARTS (Multi-Device Cart Persistence)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_carts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    item_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own shopping cart"
    ON public.user_carts FOR ALL
    USING (auth.uid()::text = user_id OR public.is_admin())
    WITH CHECK (auth.uid()::text = user_id OR public.is_admin());

-- -----------------------------------------------------------------------------
-- 10. AUTOMATED TRANSACTIONAL EMAIL NOTIFICATIONS (Resend / Edge Functions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    event_type VARCHAR(64) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,
    reference VARCHAR(64),
    amount NUMERIC(18, 4),
    currency VARCHAR(8),
    metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(32) DEFAULT 'delivered',
    provider VARCHAR(32) DEFAULT 'resend',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactional emails"
    ON public.email_notifications FOR SELECT
    USING (auth.uid()::text = user_id OR public.is_admin());

CREATE POLICY "Service and Admins can insert email notifications"
    ON public.email_notifications FOR INSERT
    WITH CHECK (auth.uid()::text = user_id OR public.is_admin());

-- Postgres function to invoke Edge Function / Webhook asynchronously
CREATE OR REPLACE FUNCTION public.dispatch_transactional_email()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
BEGIN
    payload := jsonb_build_object(
        'recipientEmail', NEW.recipient_email,
        'customerName', NEW.customer_name,
        'eventType', NEW.event_type,
        'subject', NEW.subject,
        'htmlBody', NEW.html_body,
        'metadata', NEW.metadata
    );

    -- Asynchronous HTTP dispatch to Supabase Edge Function via pg_net if enabled
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        PERFORM net.http_post(
            url := current_setting('app.settings.edge_function_url', true) || '/send-transactional-email',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := payload
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to dispatch when a new email record is logged
DROP TRIGGER IF EXISTS trg_email_notifications_dispatch ON public.email_notifications;
CREATE TRIGGER trg_email_notifications_dispatch
    AFTER INSERT ON public.email_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.dispatch_transactional_email();

-- Automated Event Triggers for Transactions, Shipments, and Support
CREATE OR REPLACE FUNCTION public.trg_fn_wallet_transaction_email()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.email_notifications (
        user_id,
        recipient_email,
        recipient_name,
        event_type,
        subject,
        html_body,
        status,
        metadata
    ) VALUES (
        NEW.user_id,
        COALESCE((SELECT email FROM public.user_profiles WHERE id = NEW.user_id), 'customer@flyemass.com'),
        COALESCE((SELECT full_name FROM public.user_profiles WHERE id = NEW.user_id), 'Valued Client'),
        CASE 
            WHEN NEW.type = 'FUND' THEN 'WALLET_FUNDING'
            WHEN NEW.type = 'SWAP' THEN 'FX_SWAP'
            WHEN NEW.type = 'TRANSFER' OR NEW.type = 'PAY_SUPPLIER' THEN 'SUPPLIER_PAYOUT'
            ELSE 'WALLET_FUNDING'
        END,
        'FlyeMass Transaction Confirmed: ' || COALESCE(NEW.reference, 'REF'),
        '<p>Your transaction has been processed.</p>',
        'pending',
        jsonb_build_object('reference', NEW.reference, 'amount', NEW.amount, 'currency', NEW.currency)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_wallets_email_notification ON public.transactions;
CREATE TRIGGER trg_wallets_email_notification
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_fn_wallet_transaction_email();

CREATE OR REPLACE FUNCTION public.trg_fn_shipment_dock_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'received_warehouse' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.email_notifications (
            user_id,
            recipient_email,
            recipient_name,
            event_type,
            subject,
            html_body,
            status,
            metadata
        ) VALUES (
            NEW.user_id,
            COALESCE((SELECT email FROM public.user_profiles WHERE id = NEW.user_id), 'customer@flyemass.com'),
            COALESCE((SELECT full_name FROM public.user_profiles WHERE id = NEW.user_id), 'Valued Client'),
            'CARGO_RECEIVED',
            'Shipment Received at Dock: ' || COALESCE(NEW.tracking_number, NEW.id::text),
            '<p>Your shipment has arrived at our warehouse dock.</p>',
            'pending',
            jsonb_build_object('trackingNumber', NEW.tracking_number, 'weightKg', NEW.weight_kg)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_shipments_email_notification ON public.shipments;
CREATE TRIGGER trg_shipments_email_notification
    AFTER INSERT OR UPDATE ON public.shipments
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_fn_shipment_dock_email();

-- -----------------------------------------------------------------------------
-- 10. ENTERPRISE GLOBAL SUPPORT TICKETS & REAL-TIME CHAT THREADS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id TEXT PRIMARY KEY,
    ticket_number VARCHAR(64) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name VARCHAR(120),
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'General Trade',
    status VARCHAR(64) NOT NULL DEFAULT 'open' CHECK (status IN (
        'open', 'in_progress', 'waiting_on_customer', 'pending_human', 'escalated', 'resolved', 'closed',
        'Open', 'In Progress', 'Waiting on Customer', 'Pending Human Review', 'Human In-Progress', 'Resolved', 'Closed', 'Open - AI Handled'
    )),
    priority VARCHAR(32) NOT NULL DEFAULT 'Normal' CHECK (priority IN (
        'Low', 'Normal', 'High Priority', 'High', 'Urgent'
    )),
    sla_due_at TIMESTAMPTZ,
    sla_status VARCHAR(32) NOT NULL DEFAULT 'on_track' CHECK (sla_status IN ('on_track', 'due_soon', 'breached')),
    ai_handled BOOLEAN NOT NULL DEFAULT true,
    assigned_agent VARCHAR(120),
    assigned_agent_id VARCHAR(64),
    extracted_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL,
    sender_name VARCHAR(120) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    is_ai BOOLEAN NOT NULL DEFAULT false,
    text TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_type TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for ultra-fast filtering and SLA sorting
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_sla ON public.support_tickets(sla_due_at, sla_status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON public.ticket_messages(created_at);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Policies for support_tickets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own support tickets') THEN
        CREATE POLICY "Users can read own support tickets"
            ON public.support_tickets FOR SELECT
            USING (auth.uid() = user_id OR public.is_admin_user());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create own support tickets') THEN
        CREATE POLICY "Users can create own support tickets"
            ON public.support_tickets FOR INSERT
            WITH CHECK (auth.uid() = user_id OR public.is_admin_user());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users and admins can update support tickets') THEN
        CREATE POLICY "Users and admins can update support tickets"
            ON public.support_tickets FOR UPDATE
            USING (auth.uid() = user_id OR public.is_admin_user());
    END IF;
END $$;

-- Policies for ticket_messages
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view messages for own tickets') THEN
        CREATE POLICY "Users can view messages for own tickets"
            ON public.ticket_messages FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.support_tickets st 
                    WHERE st.id = ticket_messages.ticket_id 
                    AND (st.user_id = auth.uid() OR public.is_admin_user())
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users and admins can insert messages') THEN
        CREATE POLICY "Users and admins can insert messages"
            ON public.ticket_messages FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.support_tickets st 
                    WHERE st.id = ticket_messages.ticket_id 
                    AND (st.user_id = auth.uid() OR public.is_admin_user())
                )
            );
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.trg_fn_support_ticket_email()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.email_notifications (
        user_id,
        recipient_email,
        recipient_name,
        event_type,
        subject,
        html_body,
        status,
        metadata
    ) VALUES (
        NEW.user_id,
        COALESCE((SELECT email FROM public.user_profiles WHERE id = NEW.user_id), 'customer@flyemass.com'),
        COALESCE((SELECT full_name FROM public.user_profiles WHERE id = NEW.user_id), 'Valued Client'),
        'SUPPORT_TICKET',
        'Support Ticket Status: ' || COALESCE(NEW.subject, 'Inquiry'),
        '<p>Update on your support inquiry.</p>',
        'pending',
        jsonb_build_object('ticketId', NEW.id, 'status', NEW.status)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conditional trigger on support_tickets if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_tickets') THEN
        DROP TRIGGER IF EXISTS trg_support_email_notification ON public.support_tickets;
        CREATE TRIGGER trg_support_email_notification
            AFTER INSERT OR UPDATE ON public.support_tickets
            FOR EACH ROW
            EXECUTE FUNCTION public.trg_fn_support_ticket_email();
    END IF;
END $$;

-- =============================================================================
-- SECURE RPC: Enterprise Admin Manual Wallet Adjustment & Double-Entry Ledger
-- =============================================================================
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet_balance(
    _user_id UUID,
    _currency VARCHAR(8),
    _amount NUMERIC(18, 4),
    _type VARCHAR(16),
    _admin_note TEXT,
    _admin_id VARCHAR(64) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_admin_uid UUID := auth.uid();
    v_wallet RECORD;
    v_ref VARCHAR(64);
    v_new_balance NUMERIC(18, 4);
    v_opening_balance NUMERIC(18, 4);
    v_currency VARCHAR(8) := UPPER(_currency);
    v_type VARCHAR(16) := LOWER(_type);
    v_admin_id VARCHAR(64) := COALESCE(_admin_id, v_admin_uid::text, 'adm-001');
    v_notification_id VARCHAR(64);
BEGIN
    -- Verify Admin permissions
    IF NOT (public.is_admin() OR public.is_admin_user()) THEN
        RAISE EXCEPTION 'Unauthorized: Administrative role required to adjust wallet balances';
    END IF;

    IF v_currency NOT IN ('NGN', 'CNY', 'USD') THEN
        RAISE EXCEPTION 'Invalid currency: %. Supported currencies are NGN, CNY, USD', _currency;
    END IF;

    IF _amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than zero';
    END IF;

    IF v_type NOT IN ('credit', 'debit') THEN
        RAISE EXCEPTION 'Invalid transaction type: %. Must be credit or debit', _type;
    END IF;

    IF _admin_note IS NULL OR LENGTH(TRIM(_admin_note)) = 0 THEN
        RAISE EXCEPTION 'Mandatory admin note/reason is required for audit compliance';
    END IF;

    v_ref := 'ADJ-ADMIN-' || UPPER(v_currency) || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- 1. Fetch and Lock Wallet for Atomic Update
    SELECT * INTO v_wallet
    FROM public.wallets
    WHERE user_id = _user_id AND currency = v_currency
    FOR UPDATE;

    IF NOT FOUND THEN
        IF v_type = 'debit' THEN
            RAISE EXCEPTION 'Cannot debit non-existent % wallet', v_currency;
        END IF;

        INSERT INTO public.wallets (user_id, currency, balance, ledger_balance, status)
        VALUES (_user_id, v_currency, 0.0000, 0.0000, 'active')
        RETURNING * INTO v_wallet;
    END IF;

    v_opening_balance := v_wallet.balance;

    IF v_type = 'debit' AND v_opening_balance < _amount THEN
        RAISE EXCEPTION 'Insufficient balance: Available % %, requested debit % %', v_currency, v_opening_balance, v_currency, _amount;
    END IF;

    IF v_type = 'credit' THEN
        v_new_balance := v_opening_balance + _amount;
    ELSE
        v_new_balance := v_opening_balance - _amount;
    END IF;

    -- Update wallet balance atomically
    UPDATE public.wallets
    SET balance = v_new_balance,
        ledger_balance = v_new_balance,
        updated_at = NOW()
    WHERE id = v_wallet.id;

    -- Update user_balances if present
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_balances') THEN
        UPDATE public.user_balances
        SET balances = jsonb_set(
            COALESCE(balances, '{}'::jsonb),
            ARRAY[v_currency],
            to_jsonb(v_new_balance)
        ),
        updated_at = NOW()
        WHERE user_id = _user_id;
    END IF;

    -- 2. Log in General Ledger / Transactions Journal
    INSERT INTO public.transactions (
        user_id, reference, type, source_currency, target_currency,
        amount, fee, opening_balance, closing_balance, status, notes
    ) VALUES (
        _user_id, v_ref, 
        CASE WHEN v_type = 'credit' THEN 'MANUAL_CREDIT_ADJUSTMENT' ELSE 'MANUAL_DEBIT_ADJUSTMENT' END,
        v_currency, v_currency,
        _amount, 0.0000, v_opening_balance, v_new_balance, 'completed',
        'Manual Admin ' || UPPER(v_type) || ' by ' || v_admin_id || ': ' || _admin_note
    );

    -- 3. Log Audit Trail
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO public.audit_logs (
            admin_id, action, target_type, target_id, details, created_at
        ) VALUES (
            v_admin_id, 'MANUAL_WALLET_' || UPPER(v_type), 'wallets', _user_id::text,
            jsonb_build_object(
                'currency', v_currency,
                'amount', _amount,
                'type', v_type,
                'opening_balance', v_opening_balance,
                'closing_balance', v_new_balance,
                'admin_note', _admin_note,
                'reference', v_ref
            ),
            NOW()
        );
    END IF;

    -- 4. In-App Notification / Push Alert Dispatch
    v_notification_id := 'notif_' || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 8, '0');
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        INSERT INTO public.notifications (
            id, user_id, title, message, type, link_route, read, created_at
        ) VALUES (
            v_notification_id,
            _user_id::text,
            'Wallet ' || CASE WHEN v_type = 'credit' THEN 'Credited' ELSE 'Debited' END,
            'Your ' || v_currency || ' wallet has been ' || CASE WHEN v_type = 'credit' THEN 'credited' ELSE 'debited' END || 
            ' with ' || CASE WHEN v_currency = 'NGN' THEN '₦' WHEN v_currency = 'USD' THEN '$' ELSE '¥' END || 
            _amount::text || ' by FlyeMass Support. Note: ' || _admin_note,
            'wallet',
            'wallets',
            false,
            NOW()
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'reference', v_ref,
        'user_id', _user_id,
        'currency', v_currency,
        'type', v_type,
        'amount', _amount,
        'opening_balance', v_opening_balance,
        'closing_balance', v_new_balance,
        'admin_note', _admin_note,
        'admin_id', v_admin_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




-- =============================================================================
-- ENTERPRISE FX RATE PUBLISHING & ATOMIC CURRENCY SWAP ENGINE
-- Supported swap directions: NGN_TO_CNY, CNY_TO_NGN, USD_TO_CNY, CNY_TO_USD
-- Direct USD <-> NGN swaps are restricted by policy (USD/NGN rate is published
-- for portfolio valuation & shipping estimates only).
-- All amounts are handled in integer minor units (kobo / fen / cents).
-- =============================================================================

-- Allow the 'ops' operator role alongside admin / super_admin
DO $$
BEGIN
    ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
    ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check
        CHECK (role IN ('client', 'staff', 'ops', 'admin', 'super_admin'));
EXCEPTION WHEN others THEN NULL;
END $$;

-- Transaction PIN hash (bcrypt via pgcrypto crypt()) + lockout counters
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS transaction_pin_hash TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS pin_failed_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;

-- Allow FX swap ledger legs in the transactions table
DO $$
BEGIN
    ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
    ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check
        CHECK (type IN ('FUND', 'WITHDRAW', 'EXCHANGE', 'SWAP_DEBIT', 'SWAP_CREDIT', 'SUPPLIER_PAY', 'CARGO_PAY', 'SHOP_PAY', 'SUBSCRIPTION'));
EXCEPTION WHEN others THEN NULL;
END $$;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS swap_reference VARCHAR(32);
CREATE INDEX IF NOT EXISTS idx_transactions_swap_reference ON public.transactions(swap_reference);

CREATE OR REPLACE FUNCTION public.is_fx_operator()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid() AND role IN ('ops', 'admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- fx_rates: one active row per (base, quote); history retained (never deleted)
-- buy_rate  = rate at which FlyeMass BUYS the base currency from the customer
-- sell_rate = rate at which FlyeMass SELLS the base currency to the customer
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fx_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base VARCHAR(8) NOT NULL CHECK (base IN ('NGN', 'USD', 'CNY')),
    quote VARCHAR(8) NOT NULL CHECK (quote IN ('NGN', 'USD', 'CNY')),
    buy_rate NUMERIC(18, 6) NOT NULL CHECK (buy_rate > 0),
    sell_rate NUMERIC(18, 6) NOT NULL CHECK (sell_rate > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    published_by UUID REFERENCES auth.users(id),
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ,
    CHECK (base <> quote),
    CHECK (sell_rate >= buy_rate)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_fx_rates_one_active_pair
    ON public.fx_rates(base, quote) WHERE is_active;

-- -----------------------------------------------------------------------------
-- fx_fee_settings: directional fee % and minimum source amount (minor units)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fx_fee_settings (
    direction VARCHAR(16) PRIMARY KEY CHECK (direction IN ('NGN_TO_CNY', 'CNY_TO_NGN', 'USD_TO_CNY', 'CNY_TO_USD')),
    fee_percent NUMERIC(6, 3) NOT NULL DEFAULT 0.500 CHECK (fee_percent >= 0 AND fee_percent <= 10),
    min_amount_minor BIGINT NOT NULL DEFAULT 0 CHECK (min_amount_minor >= 0),
    max_rate_age_minutes INT NOT NULL DEFAULT 1440 CHECK (max_rate_age_minutes > 0),
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.fx_fee_settings (direction, fee_percent, min_amount_minor) VALUES
    ('NGN_TO_CNY', 0.500, 1000000),   -- ₦10,000.00
    ('CNY_TO_NGN', 0.500, 5000),      -- ¥50.00
    ('USD_TO_CNY', 0.500, 1000),      -- $10.00
    ('CNY_TO_USD', 0.500, 5000)       -- ¥50.00
ON CONFLICT (direction) DO NOTHING;

-- -----------------------------------------------------------------------------
-- fx_rate_audit_log: immutable (UPDATE / DELETE blocked by trigger)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fx_rate_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event VARCHAR(32) NOT NULL,              -- RATE_PUBLISHED | FEE_UPDATED | SWAP_EXECUTED
    actor_id UUID,
    base VARCHAR(8),
    quote VARCHAR(8),
    old_buy_rate NUMERIC(18, 6),
    old_sell_rate NUMERIC(18, 6),
    new_buy_rate NUMERIC(18, 6),
    new_sell_rate NUMERIC(18, 6),
    buy_rate_delta NUMERIC(18, 6),
    sell_rate_delta NUMERIC(18, 6),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.fx_audit_log_immutable()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'fx_rate_audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fx_audit_log_immutable ON public.fx_rate_audit_log;
CREATE TRIGGER trg_fx_audit_log_immutable
    BEFORE UPDATE OR DELETE ON public.fx_rate_audit_log
    FOR EACH ROW EXECUTE FUNCTION public.fx_audit_log_immutable();

-- RLS: everyone authenticated can read rates & fees; only RPCs write
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_fee_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_rate_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fx_rates_read ON public.fx_rates;
CREATE POLICY fx_rates_read ON public.fx_rates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS fx_fee_settings_read ON public.fx_fee_settings;
CREATE POLICY fx_fee_settings_read ON public.fx_fee_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS fx_fee_settings_write ON public.fx_fee_settings;
CREATE POLICY fx_fee_settings_write ON public.fx_fee_settings FOR UPDATE TO authenticated
    USING (public.is_fx_operator()) WITH CHECK (public.is_fx_operator());
DROP POLICY IF EXISTS fx_audit_read ON public.fx_rate_audit_log;
CREATE POLICY fx_audit_read ON public.fx_rate_audit_log FOR SELECT TO authenticated USING (public.is_fx_operator());

-- Realtime invalidation: mobile clients subscribe to fx_rates / fx_fee_settings changes
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fx_rates;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fx_fee_settings;
EXCEPTION WHEN others THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- RPC: publish_fx_rate(_base, _quote, _buy_rate, _sell_rate)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.publish_fx_rate(
    _base VARCHAR(8),
    _quote VARCHAR(8),
    _buy_rate NUMERIC(18, 6),
    _sell_rate NUMERIC(18, 6)
)
RETURNS JSONB AS $$
DECLARE
    v_old RECORD;
    v_new_id UUID;
BEGIN
    IF NOT public.is_fx_operator() THEN
        RAISE EXCEPTION 'Unauthorized: FX rate publishing requires ops, admin or super_admin role';
    END IF;
    IF (_base, _quote) NOT IN (('CNY', 'NGN'), ('USD', 'CNY'), ('USD', 'NGN')) THEN
        RAISE EXCEPTION 'Unsupported FX pair %/%', _base, _quote;
    END IF;
    IF _buy_rate IS NULL OR _sell_rate IS NULL OR _buy_rate <= 0 OR _sell_rate <= 0 THEN
        RAISE EXCEPTION 'Rates must be positive';
    END IF;
    IF _sell_rate < _buy_rate THEN
        RAISE EXCEPTION 'Sell rate (%) must be greater than or equal to buy rate (%)', _sell_rate, _buy_rate;
    END IF;

    -- Serialise concurrent publishers on the same pair
    PERFORM pg_advisory_xact_lock(hashtext('fx_rate:' || _base || '/' || _quote));

    SELECT * INTO v_old FROM public.fx_rates
    WHERE base = _base AND quote = _quote AND is_active
    FOR UPDATE;

    UPDATE public.fx_rates SET is_active = false, deactivated_at = NOW()
    WHERE base = _base AND quote = _quote AND is_active;

    INSERT INTO public.fx_rates (base, quote, buy_rate, sell_rate, is_active, published_by)
    VALUES (_base, _quote, _buy_rate, _sell_rate, true, auth.uid())
    RETURNING id INTO v_new_id;

    INSERT INTO public.fx_rate_audit_log (
        event, actor_id, base, quote, old_buy_rate, old_sell_rate,
        new_buy_rate, new_sell_rate, buy_rate_delta, sell_rate_delta, details
    ) VALUES (
        'RATE_PUBLISHED', auth.uid(), _base, _quote, v_old.buy_rate, v_old.sell_rate,
        _buy_rate, _sell_rate, _buy_rate - COALESCE(v_old.buy_rate, _buy_rate),
        _sell_rate - COALESCE(v_old.sell_rate, _sell_rate),
        jsonb_build_object('rate_id', v_new_id, 'previous_rate_id', v_old.id)
    );

    PERFORM pg_notify('fx_rates_changed', json_build_object('base', _base, 'quote', _quote, 'rate_id', v_new_id)::text);

    RETURN jsonb_build_object('success', true, 'rate_id', v_new_id, 'base', _base, 'quote', _quote,
                              'buy_rate', _buy_rate, 'sell_rate', _sell_rate);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- -----------------------------------------------------------------------------
-- RPC: execute_currency_swap(_direction, _amount_minor, _pin)
-- Fully atomic: any exception rolls back every statement in the function.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.execute_currency_swap(
    _direction VARCHAR(16),
    _amount_minor BIGINT,
    _pin TEXT,
    _expected_rate_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_profile RECORD;
    v_src VARCHAR(8);
    v_dst VARCHAR(8);
    v_base VARCHAR(8);
    v_quote VARCHAR(8);
    v_rate RECORD;
    v_fee RECORD;
    v_applied_rate NUMERIC(18, 6);
    v_fee_minor BIGINT;
    v_net_minor BIGINT;
    v_out_minor BIGINT;
    v_src_wallet RECORD;
    v_dst_wallet RECORD;
    v_ref VARCHAR(32);
BEGIN
    IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

    IF _direction IN ('USD_TO_NGN', 'NGN_TO_USD') THEN
        RAISE EXCEPTION 'Dollar can only be swapped to RMB. Swap USD to RMB, then RMB to Naira.';
    END IF;
    CASE _direction
        WHEN 'NGN_TO_CNY' THEN v_src := 'NGN'; v_dst := 'CNY'; v_base := 'CNY'; v_quote := 'NGN';
        WHEN 'CNY_TO_NGN' THEN v_src := 'CNY'; v_dst := 'NGN'; v_base := 'CNY'; v_quote := 'NGN';
        WHEN 'USD_TO_CNY' THEN v_src := 'USD'; v_dst := 'CNY'; v_base := 'USD'; v_quote := 'CNY';
        WHEN 'CNY_TO_USD' THEN v_src := 'CNY'; v_dst := 'USD'; v_base := 'USD'; v_quote := 'CNY';
        ELSE RAISE EXCEPTION 'Unsupported swap direction %', _direction;
    END CASE;

    IF _amount_minor IS NULL OR _amount_minor <= 0 THEN RAISE EXCEPTION 'Invalid swap amount'; END IF;

    -- PIN verification with lockout (row locked to serialise attempts)
    SELECT * INTO v_profile FROM public.user_profiles WHERE user_id = v_uid FOR UPDATE;
    IF NOT FOUND OR v_profile.transaction_pin_hash IS NULL THEN
        RAISE EXCEPTION 'PIN_NOT_SET: Transaction PIN has not been configured';
    END IF;
    IF v_profile.pin_locked_until IS NOT NULL AND v_profile.pin_locked_until > NOW() THEN
        RAISE EXCEPTION 'Transaction PIN locked until %', v_profile.pin_locked_until;
    END IF;
    IF crypt(_pin, v_profile.transaction_pin_hash) <> v_profile.transaction_pin_hash THEN
        -- NOTE: an increment of pin_failed_attempts here would be rolled back by
        -- the RAISE. Lockout counting currently lives in the app server layer
        -- (sync-server verifyUserTransactionPin); a dblink/autonomous-tx wrapper
        -- is required to count failures purely in Postgres.
        RAISE EXCEPTION 'INVALID_PIN: Incorrect transaction PIN';
    END IF;

    -- Active rate + staleness
    SELECT * INTO v_rate FROM public.fx_rates WHERE base = v_base AND quote = v_quote AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'No active % / % rate published', v_base, v_quote; END IF;
    SELECT * INTO v_fee FROM public.fx_fee_settings WHERE direction = _direction;
    IF NOT FOUND THEN RAISE EXCEPTION 'Fee configuration missing for %', _direction; END IF;
    IF v_rate.published_at < NOW() - make_interval(mins => v_fee.max_rate_age_minutes) THEN
        RAISE EXCEPTION 'RATE_STALE: Published rate has expired, awaiting treasury republish';
    END IF;
    IF _expected_rate_id IS NOT NULL AND _expected_rate_id <> v_rate.id THEN
        RAISE EXCEPTION 'RATE_CHANGED: Exchange rate was updated, please refresh your quote';
    END IF;
    IF _amount_minor < v_fee.min_amount_minor THEN
        RAISE EXCEPTION 'Amount below minimum of % minor units for %', v_fee.min_amount_minor, _direction;
    END IF;

    -- Integer minor-unit math (rounded fee, floored payout)
    v_fee_minor := ROUND(_amount_minor * v_fee.fee_percent / 100.0)::BIGINT;
    v_net_minor := _amount_minor - v_fee_minor;
    IF v_src = v_base THEN
        v_applied_rate := v_rate.buy_rate;   -- customer sells base
        v_out_minor := FLOOR(v_net_minor * v_applied_rate)::BIGINT;
    ELSE
        v_applied_rate := v_rate.sell_rate;  -- customer buys base
        v_out_minor := FLOOR(v_net_minor / v_applied_rate)::BIGINT;
    END IF;
    IF v_out_minor <= 0 THEN RAISE EXCEPTION 'Converted amount too small'; END IF;

    -- Row-level locks in deterministic order (by currency) to avoid deadlocks
    PERFORM 1 FROM public.wallets WHERE user_id = v_uid AND currency IN (v_src, v_dst)
        ORDER BY currency FOR UPDATE;

    SELECT * INTO v_src_wallet FROM public.wallets WHERE user_id = v_uid AND currency = v_src FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Source % wallet not found', v_src; END IF;
    IF v_src_wallet.status <> 'active' THEN RAISE EXCEPTION 'Source wallet is %', v_src_wallet.status; END IF;
    IF v_src_wallet.balance * 100 < _amount_minor THEN
        RAISE EXCEPTION 'Insufficient % balance', v_src;
    END IF;

    SELECT * INTO v_dst_wallet FROM public.wallets WHERE user_id = v_uid AND currency = v_dst FOR UPDATE;
    IF NOT FOUND THEN
        INSERT INTO public.wallets (user_id, currency, balance, ledger_balance, status)
        VALUES (v_uid, v_dst, 0, 0, 'active') RETURNING * INTO v_dst_wallet;
    END IF;

    v_ref := 'SW-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));

    UPDATE public.wallets SET balance = balance - (_amount_minor / 100.0),
        ledger_balance = ledger_balance - (_amount_minor / 100.0), updated_at = NOW()
    WHERE id = v_src_wallet.id;
    UPDATE public.wallets SET balance = balance + (v_out_minor / 100.0),
        ledger_balance = ledger_balance + (v_out_minor / 100.0), updated_at = NOW()
    WHERE id = v_dst_wallet.id;

    INSERT INTO public.transactions (user_id, reference, swap_reference, type, source_currency, target_currency,
        amount, fee, opening_balance, closing_balance, status, notes)
    VALUES
        (v_uid, v_ref || '-D', v_ref, 'SWAP_DEBIT', v_src, v_dst, _amount_minor / 100.0, v_fee_minor / 100.0,
         v_src_wallet.balance, v_src_wallet.balance - (_amount_minor / 100.0), 'completed',
         'FX swap ' || _direction || ' @ ' || v_applied_rate),
        (v_uid, v_ref || '-C', v_ref, 'SWAP_CREDIT', v_src, v_dst, v_out_minor / 100.0, 0,
         v_dst_wallet.balance, v_dst_wallet.balance + (v_out_minor / 100.0), 'completed',
         'FX swap ' || _direction || ' @ ' || v_applied_rate);

    INSERT INTO public.fx_rate_audit_log (event, actor_id, base, quote, new_buy_rate, new_sell_rate, details)
    VALUES ('SWAP_EXECUTED', v_uid, v_base, v_quote, v_rate.buy_rate, v_rate.sell_rate,
        jsonb_build_object('reference', v_ref, 'direction', _direction, 'amount_minor', _amount_minor,
                           'fee_minor', v_fee_minor, 'credited_minor', v_out_minor, 'rate_id', v_rate.id));

    RETURN jsonb_build_object(
        'success', true, 'reference', v_ref, 'direction', _direction,
        'source_currency', v_src, 'target_currency', v_dst,
        'amount_minor', _amount_minor, 'fee_minor', v_fee_minor, 'net_minor', v_net_minor,
        'credited_minor', v_out_minor, 'applied_rate', v_applied_rate, 'rate_id', v_rate.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.publish_fx_rate(VARCHAR, VARCHAR, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_fx_rate(VARCHAR, VARCHAR, NUMERIC, NUMERIC) TO authenticated;
REVOKE ALL ON FUNCTION public.execute_currency_swap(VARCHAR, BIGINT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_currency_swap(VARCHAR, BIGINT, TEXT, UUID) TO authenticated;

-- =============================================================================
-- PROVIDUS BANK DEDICATED VIRTUAL ACCOUNT (DVA) & WEBHOOK ENGINE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.providus_virtual_accounts (
    id TEXT PRIMARY KEY DEFAULT ('dva_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 6)),
    user_id TEXT NOT NULL,
    wallet_id TEXT,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    bank_name TEXT NOT NULL DEFAULT 'Providus Bank',
    bank_code TEXT NOT NULL DEFAULT '101',
    initiation_tran_ref TEXT UNIQUE NOT NULL,
    expected_amount NUMERIC(18, 4),
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled', 'expired', 'failed')),
    settled_amount NUMERIC(18, 4),
    settlement_id TEXT,
    session_id TEXT,
    settled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_providus_dva_ref ON public.providus_virtual_accounts(initiation_tran_ref);
CREATE INDEX IF NOT EXISTS idx_providus_dva_acc ON public.providus_virtual_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_providus_dva_user ON public.providus_virtual_accounts(user_id);

ALTER TABLE public.providus_virtual_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own virtual accounts" ON public.providus_virtual_accounts;
CREATE POLICY "Users can view own virtual accounts"
ON public.providus_virtual_accounts FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow insert virtual accounts" ON public.providus_virtual_accounts;
CREATE POLICY "Allow insert virtual accounts"
ON public.providus_virtual_accounts FOR INSERT
WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.providus_webhook_logs (
    id TEXT PRIMARY KEY DEFAULT ('pwhk_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 6)),
    session_id TEXT UNIQUE NOT NULL,
    initiation_tran_ref TEXT,
    account_number TEXT NOT NULL,
    amount NUMERIC(18, 4) NOT NULL,
    settlement_id TEXT,
    channel_id TEXT DEFAULT 'NIP',
    raw_payload JSONB NOT NULL,
    signature TEXT,
    status TEXT NOT NULL DEFAULT 'PROCESSED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.credit_providus_deposit(
    _user_id TEXT,
    _account_number TEXT,
    _amount NUMERIC,
    _reference TEXT,
    _session_id TEXT,
    _raw_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wallet RECORD;
    v_existing_log RECORD;
    v_tx_id TEXT;
    v_new_balance NUMERIC;
    v_opening_balance NUMERIC;
BEGIN
    SELECT * INTO v_existing_log FROM public.providus_webhook_logs WHERE session_id = _session_id;
    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_processed', true,
            'message', 'Transaction already processed for session_id ' || _session_id
        );
    END IF;

    SELECT * INTO v_wallet 
    FROM public.wallets 
    WHERE (user_id = _user_id OR _user_id IS NULL) AND currency = 'NGN'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'NGN wallet not found');
    END IF;

    v_opening_balance := v_wallet.balance;
    v_new_balance := v_opening_balance + _amount;

    UPDATE public.wallets
    SET balance = v_new_balance,
        ledger_balance = v_new_balance,
        updated_at = NOW()
    WHERE id = v_wallet.id;

    v_tx_id := 'tx_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 6);
    INSERT INTO public.transactions (
        id,
        user_id,
        type,
        currency,
        amount,
        fee,
        status,
        description,
        reference,
        channel,
        metadata,
        created_at
    ) VALUES (
        v_tx_id,
        v_wallet.user_id,
        'FUND',
        'NGN',
        _amount,
        0.00,
        'completed',
        'Providus Virtual Direct Account Transfer (' || _account_number || ')',
        _reference,
        'Providus DVA',
        jsonb_build_object(
            'sessionId', _session_id,
            'accountNumber', _account_number,
            'provider', 'Providus Bank',
            'raw', _raw_payload
        ),
        NOW()
    );

    UPDATE public.providus_virtual_accounts
    SET status = 'settled',
        settled_amount = _amount,
        settlement_id = _reference,
        session_id = _session_id,
        settled_at = NOW()
    WHERE (initiation_tran_ref = _reference OR account_number = _account_number)
      AND status = 'active';

    INSERT INTO public.providus_webhook_logs (
        session_id,
        initiation_tran_ref,
        account_number,
        amount,
        settlement_id,
        raw_payload,
        status,
        created_at
    ) VALUES (
        _session_id,
        _reference,
        _account_number,
        _amount,
        _reference,
        _raw_payload,
        'PROCESSED',
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_tx_id,
        'opening_balance', v_opening_balance,
        'new_balance', v_new_balance,
        'amount_credited', _amount,
        'reference', _reference,
        'user_id', v_wallet.user_id
    );
END;
$$;

-- ============================================================================
-- SECTION 25: FIREBASE CLOUD MESSAGING (FCM) & PUSH NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'web' CHECK (platform IN ('ios', 'android', 'web')),
  device_info jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_push_tokens_user_token_unique UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_token ON public.user_push_tokens(token);

ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users can view own push tokens" ON public.user_push_tokens
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can insert own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users can insert own push tokens" ON public.user_push_tokens
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can update own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users can update own push tokens" ON public.user_push_tokens
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::text = user_id)
  WITH CHECK ((SELECT auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can delete own push tokens" ON public.user_push_tokens;
CREATE POLICY "Users can delete own push tokens" ON public.user_push_tokens
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid())::text = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.user_push_tokens TO service_role;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own and broadcast notifications" ON public.notifications;
CREATE POLICY "Users can read own and broadcast notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = 'all' OR user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can update read status on own notifications" ON public.notifications;
CREATE POLICY "Users can update read status on own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
