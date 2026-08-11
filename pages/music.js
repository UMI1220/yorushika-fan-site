import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAudio } from '../components/Layout';

// -----------------------------------------------------------------------------
// 1. 坚果 OS 动态物理光影计算 (用于磁贴、专辑封面与唱片)
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
    boxShadow: `${offsetX.toFixed(1)}px ${offsetY.toFixed(1)}px 24px rgba(0, 0, 0, 0.15), ${(offsetX * 0.5).toFixed(1)}px ${(offsetY * 0.5).toFixed(1)}px 8px rgba(0, 0, 0, 0.1)`,
  };
}

// -----------------------------------------------------------------------------
// 2. LRC 双语歌词解析器 (合流主歌词与副译文，末尾追加贡献者署名)
// -----------------------------------------------------------------------------
function parseLRC(lrcText, contributor, email) {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const timeMap = new Map();

  lines.forEach((line) => {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + ms / 1000;
      const text = match[4].trim();

      if (timeMap.has(time)) {
        timeMap.set(time, { main: timeMap.get(time).main, sub: text });
      } else {
        timeMap.set(time, { main: text, sub: '' });
      }
    }
  });

  const parsed = Array.from(timeMap.entries())
    .map(([time, value]) => ({ time, ...value }))
    .sort((a, b) => a.time - b.time);

  // 末尾渲染贡献者署名
  if (contributor || email) {
    const lastTime = parsed.length > 0 ? parsed[parsed.length - 1].time + 3 : 0;
    parsed.push({
      time: lastTime,
      main: `[ 歌詞提供：${contributor || '匿名'} ${email ? `<${email}>` : ''} ]`,
      sub: '',
    });
  }

  return parsed;
}
// 补充 formatTime 函数
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// -----------------------------------------------------------------------------
// 核心页面组件: MusicPage
// -----------------------------------------------------------------------------
export default function MusicPage() {
  const router = useRouter();
  const { album: queryAlbumId } = router.query;

  const {
    isPlaying,
    currentTrack,
    currentAlbum,
    togglePlay,
    playTrack,
    playNext,
    playPrev,
    progress,
    currentTime,
    seek,
    theme,
    themeColor,
    playlist,
  } = useAudio();

  // ------------------- 状态定义 -------------------
  // 入口场景判断与 UI 模式
  const [fromMenu, setFromMenu] = useState(false);
  const [showPlayerUI, setShowPlayerUI] = useState(false);

  // 专辑列表磁贴 (1:1 首页同款磁贴)
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumSongs, setAlbumSongs] = useState([]);
  const [activeTab, setActiveTab] = useState('player'); // 移动端: 'details' | 'player' | 'comments'

  // 版权自白卡片《音楽泥棒の自白》
  const [showConfessionModal, setShowConfessionModal] = useState(true);

  // 封面 3 模式: 'square' | 'disc' | 'rotate'
  const [coverMode, setCoverMode] = useState('square');
  const [showCoverModeMenu, setShowCoverModeMenu] = useState(false);

  // 歌词 3 模式与沉浸全屏
  const [lyrics, setLyrics] = useState([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [isImmersionMode, setIsImmersionMode] = useState(false);
  const lyricContainerRef = useRef(null);

  // 歌单 [ LIST ] 弹窗与播放模式
  const [showListModal, setShowListModal] = useState(false);
  const [playMode, setPlayMode] = useState('LOOP');

  // 评论区状态与回复展开
  const [comments, setComments] = useState([]);
  const [selectedComment, setSelectedComment] = useState(null);
  const [replies, setReplies] = useState([]);

  // 评论输入框表单
  const [commentNickname, setCommentNickname] = useState('');
  const [commentPassword, setCommentPassword] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentFile, setCommentFile] = useState(null);
  const [replyToUser, setReplyToUser] = useState('');

  // 评论/回复删除交互状态
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [deleteErrorMsg, setDeleteErrorMsg] = useState(null);

  // 无音源提示 Modal
  const [noAudioSong, setNoAudioSong] = useState(null);

  // ------------------- 1. 入口判别与拉取逻辑 -------------------
  useEffect(() => {
    fetchAlbumsWall();

    if (queryAlbumId) {
      // 【场景二：从首页专辑磁贴双击跳转进入】
      setFromMenu(false);
      setShowPlayerUI(true);
      loadAlbumAndPlayRandom(queryAlbumId);
    } else {
      // 【场景一：从导航 MENU 进入】
      setFromMenu(true);
      setShowPlayerUI(false);
    }
  }, [queryAlbumId]);

  // 拉取专辑列表磁贴墙
  const fetchAlbumsWall = async () => {
    try {
      const res = await fetch('/api/albums?summary=true');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAlbums(json.data);
      }
    } catch (err) {
      console.error('Fetch Albums Wall Error:', err);
    }
  };

  // 【场景二】：拉取专辑信息并随机播放一首
  const loadAlbumAndPlayRandom = async (albumId) => {
    try {
      const res = await fetch(`/api/albums/${albumId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const albumData = json.data;
        setSelectedAlbum(albumData);
        const songs = albumData.songs || [];
        setAlbumSongs(songs);

        const playableSongs = songs.filter((s) => s.audio_url || s.audioUrl);
        if (playableSongs.length > 0) {
          const randomSong = playableSongs[Math.floor(Math.random() * playableSongs.length)];
          playTrack(randomSong, albumData, playableSongs);
          fetchLyricsAndComments(randomSong.id);
        }
      }
    } catch (err) {
      console.error('Load Album Error:', err);
    }
  };

  // 【场景一】：点击专辑磁贴展开详情卡片
  const handleSelectAlbumTile = async (album) => {
    if (selectedAlbum?.id === album.id) {
      setSelectedAlbum(null);
      return;
    }
    setSelectedAlbum(album);
    try {
      const res = await fetch(`/api/albums/${album.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setAlbumSongs(json.data.songs || []);
      }
    } catch (err) {
      console.error('Fetch Album Songs Error:', err);
    }
  };

  // 点击歌曲触发播放或无音源拦截
  const handleSongClick = (song) => {
    const audioUrl = song.audio_url || song.audioUrl;
    if (!audioUrl) {
      setNoAudioSong(song);
      return;
    }
    setShowPlayerUI(true);
    playTrack(song, selectedAlbum, albumSongs.filter((s) => s.audio_url || s.audioUrl));
    fetchLyricsAndComments(song.id);
  };

  // 拉取歌词与评论
  const fetchLyricsAndComments = async (songId) => {
    try {
      const songRes = await fetch(`/api/songs/${songId}`);
      const songJson = await songRes.json();
      if (songJson.success && songJson.data) {
        const songData = songJson.data;
        if (songData.lyric_url) {
          const lrcRes = await fetch(songData.lyric_url);
          const lrcText = await lrcRes.text();
          setLyrics(parseLRC(lrcText, songData.contributor, songData.contributor_email));
        } else {
          setLyrics([]);
        }
      }
      fetchComments(songId);
    } catch (err) {
      console.error('Fetch Lyrics/Comments Error:', err);
    }
  };

  const fetchComments = async (songId) => {
    try {
      const res = await fetch(`/api/comments?song_id=${songId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setComments(json.data);
      }
    } catch (err) {
      console.error('Fetch Comments Error:', err);
    }
  };

  // ------------------- 2. 歌词高亮与滚动算法 -------------------
  useEffect(() => {
    if (!lyrics || lyrics.length === 0) return;
    let idx = 0;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    setCurrentLyricIndex(idx);

    if (lyricContainerRef.current) {
      const activeNode = lyricContainerRef.current.children[idx];
      if (activeNode) {
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, lyrics]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isImmersionMode) {
        setIsImmersionMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImmersionMode]);

  // ------------------- 3. 评论发表、回复与【凭密码删除】逻辑 -------------------
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!currentTrack || !commentText.trim() || !commentNickname.trim()) return;

    try {
      const formData = new FormData();
      formData.append('song_id', currentTrack.id);
      formData.append('nickname', commentNickname);
      formData.append('password', commentPassword);
      formData.append('content', commentText);
      if (selectedComment) {
        formData.append('parent_id', selectedComment.id);
      }
      if (commentFile) {
        formData.append('file', commentFile);
      }

      const res = await fetch('/api/comments', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) {
        setCommentText('');
        setCommentFile(null);
        setReplyToUser('');
        if (selectedComment) {
          fetchReplies(selectedComment.id);
        } else {
          fetchComments(currentTrack.id);
        }
      }
    } catch (err) {
      console.error('Post Comment Error:', err);
    }
  };

  const handleSelectCommentTile = async (comment) => {
    if (selectedComment?.id === comment.id) {
      setSelectedComment(null);
      return;
    }
    setSelectedComment(comment);
    fetchReplies(comment.id);
  };

  const fetchReplies = async (parentId) => {
    try {
      const res = await fetch(`/api/comments?parent_id=${parentId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setReplies(json.data);
      }
    } catch (err) {
      console.error('Fetch Replies Error:', err);
    }
  };

  // 【评论凭密码删除逻辑】
  const handleDeleteComment = async (commentId) => {
    if (!deletePasswordInput) {
      setDeleteErrorMsg('请填写发评时设置的删除密码');
      return;
    }
    try {
      const res = await fetch(`/api/comments?id=${commentId}&password=${encodeURIComponent(deletePasswordInput)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setDeletingCommentId(null);
        setDeletePasswordInput('');
        setDeleteErrorMsg(null);
        // 刷新列表
        if (currentTrack) fetchComments(currentTrack.id);
        if (selectedComment) fetchReplies(selectedComment.id);
      } else {
        setDeleteErrorMsg(json.message || '密码不匹配，无法删除');
      }
    } catch (err) {
      console.error('Delete Comment Error:', err);
      setDeleteErrorMsg('网络异常，删除失败');
    }
  };

  const albumCover = currentAlbum?.cover_url || currentTrack?.cover_url || '/01.jpg';
  const dynamicShadow = getDynamicShadowStyle(theme);

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] text-current overflow-x-hidden font-serif">
      {/* 动态高斯模糊背景 */}
      {showPlayerUI && (
        <div
          className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 -z-10 bg-cover bg-center ${
            theme === 'gekkou' ? 'opacity-30 blur-3xl saturate-50' : 'opacity-40 blur-2xl'
          }`}
          style={{ backgroundImage: `url(${albumCover})` }}
        />
      )}

      {/* 《音楽泥棒の自白》版权声明 Modal */}
      {showConfessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div
            style={dynamicShadow}
            className="bg-white/90 dark:bg-zinc-900/90 max-w-lg w-full p-6 sm:p-8 border border-current/10 font-mono text-xs relative space-y-4 rounded-none"
          >
            <button
              type="button"
              onClick={() => setShowConfessionModal(false)}
              className="absolute top-4 right-4 text-xs hover:underline font-bold"
            >
              [ × ]
            </button>
            <h2 className="text-sm font-bold tracking-widest border-b border-current/20 pb-2">
              《音楽泥棒の自白》 / CONFESSION
            </h2>
            <div className="space-y-3 leading-relaxed font-serif text-[13px] opacity-90">
              <p>「僕らはただ、夏の間じゅうずっと、あの人の歌を盗み続けていた。」</p>
              <p>
                本站为 ヨルシカ (Yorushika) 非商业二次创作粉丝档案馆。全站音频与视觉素材版权均归属
                UNIVERSAL MUSIC LLC 及 ヨルシカ 官方所有。
              </p>
            </div>
            <div className="pt-2 flex justify-between items-center text-[11px] opacity-60 font-mono">
              <span>© UMI / YORUSHIKA ARCHIVE</span>
              <button
                type="button"
                onClick={() => setShowConfessionModal(false)}
                className="hover:underline font-bold"
                style={{ color: themeColor }}
              >
                [ UNDERSTOOD ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 沉浸歌词全屏模式 */}
      {isImmersionMode && (
        <div className="fixed inset-0 z-50 bg-black/90 text-white flex flex-col justify-between p-8 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="flex justify-between items-center font-mono text-xs">
            <div>
              <p className="font-bold text-sm">{currentTrack?.title || '言の葉'}</p>
              <p className="opacity-60">{currentTrack?.artist || 'ヨルシカ'}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsImmersionMode(false)}
              className="hover:underline"
            >
              [ CLOSE / ESC ]
            </button>
          </div>

          <div
            ref={lyricContainerRef}
            className="flex-1 my-12 overflow-y-auto space-y-6 text-center font-serif scroll-smooth no-scrollbar flex flex-col items-center justify-center"
          >
            {lyrics.map((line, idx) => (
              <div
                key={idx}
                className={`transition-all duration-300 ${
                  idx === currentLyricIndex
                    ? 'text-xl sm:text-2xl font-bold opacity-100 scale-105'
                    : 'text-sm opacity-30'
                }`}
                style={{ color: idx === currentLyricIndex ? themeColor : undefined }}
              >
                <p>{line.main}</p>
                {line.sub && <p className="text-xs mt-1 font-normal opacity-80">{line.sub}</p>}
              </div>
            ))}
          </div>

          <div className="font-mono text-[10px] opacity-40 text-center">
            [ CLICK ANYWHERE / ESC TO EXIT IMMERSION MODE ]
          </div>
        </div>
      )}

      {/* 移动端 3 板块切换 Tab Bar */}
      <div className="lg:hidden flex justify-around items-center border-b border-current/10 py-2.5 font-mono text-xs bg-white/30 dark:bg-zinc-950/30 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`hover:underline ${activeTab === 'details' ? 'font-bold' : 'opacity-60'}`}
          style={{ color: activeTab === 'details' ? themeColor : undefined }}
        >
          [ DETAILS ]
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('player')}
          className={`hover:underline ${activeTab === 'player' ? 'font-bold' : 'opacity-60'}`}
          style={{ color: activeTab === 'player' ? themeColor : undefined }}
        >
          [ PLAYER ]
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('comments')}
          className={`hover:underline ${activeTab === 'comments' ? 'font-bold' : 'opacity-60'}`}
          style={{ color: activeTab === 'comments' ? themeColor : undefined }}
        >
          [ COMMENTS ]
        </button>
      </div>

      {/* 主三栏响应式布局 */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 左栏: 专辑列表与详情 */}
        <div className={`space-y-6 ${activeTab === 'details' || 'hidden lg:block'}`}>
          <div className="font-mono text-xs font-bold tracking-widest border-b border-current/10 pb-2 flex justify-between">
            <span>01. ALBUM DETAILS</span>
            {fromMenu && !selectedAlbum && <span className="opacity-60">[ SELECT AN ALBUM ]</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {albums.map((album) => {
              const isSelected = selectedAlbum?.id === album.id;
              return (
                <div key={album.id} className="space-y-2 col-span-2 sm:col-span-1">
                  <div
                    style={dynamicShadow}
                    onClick={() => handleSelectAlbumTile(album)}
                    className="relative aspect-square bg-zinc-800 rounded-none overflow-hidden cursor-pointer group border border-current/10 transition-transform active:scale-95"
                  >
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url(${album.cover_url || '/01.jpg'})` }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between text-white font-mono text-[10px]">
                      <span>{album.title}</span>
                      <span>{album.release_date?.substring(0, 4)}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="col-span-2 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md p-4 border border-current/10 font-mono text-xs space-y-3 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center border-b border-current/10 pb-2">
                        <span className="font-bold truncate">{album.title}</span>
                        <span className="text-[10px] opacity-60">
                          {album.song_count || albumSongs.length} TRACKS
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {albumSongs.map((song, idx) => {
                          const hasAudio = song.audio_url || song.audioUrl;
                          return (
                            <div
                              key={song.id || idx}
                              className="flex justify-between items-center p-1.5 hover:bg-current/5 transition-colors group text-[11px]"
                            >
                              <div
                                onClick={() => handleSongClick(song)}
                                className={`cursor-pointer truncate max-w-[70%] ${
                                  hasAudio ? 'hover:underline font-medium' : 'opacity-40'
                                }`}
                              >
                                <span>{idx + 1}. </span>
                                <span>{song.title}</span>
                              </div>

                              <div className="flex items-center space-x-2 text-[10px]">
                                {hasAudio ? (
                                  <button                                    type="button"
                                    onClick={() => handleSongClick(song)}
                                    className="font-mono hover:underline font-bold"
                                    style={{ color: themeColor }}
                                  >
                                    [ PLAY ]
                                  </button>
                                ) : (
                                  <span className="opacity-30 font-mono text-[10px]">[ NO AUDIO ]</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 中栏 (02. PLAYER & LYRICS): 播放器核心、封面切换、波浪进度条与控制链  */}
        {/* =================================================================== */}
        <div className={`space-y-6 ${activeTab === 'player' || 'hidden lg:block'}`}>
          <div className="font-mono text-xs font-bold tracking-widest border-b border-current/10 pb-2 flex justify-between items-center">
            <span>02. PLAYER & LYRICS</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCoverModeMenu(!showCoverModeMenu)}
                className="hover:underline opacity-80 text-[10px]"
              >
                [ VIEW: {coverMode.toUpperCase()} ]
              </button>
              {showCoverModeMenu && (
                <div className="absolute right-0 mt-1 bg-white/95 dark:bg-zinc-900/95 border border-current/20 p-2 space-y-1 text-[10px] z-30 font-mono shadow-xl rounded-none">
                  <button
                    type="button"
                    onClick={() => { setCoverMode('square'); setShowCoverModeMenu(false); }}
                    className="block w-full text-left hover:underline"
                  >
                    [ SQUARE ALBUM ]
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCoverMode('disc'); setShowCoverModeMenu(false); }}
                    className="block w-full text-left hover:underline"
                  >
                    [ STATIC DISC ]
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCoverMode('rotate'); setShowCoverModeMenu(false); }}
                    className="block w-full text-left hover:underline"
                  >
                    [ ROTATING DISC ]
                  </button>
                </div>
              )}
            </div>
          </div>

          <div
            style={dynamicShadow}
            className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md p-6 border border-current/10 space-y-6 rounded-none transition-all duration-300"
          >
            {/* 1. 封面展示区 (3 模式) */}
            <div className="flex justify-center items-center py-4">
              <div
                className={`relative overflow-hidden border border-current/10 transition-all duration-500 ${
                  coverMode === 'square'
                    ? 'w-64 h-64 rounded-none'
                    : coverMode === 'disc'
                    ? 'w-64 h-64 rounded-full'
                    : `w-64 h-64 rounded-full ${isPlaying ? 'animate-spin' : ''}`
                }`}
                style={{ animationDuration: '20s' }}
              >
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${albumCover})` }}
                />
                {coverMode !== 'square' && (
                  <div className="absolute inset-0 m-auto w-12 h-12 bg-zinc-950 rounded-full border-2 border-white/20 shadow-inner flex items-center justify-center">
                    <div className="w-4 h-4 bg-zinc-900 rounded-full" />
                  </div>
                )}
              </div>
            </div>

            {/* 2. 当前曲目信息与全屏沉浸入口 */}
            <div className="text-center space-y-1">
              <div className="flex justify-center items-center space-x-2">
                <h2 className="text-lg font-bold font-serif">{currentTrack?.title || '未选择曲目'}</h2>
                <button
                  type="button"
                  onClick={() => setIsImmersionMode(true)}
                  className="text-[10px] font-mono hover:underline opacity-60"
                >
                  [ IMMERSION ]
                </button>
              </div>
              <p className="text-xs font-mono opacity-60">
                {currentAlbum?.title ? `${currentAlbum.title} · ` : ''}
                {currentTrack?.artist || 'ヨルシカ'}
              </p>
            </div>

            {/* 3. 内联歌词展示窗口 */}
            <div
              ref={lyricContainerRef}
              className="h-32 overflow-y-auto space-y-3 text-center font-serif text-xs my-4 scroll-smooth no-scrollbar border-y border-current/10 py-3"
            >
              {lyrics.length > 0 ? (
                lyrics.map((line, idx) => (
                  <div
                    key={idx}
                    className={`transition-all duration-300 ${
                      idx === currentLyricIndex ? 'font-bold opacity-100 text-sm' : 'opacity-40'
                    }`}
                    style={{ color: idx === currentLyricIndex ? themeColor : undefined }}
                  >
                    <p>{line.main}</p>
                    {line.sub && <p className="text-[10px] font-normal opacity-70 mt-0.5">{line.sub}</p>}
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center opacity-40 font-mono text-[11px]">
                  [ NO LYRICS AVAILABLE / 暂无歌词 ]
                </div>
              )}
            </div>

            {/* 4. Pixel 动态波浪进度条 */}
            <div className="space-y-1.5 font-mono text-[10px]">
              <div className="relative w-full h-3 flex items-center cursor-pointer group">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress || 0}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                />
                <div className="w-full h-1 bg-current/10 relative overflow-hidden">
                  <div
                    className="h-full transition-all duration-100"
                    style={{ width: `${progress}%`, backgroundColor: themeColor || '#88abac' }}
                  />
                </div>
              </div>
              <div className="flex justify-between opacity-60">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(currentTrack?.duration || 0)}</span>
              </div>
            </div>

            {/* 5. 纯文字 5 大播放控制链按钮 */}
            <div className="flex justify-between items-center font-mono text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  const modes = ['LOOP', 'RAND', 'SINGLE'];
                  setPlayMode(modes[(modes.indexOf(playMode) + 1) % modes.length]);
                }}
                className="hover:underline opacity-80"
              >
                [ {playMode} ]
              </button>
              <button type="button" onClick={playPrev} className="hover:underline font-bold">
                [ PREV ]
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="px-4 py-1.5 font-bold hover:underline"
                style={{ backgroundColor: themeColor, color: '#09090b' }}
              >
                {isPlaying ? '[ PAUSE ]' : '[ PLAY ]'}
              </button>
              <button type="button" onClick={playNext} className="hover:underline font-bold">
                [ NEXT ]
              </button>
              <button
                type="button"
                onClick={() => setShowListModal(true)}
                className="hover:underline opacity-80"
              >
                [ LIST ]
              </button>
            </div>
          </div>
        </div>        {/* =================================================================== */}
        {/* 右栏 (03. COMMENTS): 社区讨论磁贴、回复线程与凭密码删除交互       */}
        {/* =================================================================== */}
        <div className={`space-y-6 ${activeTab === 'comments' || 'hidden lg:block'}`}>
          <div className="font-mono text-xs font-bold tracking-widest border-b border-current/10 pb-2 flex justify-between items-center">
            <span>03. COMMENTS & DISCUSSIONS</span>
            <span className="opacity-60 text-[10px]">{comments.length} THREADS</span>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {comments.length > 0 ? (
              comments.map((comment) => {
                const isSelected = selectedComment?.id === comment.id;
                return (
                  <div key={comment.id} className="space-y-2">
                    <div
                      style={dynamicShadow}
                      onClick={() => handleSelectCommentTile(comment)}
                      className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md p-4 border border-current/10 cursor-pointer hover:border-current/30 transition-all rounded-none space-y-2"
                    >
                      <div className="flex justify-between items-center font-mono text-[10px] opacity-70">
                        <span className="font-bold">{comment.nickname || '匿名盗贼'}</span>
                        <span>{comment.created_at?.substring(0, 10)}</span>
                      </div>
                      <p className="font-serif text-xs line-clamp-2 leading-relaxed">{comment.content}</p>
                      
                      <div className="flex justify-between items-center font-mono text-[10px] pt-1 opacity-60 border-t border-current/10">
                        <span>
                          {comment.has_media ? '[ MEDIA ] ' : ''}
                          {comment.reply_count || 0} REPLIES
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingCommentId(comment.id);
                          }}
                          className="hover:underline text-red-400 opacity-80"
                        >
                          [ DELETE ]
                        </button>
                      </div>

                      {/* 凭密码删除内联交互 */}
                      {deletingCommentId === comment.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 p-2 border border-red-500/30 bg-red-950/20 space-y-2 text-[10px] font-mono"
                        >
                          <p className="text-red-400">请输入发表时设置的删除密码：</p>
                          <div className="flex gap-2">
                            <input
                              type="password"
                              placeholder="PASSWORD"
                              value={deletePasswordInput}
                              onChange={(e) => setDeletePasswordInput(e.target.value)}
                              className="bg-transparent border border-current/20 p-1 flex-1 text-[10px]"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="bg-red-500 text-white px-2 py-1 font-bold"
                            >
                              [ CONFIRM ]
                            </button>
                            <button
                              type="button"
                              onClick={() => { setDeletingCommentId(null); setDeleteErrorMsg(null); }}
                              className="opacity-60 px-1"
                            >
                              [ CANCEL ]
                            </button>
                          </div>
                          {deleteErrorMsg && <p className="text-red-400 text-[9px]">{deleteErrorMsg}</p>}
                        </div>
                      )}
                    </div>

                    {/* 评论展开后的回复线程列表 */}
                    {isSelected && (
                      <div className="ml-4 space-y-2 border-l-2 border-current/20 pl-3 pt-1 animate-in fade-in duration-200">
                        {replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="bg-white/40 dark:bg-zinc-900/40 p-3 border border-current/10 font-mono text-xs space-y-1"
                          >
                            <div className="flex justify-between items-center text-[10px] opacity-70">
                              <span className="font-bold">{reply.nickname}</span>
                              <span>{reply.created_at?.substring(0, 10)}</span>
                            </div>
                            <p className="font-serif text-[11px] opacity-90">{reply.content}</p>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            setReplyToUser(comment.nickname);
                            document.getElementById('comment-input')?.focus();
                          }}
                          className="text-[10px] font-mono hover:underline opacity-80 pt-1"
                        >
                          [ REPLY TO {comment.nickname} ]
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center font-mono text-xs opacity-40 border border-current/10">
                [ NO COMMENTS YET / 暂无评论，欢迎留言 ]
              </div>
            )}
          </div>

          {/* 底部发表评论表单 */}
          <form onSubmit={handlePostComment} className="space-y-3 font-mono text-xs pt-2">
            {replyToUser && (
              <div className="flex justify-between items-center text-[10px] opacity-80 border-b border-current/10 pb-1">
                <span>REPLYING TO: @{replyToUser}</span>
                <button
                  type="button"
                  onClick={() => { setReplyToUser(''); setSelectedComment(null); }}
                  className="hover:underline"
                >
                  [ CANCEL REPLY ]
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="NICKNAME / 昵称 *"
                value={commentNickname}
                onChange={(e) => setCommentNickname(e.target.value)}
                className="bg-transparent border border-current/20 p-2 text-xs focus:outline-none"
              />
              <input
                type="password"
                placeholder="DELETE PASS / 删除密码"
                value={commentPassword}
                onChange={(e) => setCommentPassword(e.target.value)}
                className="bg-transparent border border-current/20 p-2 text-xs focus:outline-none"
              />
            </div>

            <textarea
              id="comment-input"
              rows={3}
              required
              placeholder={replyToUser ? `回复 @${replyToUser}...` : '发表您的听歌感想或对本作的见解...'}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="w-full bg-transparent border border-current/20 p-2 text-xs font-serif leading-relaxed focus:outline-none"
            />

            <div className="flex justify-between items-center">
              <label className="cursor-pointer text-[10px] opacity-70 hover:opacity-100 flex items-center space-x-1">
                <span>[ + FILE / 附件 ]</span>
                <input
                  type="file"
                  accept="image/*,audio/*"
                  onChange={(e) => setCommentFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
              {commentFile && <span className="text-[9px] opacity-60 truncate max-w-[120px]">{commentFile.name}</span>}

              <button
                type="submit"
                className="px-4 py-1.5 font-bold transition-colors"
                style={{ backgroundColor: themeColor, color: '#09090b' }}
              >
                [ SEND COMMENT ]
              </button>
            </div>
          </form>
        </div>
      </div>      {/* =================================================================== */}
      {/* 全局 Modal 弹窗逻辑                                               */}
      {/* =================================================================== */}
      
      {/* 1. 播放列表 Modal [ LIST ] */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            style={dynamicShadow}
            className="bg-white/95 dark:bg-zinc-900/95 max-w-md w-full p-6 border border-current/10 space-y-4 font-mono text-xs rounded-none"
          >
            <div className="flex justify-between items-center border-b border-current/20 pb-2">
              <span className="font-bold">[ PLAYLIST / 在播歌单 ]</span>
              <button
                type="button"
                onClick={() => setShowListModal(false)}
                className="hover:underline font-bold"
              >
                [ CLOSE ]
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {playlist && playlist.length > 0 ? (
                playlist.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id || idx}
                      onClick={() => playTrack(track, currentAlbum, playlist)}
                      className={`p-2 border border-current/10 flex justify-between items-center cursor-pointer hover:bg-current/5 ${
                        isCurrent ? 'font-bold' : 'opacity-80'
                      }`}
                    >
                      <span className="truncate max-w-[80%]">
                        {idx + 1}. {track.title}
                      </span>
                      {isCurrent && <span style={{ color: themeColor }}>[ PLAYING ]</span>}
                    </div>
                  );
                })
              ) : (
                <p className="opacity-40 text-center py-4">[ PLAYLIST IS EMPTY ]</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. 无音源拦截 Modal */}
      {noAudioSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            style={dynamicShadow}
            className="bg-white/95 dark:bg-zinc-900/95 max-w-sm w-full p-6 border border-current/10 space-y-4 font-mono text-xs rounded-none text-center"
          >
            <h3 className="font-bold border-b border-current/10 pb-2 text-red-400">
              [ NO AUDIO SOURCE / 暂无音源 ]
            </h3>
            <p className="font-serif opacity-80 leading-relaxed">
              曲目《{noAudioSong.title}》尚未在数据库中配置有效的音频链接。
            </p>
            <div className="pt-2 flex justify-center space-x-4">
              <Link
                href="/music/submit"
                className="px-3 py-1 bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400"
              >
                [ 补充音源 ]
              </Link>
              <button
                type="button"
                onClick={() => setNoAudioSong(null)}
                className="px-3 py-1 border border-current/20 hover:bg-current/10"
              >
                [ 关闭 ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



                  