-- Person page 用户账户表（注册昵称+邮箱+密码，id 从 000000001 递增）
create table if not exists public.person_users (
  id text primary key,
  nickname text unique not null,
  email text unique not null,
  password text not null,
  created_at timestamptz default now()
);

-- 邮箱验证码表
create table if not exists public.person_email_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  used boolean default false,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- 权限
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
