-- Initial schema for yorushika-fan-site local development

-- 1. 刊物/投稿表
create table if not exists public.magazines (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  author text not null,
  category text not null,
  issue text,
  description text,
  file_url text,
  cover_url text,
  cover_img text,
  issue_number text,
  zip_url text,
  pdf_url text,
  pages integer default 1,
  created_at timestamptz default now()
);

-- 2. PDF 静态戳记批注表
create table if not exists public.annotations (
  id text primary key default gen_random_uuid()::text,
  magazine_id text not null,
  page integer default 0,
  page_index integer default 0,
  x real default 0,
  y real default 0,
  x_percent real default 50,
  y_percent real default 50,
  author text not null,
  nickname text,
  content text not null,
  created_at timestamptz default now()
);

-- 3. 论坛帖子表
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text default '匿名鹿友',
  category text default 'ABSTRACT',
  content text not null,
  image_url text default '',
  video_url text default '',
  location_name text default '',
  delete_password text default '',
  likes integer default 0,
  views integer default 0,
  is_pinned boolean default false,
  is_featured boolean default false,
  stamps_detail jsonb default '{"flower":0,"moon":0,"ghost":0,"coffee":0,"blue":0}'::jsonb,
  created_at timestamptz default now()
);

-- 4. 论坛评论表
create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null,
  author text default '匿名鹿友',
  content text default '',
  parent_id uuid,
  image_url text default '',
  delete_password text default '',
  likes integer default 0,
  created_at timestamptz default now()
);

-- 5. 管理员用户表
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  nickname text,
  email text,
  password text,
  role text default 'admin',
  created_at timestamptz default now()
);

-- 6. 管理员申请表
create table if not exists public.admin_applications (
  id uuid primary key default gen_random_uuid(),
  nickname text,
  applicant_name text,
  email text,
  reason text,
  status text default 'pending',
  generated_pass text,
  created_at timestamptz default now()
);

-- 7. 反馈/举报表
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  type text default 'report',
  content text,
  contact text default '匿名',
  created_at timestamptz default now()
);

-- 8. 音乐曲目表
create table if not exists public.music (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text default 'ヨルシカ',
  album text default 'Single',
  audio_url text,
  cover_url text,
  mv_url text,
  lyric_jp text,
  lyric_cn text,
  contributor text default '匿名鹿友',
  supplement_contributor text,
  created_at timestamptz default now()
);

-- 9. 画廊表
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text default '匿名画师',
  category text default 'FANART',
  delete_pass text,
  image_url text,
  quote text,
  views integer default 0,
  likes integer default 0,
  created_at timestamptz default now()
);

-- 10. 用户资料表
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 权限：授予 anon / authenticated 角色访问权限
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
