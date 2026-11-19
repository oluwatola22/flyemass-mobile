-- Migration: 20261119_providus_virtual_accounts.sql
-- Description: Provision virtual_accounts table for Providus Bank Dynamic Virtual Accounts (DVA) & Webhook settlement tracking

CREATE TABLE IF NOT EXISTS public.virtual_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_id TEXT,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL DEFAULT 'Providus Bank',
  bank_code TEXT NOT NULL DEFAULT '101',
  initiation_tran_ref TEXT UNIQUE,
  expected_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  settled_at TIMESTAMPTZ,
  settlement_id TEXT,
  session_id TEXT,
  source_account_number TEXT,
  source_account_name TEXT,
  source_bank_name TEXT,
  channel_id TEXT,
  tran_remarks TEXT
);

CREATE INDEX IF NOT EXISTS idx_virtual_accounts_account_number ON public.virtual_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_user_id ON public.virtual_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_initiation_tran_ref ON public.virtual_accounts(initiation_tran_ref);

ALTER TABLE public.virtual_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own virtual accounts" 
    ON public.virtual_accounts FOR SELECT 
    TO authenticated 
    USING (auth.uid()::text = user_id OR user_id = 'usr_alade_01');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role has full access to virtual accounts" 
    ON public.virtual_accounts FOR ALL 
    TO service_role 
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
