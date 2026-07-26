-- 1. 刊物/投稿表
CREATE TABLE IF NOT EXISTS magazines (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  issue TEXT,
  description TEXT,
  file_url TEXT,
  cover_url TEXT,
  pages INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. PDF 静态戳记批注表（对应我们之前做的阅读器戳记）
CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  magazine_id TEXT NOT NULL,
  page INTEGER NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
