-- 1. 专辑表 (albums)
CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_jp TEXT NOT NULL,                  -- 日文专辑名 (例如: エルマ)
  title_cn TEXT,                           -- 中文专辑名 (例如: Elma)
  cover_url TEXT NOT NULL,                 -- CDN 封面图片路径
  release_date TEXT,                       -- 发售日期
  letter_title TEXT,                       -- 自白书信标题/副标题
  letter_content TEXT,                     -- 音乐泥棒的自白书信文本 (日/中)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 曲目表 (tracks)
CREATE TABLE IF NOT EXISTS tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id INTEGER NOT NULL,               -- 关联 albums.id
  track_number INTEGER NOT NULL,           -- 专辑内曲目序号 (1, 2, 3...)
  title_jp TEXT NOT NULL,                  -- 日文曲目名
  title_cn TEXT,                           -- 中文翻译曲目名
  audio_url TEXT,                          -- Cloudflare CDN MP3 音频路径
  mv_url TEXT,                             -- Bilibili / YouTube MV 链接
  lrc_jp TEXT,                             -- 日文双语 LRC 歌词
  lrc_cn TEXT,                             -- 中文 LRC 歌词
  contributor TEXT,                        -- 歌词/资源贡献者标识
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

-- 3. 评论与回复表 (comments)
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id INTEGER NOT NULL,               -- 关联 tracks.id
  parent_id INTEGER DEFAULT NULL,          -- NULL 为主评论，有值时为对某条评论的回复
  nickname TEXT NOT NULL,                  -- 评论者昵称
  content TEXT NOT NULL,                   -- 评论文本内容
  media_url TEXT DEFAULT NULL,             -- 随附图片或音频 CDN URL
  media_type TEXT DEFAULT NULL,            -- 'image' | 'audio'
  delete_password TEXT,                    -- 删除密码
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
);

-- 4. 创建常用查询索引，提升边缘 API 读取性能
CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_comments_track ON comments(track_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

