import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout, { useAudio } from '../components/Layout';

export default function SubmitPage() {
  const router = useRouter();
  const { mode: queryMode, song_id: querySongId, album_id: queryAlbumId } = router.query;

  const { theme, themeColor, shadowStyle } = useAudio();

  // ---------------------------------------------------------------------------
  // 1. 状态管理 (State Management)
  // ---------------------------------------------------------------------------
  // 模式：'submit' (补充模式) | 'edit' (修改模式)
  const [mode, setMode] = useState('submit');

  // 操作类型：'album' (专辑) | 'song' (歌曲/音源)
  const [targetType, setTargetType] = useState('song');

  // 表单字段：专辑与歌曲通用/独立字段
  const [albumsList, setAlbumsList] = useState([]);       // 下拉可选的已有专辑列表
  const [selectedAlbumId, setSelectedAlbumId] = useState(queryAlbumId || '');
  const [targetSongId, setTargetSongId] = useState(querySongId || '');

  // 提交内容字段
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('ヨルシカ (Yorushika)'); // 默认艺术家
  const [releaseDate, setReleaseDate] = useState('');
  const [representativeLyric, setRepresentativeLyric] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [mvUrl, setMvUrl] = useState('');
  const [lrcUrl, setLrcUrl] = useState('');
  const [contributorEmail, setContributorEmail] = useState(''); // 贡献者/修改者邮箱

  // 提交状态与反馈
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // ---------------------------------------------------------------------------
  // 2. 初始化与路由 Query 校验 (符合《拉取上传删除逻辑规范》)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (queryMode === 'edit') {
      setMode('edit');
    } else {
      setMode('submit');
    }

    if (queryAlbumId) {
      setSelectedAlbumId(queryAlbumId);
    }
    if (querySongId) {
      setTargetSongId(querySongId);
      // 若携带 song_id，自动拉取该歌曲详情以供修改或补充音源
      fetchSongDetails(querySongId);
    }

    // 拉取已有专辑列表以供下拉选择
    fetch('/api/albums?summary=true')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.albums)) {
          setAlbumsList(data.albums);
        }
      })
      .catch((e) => console.error('Failed to load albums for select:', e));
  }, [queryMode, querySongId, queryAlbumId]);

  const fetchSongDetails = async (songId) => {
    try {
      const res = await fetch(`/api/songs/${songId}`);
      const data = await res.json();
      if (data && data.song) {
        setTitle(data.song.title || '');
        setArtist(data.song.artist || 'ヨルシカ (Yorushika)');
        setAudioUrl(data.song.audio_url || '');
        setMvUrl(data.song.mv_url || '');
        setLrcUrl(data.song.lrc_url || '');
        setCoverUrl(data.song.cover_url || '');
      }
    } catch (e) {
      console.error('Failed to fetch song details:', e);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. 提交处理逻辑 (Submitting & Staging Rules)
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contributorEmail || !contributorEmail.includes('@')) {
      setMessage('[ ERROR: PLEASE ENTER A VALID EMAIL ADDRESS / 请输入有效邮箱 ]');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const payload = {
        mode, // 'submit' | 'edit'
        targetType, // 'album' | 'song'
        title,
        artist,
        release_date: releaseDate,
        representative_lyric: representativeLyric,
        cover_url: coverUrl,
        audio_url: audioUrl,
        mv_url: mvUrl,
        lrc_url: lrcUrl,
        album_id: selectedAlbumId,
        song_id: targetSongId,
        contributor: contributorEmail, // 贡献者邮箱/补充贡献者
      };

      const endpoint = mode === 'edit' ? '/api/admin/staging' : '/api/submit';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage(
          mode === 'edit'
            ? '[ SUCCESS: SUBMITTED TO STAGING FOR ADMIN AUDIT / 已提交至审核暂存表 ]'
            : '[ SUCCESS: CONTENT UPLOADED & SAVED SUCCESSFULLY / 上传并保存成功 ]'
        );
        // 清空表单或重定向
      } else {
        setMessage(`[ ERROR: ${result.error || 'SUBMISSION FAILED'} ]`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setMessage('[ ERROR: NETWORK OR SERVER EXCEPTION / 网络或服务器异常 ]');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 min-h-[80vh]">
        {/* 页面顶部标识 */}
        <div className="text-xs font-bold tracking-widest uppercase border-b border-current/10 pb-2 mb-6 flex justify-between items-center">
          <span>
            [ {mode === 'submit' ? 'SUBMIT & INGESTION / 补充模式' : 'MODIFY & EDIT / 修改模式'} ]
          </span>
          <div className="space-x-4 text-[10px]">
            <button
              type="button"
              onClick={() => setMode('submit')}
              className={`cursor-pointer ${mode === 'submit' ? 'underline font-bold' : 'opacity-50'}`}
              style={{ color: mode === 'submit' ? themeColor : 'inherit' }}
            >
              [ SUBMIT / 补充 ]
            </button>
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`cursor-pointer ${mode === 'edit' ? 'underline font-bold' : 'opacity-50'}`}
              style={{ color: mode === 'edit' ? themeColor : 'inherit' }}
            >
              [ EDIT / 修改 ]
            </button>
          </div>
        </div>

        {/* 目标类型切换：专辑 vs 歌曲 */}
        <div className="flex space-x-4 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTargetType('song')}
            style={{ color: targetType === 'song' ? themeColor : 'inherit' }}
            className={`px-4 py-2 border border-current/20 cursor-pointer ${
              targetType === 'song' ? 'bg-current/10' : 'opacity-60'
            }`}
          >
            [ TARGET: SONG / 补充歌曲与音源 ]
          </button>
          <button
            type="button"
            onClick={() => setTargetType('album')}
            style={{ color: targetType === 'album' ? themeColor : 'inherit' }}
            className={`px-4 py-2 border border-current/20 cursor-pointer ${
              targetType === 'album' ? 'bg-current/10' : 'opacity-60'
            }`}
          >
            [ TARGET: ALBUM / 补充完整专辑 ]
          </button>
        </div>
        {/* 表单主体：应用 Smartisan OS 斜射阴影与毛玻璃磁贴效果 */}
        <form
          onSubmit={handleSubmit}
          style={{ boxShadow: shadowStyle }}
          className={`p-6 border backdrop-blur-md rounded-none transition-all duration-300 space-y-5 ${
            theme === 'gekko'
              ? 'bg-[#12181a]/90 border-white/20 text-white'
              : 'bg-white/90 border-black/10 text-[#2c3e50]'
          }`}
        >
          {/* 1. 标题 / 名称 */}
          <div className="space-y-1">
            <label className="block text-xs font-bold tracking-widest opacity-80">
              [ {targetType === 'song' ? 'SONG TITLE / 歌曲名称' : 'ALBUM TITLE / 专辑名称'} ] *
            </label>
            <input
              type="text"
              required
              placeholder={targetType === 'song' ? '例如: 盗作' : '例如: 正式专辑《盗作》'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 text-xs bg-current/5 border border-current/20 rounded-none outline-none focus:border-current"
            />
          </div>

          {/* 2. 若当前是补充歌曲，需选择所属专辑 */}
          {targetType === 'song' && (
            <div className="space-y-1">
              <label className="block text-xs font-bold tracking-widest opacity-80">
                [ TARGET ALBUM / 所属专辑 ] *
              </label>
              <select
                required
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
                className="w-full p-2.5 text-xs bg-current/5 border border-current/20 rounded-none outline-none"
              >
                <option value="">-- 请选择所属专辑 --</option>
                {albumsList.map((alb) => (
                  <option key={alb.id} value={alb.id} className="bg-black text-white">
                    {alb.title || alb.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. 艺术家 (默认夜鹿) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold tracking-widest opacity-80">
              [ ARTIST / 艺术家 ]
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full p-2.5 text-xs bg-current/5 border border-current/20 rounded-none outline-none"
            />
          </div>

          {/* 4. 专辑专属字段：发行时间与代表歌词 */}
          {targetType === 'album' && (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-bold tracking-widest opacity-80">
                  [ RELEASE DATE / 发行时间 ]
                </label>
                <input
                  type="text"
                  placeholder="例如: 2020.07.29"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full p-2.5 text-xs bg-current/5 border border-current/20 rounded-none outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold tracking-widest opacity-80">
                  [ REPRESENTATIVE LYRIC / 代表歌词 ]
                </label>
                <input
                  type="text"
                  placeholder="例如: 僕らはただ、夏の間じゅうずっと..."
                  value={representativeLyric}
                  onChange={(e) => setRepresentativeLyric(e.target.value)}
                  className="w-full p-2.5 text-xs bg-current/5 border border-current/20 rounded-none outline-none"
                />
              </div>
            </>
          )}

          {/* 5. 封面 URL / 资源库上传 */}
          <div className="space-y-1">
            <label className="block text-xs font-bold tracking-widest opacity-80">
              [ COVER URL / 封面链接 (将自动存入 covers/ 目录) ]
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="https://... 或输入本地文件名"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="flex-1 p-2.5 text-xs bg-current/5 border border-current/20 rounded-none outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const url = prompt('输入封面图片 URL:');
                  if (url) setCoverUrl(url);
                }}
                className="px-3 py-2 text-xs font-bold border border-current/30 hover:bg-current/10 cursor-pointer"
              >
                [ UPLOAD ]
              </button>
            </div>
          </div>

          {/* 6. 歌曲专属字段：音源 URL、MV 链接、LRC 歌词 */}
          {targetType === 'song' && (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-bold tracking-widest opacity-80">
                  [ AUDIO URL / 音频源文件链接 (存入 music/ 目录) ]
                </label>
                <input
                  type="text"
                  placeholder="音频直链地址..."
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  className="w-full p-2.5 text-xs bg-current/5 border border-current/20 rounded-none outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold tracking-widest opacity-80">
                  [ MV VIDEO URL / 音乐视频链接 ]
                </label>
                <input
                  type="text"
                  placeholder="YouTube / Bilibili 嵌入链接..."
                  value={mvUrl}
                  onChange={(e) => setMvUrl(e.target.value)}
                  className="w-full p-2.5 text-xs bg-current/5 border border-current/20 rounded-none outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold tracking-widest opacity-80">
                  [ LRC LYRICS FILE URL / LRC 滚动歌词文件 (存入 lyrics/ 目录) ]
                </label>
                <input
                  type="text"
                  placeholder=".lrc 文件地址..."
                  value={lrcUrl}
                  onChange={(e) => setLrcUrl(e.target.value)}
                  className="w-full p-2.5 text-xs bg-current/5 border border-current/20 rounded-none outline-none"
                />
              </div>
            </>
          )}

          {/* 7. 贡献者/修改者邮箱 (核心署名契约) */}
          <div className="space-y-1 pt-2 border-t border-current/10">
            <label className="block text-xs font-bold tracking-widest" style={{ color: themeColor }}>
              [ CONTRIBUTOR EMAIL / 贡献者或修改者邮箱 (必填) ] *
            </label>
            <input
              type="email"
              required
              placeholder="yhb1220@outlook.com"
              value={contributorEmail}
              onChange={(e) => setContributorEmail(e.target.value)}
              className="w-full p-2.5 text-xs bg-current/5 border border-current/20 rounded-none outline-none font-mono"
            />
            <p className="text-[10px] opacity-60 font-serif pt-1">
              注：修改或补充内容将自动作为贡献者署名记录。若经管理员审核通过，将自动更新至正式数据表。
            </p>
          </div>

          {/* 8. 提交反馈状态提示 */}
          {message && (
            <div className="p-3 text-xs font-mono border border-current/30 bg-current/5">
              {message}
            </div>
          )}

          {/* 9. 底部提交按钮 */}
          <div className="pt-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => router.push('/music')}
              className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
            >
              [ &lt; BACK TO MUSIC / 返回音乐页 ]
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{ color: themeColor }}
              className="px-6 py-3 text-xs font-bold border border-current/40 hover:bg-current/10 cursor-pointer disabled:opacity-50"
            >
              [ {submitting ? 'PROCESSING / 提交中...' : mode === 'submit' ? 'SUBMIT CONTENT &gt;' : 'SEND TO STAGING &gt;'} ]
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
