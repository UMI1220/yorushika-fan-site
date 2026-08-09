-- 1. 专辑表 (albums)
CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_jp TEXT NOT NULL,
  title_cn TEXT,
  cover_url TEXT NOT NULL,
  release_date TEXT,
  letter_title TEXT,
  letter_content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 曲目表 (tracks)
CREATE TABLE IF NOT EXISTS tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id INTEGER NOT NULL,
  track_number INTEGER NOT NULL,
  title_jp TEXT NOT NULL,
  title_cn TEXT,
  audio_url TEXT,
  mv_url TEXT,
  lrc_jp TEXT,
  lrc_cn TEXT,
  contributor TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

-- 3. 评论与回复表 (comments)
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_id TEXT NOT NULL, -- 如 'album_1' 或 'track_12'
  parent_id INTEGER DEFAULT NULL, -- NULL 为主评论，有值时为回复
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT DEFAULT NULL,
  media_type TEXT DEFAULT NULL, -- 'image' | 'audio'
  delete_password TEXT,
  is_pinned INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 反馈与申诉表 (feedback)
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- 'report' | 'bug' | 'suggestion'
  content TEXT NOT NULL,
  contact TEXT DEFAULT '匿名盗贼',
  status TEXT DEFAULT 'pending', -- 'pending' | 'resolved'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 贡献与修正申请表 (submissions)
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL, -- 'supplement' | 'modify'
  album_id INTEGER,
  track_title TEXT NOT NULL,
  contributor_email TEXT NOT NULL,
  audio_url TEXT,
  mv_url TEXT,
  lrc_ja TEXT,
  lrc_zh TEXT,
  cover_file_name TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. 临时管理口令表 (admin_codes)
CREATE TABLE IF NOT EXISTS admin_codes (
  code TEXT PRIMARY KEY,
  created_by TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0
);

-- 索引配置
CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_id);
