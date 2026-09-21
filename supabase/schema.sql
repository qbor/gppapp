-- =====================================================================
-- 个人财务记账应用 · Supabase 数据库初始化脚本
-- 在 Supabase 控制台 → SQL Editor 中一次性执行本脚本即可。
-- 脚本幂等：可重复执行不会报错。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. 收支分类表 categories
--    user_id   : 归属用户（RLS 按此隔离数据）
--    type      : income 收入 / expense 支出
--    is_preset : 是否为系统预设分类（预设分类不允许删除，可修改）
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
-- 2. 账单表 bills
--    type        : income 收入 / expense 支出
--    category    : 冗余分类名（便于统计与筛选，与 categories 名称一致）
--    amount      : 金额，必须大于 0（负数、0 由前端校验 + 数据库双重拦截）
--    record_date : 记账日期
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

-- ---------------------------------------------------------------------
-- 3. 月度预算表 budgets（每个用户每月一条）
--    month  : 'YYYY-MM'
--    amount : 当月消费预算（支出预算）
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
-- 4. 常用索引（加速按月/按用户查询）
-- ---------------------------------------------------------------------
create index if not exists idx_bills_user_date on public.bills (user_id, record_date desc);
create index if not exists idx_categories_user on public.categories (user_id);
create index if not exists idx_budgets_user on public.budgets (user_id);

-- ---------------------------------------------------------------------
-- 5. 开启行级安全（RLS）—— 数据隔离的核心
-- ---------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.bills enable row level security;
alter table public.budgets enable row level security;

-- ---------------------------------------------------------------------
-- 6. RLS 策略：用户只能读写自己的数据（auth.uid() = user_id）
-- ---------------------------------------------------------------------
drop policy if exists "users_select_own_categories" on public.categories;
create policy "users_select_own_categories"
  on public.categories for select
  using (auth.uid() = user_id);

drop policy if exists "users_insert_own_categories" on public.categories;
create policy "users_insert_own_categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

drop policy if exists "users_update_own_categories" on public.categories;
create policy "users_update_own_categories"
  on public.categories for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users_delete_own_categories" on public.categories;
create policy "users_delete_own_categories"
  on public.categories for delete
  using (auth.uid() = user_id);

drop policy if exists "users_select_own_bills" on public.bills;
create policy "users_select_own_bills"
  on public.bills for select
  using (auth.uid() = user_id);

drop policy if exists "users_insert_own_bills" on public.bills;
create policy "users_insert_own_bills"
  on public.bills for insert
  with check (auth.uid() = user_id);

drop policy if exists "users_update_own_bills" on public.bills;
create policy "users_update_own_bills"
  on public.bills for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users_delete_own_bills" on public.bills;
create policy "users_delete_own_bills"
  on public.bills for delete
  using (auth.uid() = user_id);

drop policy if exists "users_select_own_budgets" on public.budgets;
create policy "users_select_own_budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

drop policy if exists "users_insert_own_budgets" on public.budgets;
create policy "users_insert_own_budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

drop policy if exists "users_update_own_budgets" on public.budgets;
create policy "users_update_own_budgets"
  on public.budgets for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users_delete_own_budgets" on public.budgets;
create policy "users_delete_own_budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);

-- =====================================================================
-- 7. 新用户自动写入预设分类（触发器，注册后立即生效）
-- =====================================================================
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
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_seed_categories on auth.users;
create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function public.seed_preset_categories();
