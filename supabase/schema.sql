-- =====================================================================
-- 快计 · 个人财务记账应用 · Supabase 数据库初始化脚本（v2.0 扩展版）
-- 在 Supabase 控制台 → SQL Editor 中一次性执行本脚本即可。
-- 脚本幂等：可重复执行不会报错。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. 收支分类表 categories
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  type        text not null check (type in ('income', 'expense')),
  is_preset   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. 账单表 bills（v2 扩展：tags 标签 / account 账户 / receipt 凭证 / deleted_at 软删除）
-- ---------------------------------------------------------------------
create table if not exists public.bills (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  type         text not null check (type in ('income', 'expense')),
  category     text not null,
  amount       numeric(12, 2) not null check (amount > 0),
  note         text default '',
  record_date  date not null default current_date,
  created_at   timestamptz not null default now()
);

-- 对已存在的 bills 表补充扩展列（幂等）
alter table public.bills add column if not exists tags    text[] not null default '{}';
alter table public.bills add column if not exists account text   not null default '';
alter table public.bills add column if not exists receipt text   default '';
alter table public.bills add column if not exists deleted_at timestamptz;

-- ---------------------------------------------------------------------
-- 3. 月度总预算表 budgets
-- ---------------------------------------------------------------------
create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  month       text not null,
  amount      numeric(12, 2) not null check (amount >= 0),
  created_at  timestamptz not null default now(),
  unique (user_id, month)
);

-- ---------------------------------------------------------------------
-- 4. 分类预算表 category_budgets（每个分类的月度预算）
-- ---------------------------------------------------------------------
create table if not exists public.category_budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  month       text not null,
  category    text not null,
  amount      numeric(12, 2) not null check (amount >= 0),
  created_at  timestamptz not null default now(),
  unique (user_id, month, category)
);

-- ---------------------------------------------------------------------
-- 5. 钱包账户表 accounts（现金/微信/支付宝/银行卡）
-- ---------------------------------------------------------------------
create table if not exists public.accounts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  icon        text not null default '',
  balance     numeric(12, 2) not null default 0,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. 重复账单表 recurring_bills（周期记账）
