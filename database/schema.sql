-- =============================================
-- MiVenta SaaS Platform — Database Schema
-- Custom JWT Strategy (PostgreSQL)
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES (Local Users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'staff', 'customer')),
  referral_code_used TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 2. PLANS
-- =============================================
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  duration_months INT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_enterprise BOOLEAN NOT NULL DEFAULT FALSE,
  features JSONB DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default plans
INSERT INTO public.plans (name, description, duration_months, price, is_enterprise, features) VALUES
  ('Monthly', 'Perfect to get started', 1, 29.99, FALSE, '["All core features", "Email support", "1 user seat"]'),
  ('Quarterly', 'Save 15% — most flexible', 3, 76.47, FALSE, '["All core features", "Priority support", "3 user seats", "Analytics dashboard"]'),
  ('Semiannual', 'Save 25% — best value', 6, 134.96, FALSE, '["All core features", "Priority support", "5 user seats", "Analytics dashboard", "API access"]'),
  ('Annual', 'Save 35% — biggest savings', 12, 233.88, FALSE, '["All core features", "Dedicated support", "10 user seats", "Analytics dashboard", "API access", "Custom integrations"]'),
  ('Enterprise', 'Custom solutions for your business', 0, 0, TRUE, '["Unlimited users", "24/7 dedicated support", "Custom integrations", "SLA guarantee", "On-premise option"]');

-- =============================================
-- 3. REFERRERS
-- =============================================
CREATE TABLE public.referrers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  bank_account_number TEXT,
  bank_name TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  total_referrals INT NOT NULL DEFAULT 0,
  total_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 4. SUBSCRIPTIONS
-- =============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 5. PAYMENTS
-- =============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_ref TEXT,
  qr_code_data TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 6. LEADS (Contact Form)
-- =============================================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT NOT NULL,
  source TEXT DEFAULT 'contact_form',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 7. FAQS
-- =============================================
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 8. EVENT LOGS (Audit Trail)
-- =============================================
CREATE TABLE public.event_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}'::JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster log queries
CREATE INDEX idx_event_logs_created_at ON public.event_logs(created_at DESC);
CREATE INDEX idx_event_logs_actor ON public.event_logs(actor_id);
CREATE INDEX idx_event_logs_entity ON public.event_logs(entity_type, entity_id);

-- Note: Row Level Security (RLS) is intentionally omitted because the NestJS API 
-- will act as the single gatekeeper for database access, validating requests 
-- natively using standard JWT guards.

-- =============================================
-- 9. SEED USERS (Default Users)
-- =============================================
-- The password hash corresponds to the plain text password: 'admin123'
INSERT INTO public.profiles (
  email,
  password_hash,
  full_name,
  phone,
  role
) VALUES (
  'admin@miempresa.com',
  '$2b$10$6/CJUGI1IRLNIw5S3ImkLemwMhFEW1HHx6chwJ7Bsyyeu1Ndpdzly', 
  'Admin Principal',
  '+1234567890',
  'admin'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.profiles (
  email,
  password_hash,
  full_name,
  phone,
  role
) VALUES (
  'cliente@ejemplo.com',
  '$2b$10$6/CJUGI1IRLNIw5S3ImkLemwMhFEW1HHx6chwJ7Bsyyeu1Ndpdzly', 
  'Juan Pérez',
  '+0987654321',
  'customer'
) ON CONFLICT (email) DO NOTHING;

