import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAudio } from '../components/Layout';

// -----------------------------------------------------------------------------
// 1. 坚果 OS 动态物理光影计算 (随现实时间平滑演变)
// -----------------------------------------------------------------------------
function getDynamicShadowStyle(theme) {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;

  if (theme === 'gekkou') {
    return {
      boxShadow: '0px 14px 32px rgba(0, 0, 0, 0.85), 0px 4px 12px rgba(0, 0, 0, 0.6)',
    };
  }

  const angle = ((hours - 6) / 12) * Math.PI;
  const offsetX = Math.cos(angle) * 12;
  const offsetY = Math.sin(angle) * 14 + 6;

  return {
    boxShadow: `${offsetX.toFixed(1)}px ${offsetY.toFixed(1)}px 24px rgba(0, 0, 0, 0.12), ${(offsetX * 0.5).toFixed(1)}px ${(offsetY * 0.5).toFixed(1)}px 8px rgba(0, 0, 0, 0.08)`,
  };
}

// -----------------------------------------------------------------------------
// 主页面组件: SubmitPage
// -----------------------------------------------------------------------------
export default function SubmitPage() {
  const router = useRouter();
  const { song_id: querySongId, mode: queryMode } = router.query;
  const { theme, themeColor } = useAudio();

  // 1. 提交模式状态: 'supplement' (补充模式) | 'modify' (修改模式)
  const [submitMode, setSubmitMode] = useState('supplement');

  // 2. 补充类型分类: 'song' (补充现有歌曲) | 'album' (上传新专辑)
  const [supplementType, setSupplementType] = useState('song');

  // 3. 全量专辑与歌曲下拉列表 (用于选择联动)
  const [albums, setAlbums] = useState([]);
  const [songs, setSongs] = useState([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [selectedSongId, setSelectedSongId] = useState('');

  // 4. 表单核心字段
  const [contributor, setContributor] = useState('');
  const [email, setEmail] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [mvUrl, setMvUrl] = useState('');
  const [lyricContent, setLyricContent] = useState('');
  const [modifyReason, setModifyReason] = useState('');

  // 5. 新专辑上传专有字段
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumReleaseDate, setNewAlbumReleaseDate] = useState('');
  const [newAlbumRepresentativeLyric, setNewAlbumRepresentativeLyric] = useState('');
  const [newAlbumSongs, setNewAlbumSongs] = useState([{ title: '', audioUrl: '', lrcContent: '' }]);

  // 6. UI 交互控制
  const [submitting, setSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  // ------------------- 1. 初始化数据与 URL 参数自动定位 -------------------
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (queryMode === 'supplement' || queryMode === 'modify') {
      setSubmitMode(queryMode);
    }
    if (querySongId) {
      setSelectedSongId(querySongId);
      setSupplementType('song');
      checkSongDuplication(querySongId);
    }
  }, [querySongId, queryMode, songs]);

  const fetchInitialData = async () => {
    try {
      const res = await fetch('/api/albums?summary=true');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAlbums(json.data);
      }
    } catch (err) {
      console.error('Fetch Albums Summary Error:', err);
    }
  };

  // 选择专辑后联动拉取歌曲
  const handleAlbumChange = async (albumId) => {
    setSelectedAlbumId(albumId);
    setSelectedSongId('');
    if (!albumId) {
      setSongs([]);
      return;
    }
    try {
      const res = await fetch(`/api/albums/${albumId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSongs(json.data.songs || []);
      }
    } catch (err) {
      console.error('Fetch Songs Error:', err);
    }
  };

  // ------------------- 2. 二次补进拦截机制 -------------------
  const checkSongDuplication = async (songId) => {
    setDuplicateWarning(false);
    if (!songId || submitMode !== 'supplement') return;

    try {
      const res = await fetch(`/api/songs/${songId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const songData = json.data;
        // 如果音源与歌词都已存在，触发拦截
        if ((songData.audio_url || songData.audioUrl) && songData.lyric_url) {
          setDuplicateWarning(true);
        }
      }
    } catch (err) {
      console.error('Check Duplication Error:', err);
    }
  };

  // ------------------- 3. 动态添加新专辑歌曲表项 -------------------
  const handleAddSongRow = () => {
    setNewAlbumSongs([...newAlbumSongs, { title: '', audioUrl: '', lrcContent: '' }]);
  };

  const handleSongRowChange = (index, field, value) => {
    const updated = [...newAlbumSongs];
    updated[index][field] = value;
    setNewAlbumSongs(updated);
  };
  // ------------------- 4. 表单提交逻辑 -------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAlertMessage('「 请输入格式有效的联系邮箱，以便审核确认 」');
      return;
    }

    // 二次拦截限制阻断
    if (submitMode === 'supplement' && supplementType === 'song' && duplicateWarning) {
      setAlertMessage('「 该歌曲已存在完整音源与歌词，无法重复补充。若需修正请切换至修改模式 」');
      return;
    }

    setSubmitting(true);
    setAlertMessage(null);

    try {
      const payload = {
        mode: submitMode,
        type: supplementType,
        contributor,
        email,
        song_id: selectedSongId,
        album_id: selectedAlbumId,
        cover_url: coverUrl,
        audio_url: audioUrl,
        mv_url: mvUrl,
        lyric_content: lyricContent,
        modify_reason: modifyReason,
        // 新专辑专属
        new_album: supplementType === 'album' ? {
          title: newAlbumTitle,
          release_date: newAlbumReleaseDate,
          representative_lyric: newAlbumRepresentativeLyric,
          songs: newAlbumSongs,
        } : null,
      };

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setAlertMessage('「 提交成功！已暂存至审核表，感谢您对ヨルシカ档案馆的贡献。」');
        // 重置部分表单
        setCoverUrl('');
        setAudioUrl('');
        setMvUrl('');
        setLyricContent('');
        setModifyReason('');
      } else {
        setAlertMessage(`「 提交失败：${json.message || '系统错误'} 」`);
      }
    } catch (err) {
      console.error('Submit Error:', err);
      setAlertMessage('「 提交异常，请检查网络后重试 」');
    } finally {
      setSubmitting(false);
    }
  };

  const dynamicShadow = getDynamicShadowStyle(theme);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-4 py-8 max-w-4xl mx-auto font-serif text-current select-none">
      
      {/* ------------------- 顶部纯文字模式切换选项 ------------------- */}
      <div className="flex justify-between items-center border-b border-current/10 pb-4 mb-8 font-mono text-xs">
        <div className="space-x-4">
          <button
            type="button"
            onClick={() => { setSubmitMode('supplement'); setAlertMessage(null); }}
            className={`transition-opacity ${submitMode === 'supplement' ? 'font-bold opacity-100' : 'opacity-50 hover:opacity-80'}`}
            style={{ color: submitMode === 'supplement' ? themeColor : undefined }}
          >
            [ 01. SUPPLEMENT / 补充模式 ]
          </button>
          <button
            type="button"
            onClick={() => { setSubmitMode('modify'); setAlertMessage(null); }}
            className={`transition-opacity ${submitMode === 'modify' ? 'font-bold opacity-100' : 'opacity-50 hover:opacity-80'}`}
            style={{ color: submitMode === 'modify' ? themeColor : undefined }}
          >
            [ 02. MODIFY / 修改模式 ]
          </button>
        </div>
        <span className="opacity-40 text-[10px] hidden sm:inline">[ ARCHIVE SUBMISSION ]</span>
      </div>

      {/* ------------------- 提示反馈 Modal / Banner ------------------- */}
      {alertMessage && (
        <div
          style={{ borderColor: themeColor }}
          className="mb-6 p-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-l-4 font-mono text-xs flex justify-between items-center animate-in fade-in duration-200"
        >
          <span>{alertMessage}</span>
          <button
            type="button"
            onClick={() => setAlertMessage(null)}
            className="hover:underline font-bold ml-4"
          >
            [ × ]
          </button>
        </div>
      )}

      {/* ------------------- 表单核心卡片 (坚果 OS 物理阴影) ------------------- */}
      <form
        onSubmit={handleSubmit}
        style={dynamicShadow}
        className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-current/10 p-6 sm:p-8 space-y-6 rounded-none transition-all duration-300"
      >
        {/* 基础贡献者信息 */}
        <div className="space-y-3 font-mono text-xs border-b border-current/10 pb-6">
          <p className="font-bold tracking-wider opacity-80">[ CONTRIBUTOR INFO / 贡献者签名 ]</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] opacity-60 mb-1">NICKNAME / 贡献人名称 *</label>
              <input
                type="text"
                required
                placeholder="例如: UMI1220"
                value={contributor}
                onChange={(e) => setContributor(e.target.value)}
                className="w-full bg-transparent border border-current/20 p-2 font-serif focus:outline-none focus:border-current"
              />
            </div>
            <div>
              <label className="block text-[10px] opacity-60 mb-1">EMAIL / 审核联系邮箱 *</label>
              <input
                type="email"
                required
                placeholder="yhb1220@outlook.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-current/20 p-2 font-mono focus:outline-none focus:border-current"
              />
            </div>
          </div>
        </div>
        {/* ------------------- 补充模式特有分类 ------------------- */}
        {submitMode === 'supplement' && (
          <div className="space-y-6">
            <div className="flex space-x-6 font-mono text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="supp_type"
                  checked={supplementType === 'song'}
                  onChange={() => setSupplementType('song')}
                  className="accent-current"
                />
                <span>[ 补充现有歌曲 ]</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="supp_type"
                  checked={supplementType === 'album'}
                  onChange={() => setSupplementType('album')}
                  className="accent-current"
                />
                <span>[ 上传夜鹿新专辑 ]</span>
              </label>
            </div>

            {/* A. 补充现有歌曲分支 */}
            {supplementType === 'song' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] opacity-60 mb-1">SELECT ALBUM / 选择专辑 *</label>
                    <select
                      value={selectedAlbumId}
                      onChange={(e) => handleAlbumChange(e.target.value)}
                      required
                      className="w-full bg-transparent border border-current/20 p-2 focus:outline-none focus:border-current"
                    >
                      <option value="" className="bg-zinc-900 text-white">-- 选择专辑 --</option>
                      {albums.map((a) => (
                        <option key={a.id} value={a.id} className="bg-zinc-900 text-white">
                          {a.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] opacity-60 mb-1">SELECT SONG / 选择歌曲 *</label>
                    <select
                      value={selectedSongId}
                      onChange={(e) => {
                        setSelectedSongId(e.target.value);
                        checkSongDuplication(e.target.value);
                      }}
                      required
                      disabled={!selectedAlbumId}
                      className="w-full bg-transparent border border-current/20 p-2 focus:outline-none focus:border-current disabled:opacity-40"
                    >
                      <option value="" className="bg-zinc-900 text-white">-- 选择歌曲 --</option>
                      {songs.map((s) => (
                        <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 拦截二次重复补充警告 */}
                {duplicateWarning && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-serif">
                    「 该歌曲已存在音源与歌词，若需修正请切换至上方【修改模式】」
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] opacity-60 mb-1">COVER URL / 封面图片链接</label>
                    <input
                      type="url"
                      placeholder="https://yorushika-assets.pages.dev/cover/..."
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      className="w-full bg-transparent border border-current/20 p-2 focus:outline-none focus:border-current"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] opacity-60 mb-1">AUDIO URL / 音源链接 (.mp3)</label>
                    <input
                      type="url"
                      placeholder="https://yorushika-assets.pages.dev/music/..."
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      className="w-full bg-transparent border border-current/20 p-2 focus:outline-none focus:border-current"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] opacity-60 mb-1">MV URL / Bilibili 或 YouTube MV 链接</label>
                  <input
                    type="url"
                    placeholder="https://www.bilibili.com/video/..."
                    value={mvUrl}
                    onChange={(e) => setMvUrl(e.target.value)}
                    className="w-full bg-transparent border border-current/20 p-2 focus:outline-none focus:border-current"
                  />
                </div>

                <div>
                  <label className="block text-[10px] opacity-60 mb-1">LRC LYRICS / 粘贴双语 LRC 歌词文件文本</label>
                  <textarea
                    rows={5}
                    placeholder="[00:12.34]言の葉の奥に...\n[00:12.34]言语的深处..."
                    value={lyricContent}
                    onChange={(e) => setLyricContent(e.target.value)}
                    className="w-full bg-transparent border border-current/20 p-2 font-serif text-xs focus:outline-none focus:border-current"
                  />
                </div>
              </div>
            )}

            {/* B. 上传夜鹿新专辑分支 */}
            {supplementType === 'album' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] opacity-60 mb-1">NEW ALBUM TITLE / 新专辑名称 *</label>
                    <input
                      type="text"
                      required
                      placeholder="例如: 幻灯"
                      value={newAlbumTitle}
                      onChange={(e) => setNewAlbumTitle(e.target.value)}
                      className="w-full bg-transparent border border-current/20 p-2 focus:outline-none focus:border-current font-serif"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] opacity-60 mb-1">RELEASE DATE / 发行时间 *</label>
                    <input
                      type="date"
                      required
                      value={newAlbumReleaseDate}
                      onChange={(e) => setNewAlbumReleaseDate(e.target.value)}
                      className="w-full bg-transparent border border-current/20 p-2 focus:outline-none focus:border-current"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] opacity-60 mb-1">COVER URL / 专辑封面链接</label>
                  <input
                    type="url"
                    placeholder="https://yorushika-assets.pages.dev/cover/..."
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="w-full bg-transparent border border-current/20 p-2 focus:outline-none focus:border-current"
                  />
                </div>

                <div>
                  <label className="block text-[10px] opacity-60 mb-1">REPRESENTATIVE LYRIC / 代表歌词 (用于首页磁贴蒙版)</label>
                  <input
                    type="text"
                    placeholder="例如: 僕らはただ、夏の間じゅうずっと..."
                    value={newAlbumRepresentativeLyric}
                    onChange={(e) => setNewAlbumRepresentativeLyric(e.target.value)}
                    className="w-full bg-transparent border border-current/20 p-2 focus:outline-none focus:border-current font-serif"
                  />
                </div>

                {/* 动态曲目增减 */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[11px]">[ ALBUM TRACKLIST / 专辑曲目列表 ]</span>
                    <button
                      type="button"
                      onClick={handleAddSongRow}
                      style={{ color: themeColor }}
                      className="hover:underline font-bold"
                    >
                      [ + ADD SONG / 添加曲目 ]
                    </button>
                  </div>

                  {newAlbumSongs.map((songRow, idx) => (
                    <div key={idx} className="p-3 bg-current/5 space-y-2 border border-current/10">
                      <div className="flex justify-between items-center text-[10px] opacity-60">
                        <span>TRACK #{idx + 1}</span>
                      </div>
                      <input
                        type="text"
                        placeholder="TRACK TITLE / 歌曲名称 *"
                        required
                        value={songRow.title}
                        onChange={(e) => handleSongRowChange(idx, 'title', e.target.value)}
                        className="w-full bg-transparent border border-current/20 p-1.5 focus:outline-none font-serif text-xs"
                      />
                      <input
                        type="url"
                        placeholder="AUDIO URL / 音源链接 (.mp3)"
                        value={songRow.audioUrl}
                        onChange={(e) => handleSongRowChange(idx, 'audioUrl', e.target.value)}
                        className="w-full bg-transparent border border-current/20 p-1.5 focus:outline-none text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------- 修改模式 ------------------- */}
        {submitMode === 'modify' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] opacity-60 mb-1">SELECT ALBUM / 选择涉及专辑 *</label>
                <select
                  value={selectedAlbumId}
                  onChange={(e) => handleAlbumChange(e.target.value)}
                  required
                  className="w-full bg-transparent border border-current/20 p-2 focus:outline-none focus:border-current"
                >
                  <option value="" className="bg-zinc-900 text-white">-- 选择专辑 --</option>
                  {albums.map((a) => (
                    <option key={a.id} value={a.id} className="bg-zinc-900 text-white">
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] opacity-60 mb-1">SELECT SONG / 选择修改歌曲 (可选)</label>
                <select
                  value={selectedSongId}
                  onChange={(e) => setSelectedSongId(e.target.value)}
                  className="w-full bg-transparent border border-current/20 p-2 focus:outline-none focus:border-current"
                >
                  <option value="" className="bg-zinc-900 text-white">-- 修改整张专辑 / 或选择具体曲目 --</option>
                  {songs.map((s) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] opacity-60 mb-1">MODIFICATION DETAILS / 详细修正说明 *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="请详细描述需要修正的错误信息或更新数据..."
                  value={modifyReason}
                  onChange={(e) => setModifyReason(e.target.value)}
                  className="w-full bg-transparent border border-current/20 p-2 focus:outline-none text-xs leading-relaxed font-serif"
                />
              </div>
            </div>
          </div>
        )}

        {/* ------------------- 统一全局提交按钮区域 ------------------- */}
        <div className="pt-4 border-t border-current/10 font-mono text-xs">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 font-bold transition-all disabled:opacity-50"
            style={{ backgroundColor: themeColor, color: '#09090b' }}
          >
            {submitting ? '[ SUBMITTING TO ARCHIVE... / 正在提交... ]' : '[ SUBMIT ARCHIVE DATA / 提交归档数据 ]'}
          </button>
        </div>
      </form>
    </div>
  );
}