-- ---------------------------------------------------------------------
create table if not exists public.recurring_bills (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null check (type in ('income', 'expense')),
  category    text not null,
  amount      numeric(12, 2) not null check (amount > 0),
  note        text default '',
  tags        text[] not null default '{}',
  account     text not null default '',
  frequency   text not null check (frequency in ('day', 'week', 'month')),
  next_date   date not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7. 债务表 debts（应收 / 应付）
-- ---------------------------------------------------------------------
create table if not exists public.debts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  direction   text not null check (direction in ('borrow', 'lend')),
  name        text not null,
  amount      numeric(12, 2) not null check (amount > 0),
  note        text default '',
  status      text not null default 'pending',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. 个人资料表 profiles（昵称 / 头像）
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  nickname    text default '',
  avatar_url  text default '',
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 9. 常用索引
-- ---------------------------------------------------------------------
create index if not exists idx_bills_user_date on public.bills (user_id, record_date desc);
create index if not exists idx_categories_user on public.categories (user_id);
create index if not exists idx_budgets_user on public.budgets (user_id);
create index if not exists idx_catbudgets_user on public.category_budgets (user_id, month);
create index if not exists idx_accounts_user on public.accounts (user_id);
create index if not exists idx_recurring_user on public.recurring_bills (user_id);
create index if not exists idx_debts_user on public.debts (user_id);

-- ---------------------------------------------------------------------
-- 10. 开启行级安全（RLS）
-- ---------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.bills enable row level security;
alter table public.budgets enable row level security;
alter table public.category_budgets enable row level security;
alter table public.accounts enable row level security;
alter table public.recurring_bills enable row level security;
alter table public.debts enable row level security;
alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------
-- 11. RLS 策略：用户只能读写自己的数据
-- ---------------------------------------------------------------------
-- categories
drop policy if exists "cat_select_own" on public.categories;
create policy "cat_select_own" on public.categories for select using (auth.uid() = user_id);
drop policy if exists "cat_insert_own" on public.categories;
create policy "cat_insert_own" on public.categories for insert with check (auth.uid() = user_id);
drop policy if exists "cat_update_own" on public.categories;
create policy "cat_update_own" on public.categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "cat_delete_own" on public.categories;
create policy "cat_delete_own" on public.categories for delete using (auth.uid() = user_id);

-- bills
drop policy if exists "bill_select_own" on public.bills;
create policy "bill_select_own" on public.bills for select using (auth.uid() = user_id);
drop policy if exists "bill_insert_own" on public.bills;
create policy "bill_insert_own" on public.bills for insert with check (auth.uid() = user_id);
drop policy if exists "bill_update_own" on public.bills;
create policy "bill_update_own" on public.bills for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "bill_delete_own" on public.bills;
create policy "bill_delete_own" on public.bills for delete using (auth.uid() = user_id);

-- budgets
drop policy if exists "budget_select_own" on public.budgets;
create policy "budget_select_own" on public.budgets for select using (auth.uid() = user_id);
drop policy if exists "budget_insert_own" on public.budgets;
create policy "budget_insert_own" on public.budgets for insert with check (auth.uid() = user_id);
drop policy if exists "budget_update_own" on public.budgets;
create policy "budget_update_own" on public.budgets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "budget_delete_own" on public.budgets;
create policy "budget_delete_own" on public.budgets for delete using (auth.uid() = user_id);

-- category_budgets
drop policy if exists "catbudget_select_own" on public.category_budgets;
create policy "catbudget_select_own" on public.category_budgets for select using (auth.uid() = user_id);
drop policy if exists "catbudget_insert_own" on public.category_budgets;
create policy "catbudget_insert_own" on public.category_budgets for insert with check (auth.uid() = user_id);
drop policy if exists "catbudget_update_own" on public.category_budgets;
create policy "catbudget_update_own" on public.category_budgets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "catbudget_delete_own" on public.category_budgets;
create policy "catbudget_delete_own" on public.category_budgets for delete using (auth.uid() = user_id);

-- accounts
drop policy if exists "account_select_own" on public.accounts;
create policy "account_select_own" on public.accounts for select using (auth.uid() = user_id);
drop policy if exists "account_insert_own" on public.accounts;
create policy "account_insert_own" on public.accounts for insert with check (auth.uid() = user_id);
drop policy if exists "account_update_own" on public.accounts;
create policy "account_update_own" on public.accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "account_delete_own" on public.accounts;
create policy "account_delete_own" on public.accounts for delete using (auth.uid() = user_id);

-- recurring_bills
drop policy if exists "recurring_select_own" on public.recurring_bills;
create policy "recurring_select_own" on public.recurring_bills for select using (auth.uid() = user_id);
drop policy if exists "recurring_insert_own" on public.recurring_bills;
create policy "recurring_insert_own" on public.recurring_bills for insert with check (auth.uid() = user_id);
drop policy if exists "recurring_update_own" on public.recurring_bills;
create policy "recurring_update_own" on public.recurring_bills for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "recurring_delete_own" on public.recurring_bills;
create policy "recurring_delete_own" on public.recurring_bills for delete using (auth.uid() = user_id);

-- debts
drop policy if exists "debt_select_own" on public.debts;
create policy "debt_select_own" on public.debts for select using (auth.uid() = user_id);
drop policy if exists "debt_insert_own" on public.debts;
create policy "debt_insert_own" on public.debts for insert with check (auth.uid() = user_id);
drop policy if exists "debt_update_own" on public.debts;
create policy "debt_update_own" on public.debts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "debt_delete_own" on public.debts;
create policy "debt_delete_own" on public.debts for delete using (auth.uid() = user_id);

-- profiles
drop policy if exists "profile_select_own" on public.profiles;
create policy "profile_select_own" on public.profiles for select using (auth.uid() = user_id);
drop policy if exists "profile_insert_own" on public.profiles;
create policy "profile_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
drop policy if exists "profile_update_own" on public.profiles;
create policy "profile_update_own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "profile_delete_own" on public.profiles;
create policy "profile_delete_own" on public.profiles for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 12. 新用户初始化（触发器）：预设分类 + 默认账户
-- ---------------------------------------------------------------------
create or replace function public.seed_preset_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, type, is_preset, sort_order) values
    (new.id, '餐饮', 'expense', true, 1),
    (new.id, '交通', 'expense', true, 2),
    (new.id, '购物', 'expense', true, 3),
    (new.id, '房租', 'expense', true, 4),
    (new.id, '水电', 'expense', true, 5),
    (new.id, '娱乐', 'expense', true, 6),
    (new.id, '其他', 'expense', true, 7),
    (new.id, '工资', 'income', true, 1),
    (new.id, '奖金', 'income', true, 2),
    (new.id, '兼职', 'income', true, 3),
    (new.id, '其他', 'income', true, 4);

  insert into public.accounts (user_id, name, icon, sort_order) values
    (new.id, '现金',   'cash',   1),
    (new.id, '微信',   'wechat', 2),
    (new.id, '支付宝', 'alipay', 3),
    (new.id, '银行卡', 'card',   4);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_seed_categories on auth.users;
create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function public.seed_preset_categories();
