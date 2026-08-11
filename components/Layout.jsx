import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// -----------------------------------------------------------------------------
// 1. 全局 Audio & UI 上下文 (Global Audio Context)
// -----------------------------------------------------------------------------
const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  // SSR 预渲染防崩容错保护
  if (!context) {
    return {
      theme: 'natsukage',
      themeColor: '#88abac',
      isPlaying: false,
      currentTrack: null,
      currentAlbum: null,
      playlist: [],
      currentIndex: 0,
      progress: 0,
      duration: 0,
      currentTime: 0,
      setTheme: () => {},
      setThemeColor: () => {},
      playTrack: () => {},
      togglePlay: () => {},
      playNext: () => {},
      playPrev: () => {},
    };
  }
  return context;
};

export function AudioProvider({ children }) {
  const router = useRouter();

  // 音频与播放列表状态
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 ~ 100
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // 全局主题状态
  const [theme, setTheme] = useState('natsukage'); // 'natsukage' (夏陰/日间) | 'gekkou' (月光/夜间)
  const [themeColor, setThemeColor] = useState('#88abac'); // 默认月光青，支持磁贴动态取色覆盖

  // 初始化 Audio 监听器
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration);
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      playNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [playlist, currentIndex]);

  // 播放/暂停控制
  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.log('Audio Play Error:', err));
      setIsPlaying(true);
    }
  };

  // 切换并播放指定曲目 (兼容 D1 下划线字段与驼峰字段)
  const playTrack = (track, album, newPlaylist = []) => {
    setCurrentTrack(track);
    if (album) setCurrentAlbum(album);
    if (newPlaylist.length > 0) setPlaylist(newPlaylist);

    if (audioRef.current) {
      const audioSrc = track.audio_url || track.audioUrl || '';
      audioRef.current.src = audioSrc;
      audioRef.current.play().catch(err => console.log('Audio Play Error:', err));
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    const nextIdx = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIdx);
    playTrack(playlist[nextIdx], currentAlbum, playlist);
  };

  const playPrev = () => {
    if (playlist.length === 0) return;
    const prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentIndex(prevIdx);
    playTrack(playlist[prevIdx], currentAlbum, playlist);
  };

  const seek = (percent) => {
    if (audioRef.current && audioRef.current.duration) {
      const targetTime = (percent / 100) * audioRef.current.duration;
      audioRef.current.currentTime = targetTime;
      setProgress(percent);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        setIsPlaying,
        currentTrack,
        currentAlbum,
        playlist,
        togglePlay,
        playTrack,
        playNext,
        playPrev,
        progress,
        currentTime,
        duration,
        seek,
        theme,
        setTheme,
        themeColor,
        setThemeColor,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

// -----------------------------------------------------------------------------
// 2. 核心 Layout 组件
// -----------------------------------------------------------------------------
export default function Layout({ children }) {
  return (
    <AudioProvider>
      <LayoutContent>{children}</LayoutContent>
    </AudioProvider>
  );
}

function LayoutContent({ children }) {
  const router = useRouter();
  const isMusicPage = router.pathname === '/music';

  const {
    isPlaying,
    currentTrack,
    currentAlbum,
    togglePlay,
    progress,
    theme,
    setTheme,
    themeColor,
  } = useAudio();

  // WP8.1 MENU 下拉菜单展开/收起状态
  const [menuOpen, setMenuOpen] = useState(false);

  // `/music` 播放页导航栏隐唤控制
  const [headerVisible, setHeaderVisible] = useState(!isMusicPage);
  const touchStartY = useRef(0);
  const hideTimerRef = useRef(null);

  // 1. 按 ESC 键唤出/隐藏导航栏
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setHeaderVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. 切换路由时更新 Header 隐藏逻辑与收起 MENU
  useEffect(() => {
    setMenuOpen(false);
    setHeaderVisible(!isMusicPage);
  }, [router.pathname, isMusicPage]);

  // 3. 移动端在 /music 页面 Swipe Down (下滑) 手势唤出 Header
  const handleTouchStart = (e) => {
    if (!isMusicPage) return;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!isMusicPage) return;
    const currentY = e.touches[0].clientY;
    if (currentY - touchStartY.current > 50) {
      setHeaderVisible(true);
      resetAutoHideTimer();
    }
  };

  const resetAutoHideTimer = () => {
    if (!isMusicPage) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setHeaderVisible(false);
      setMenuOpen(false);
    }, 4000);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-500 font-serif relative overflow-x-hidden ${
        theme === 'gekkou' ? 'bg-zinc-950 text-zinc-100' : 'bg-[#f4f3ef] text-zinc-900'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* ------------------- 顶部毛玻璃导航栏 (Header) ------------------- */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-in-out ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        } bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md border-b border-current/10`}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex justify-between items-center relative">
          
          {/* 左侧: Logo (01.jpg 与 02.jpg 双图标紧挨并排) */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="flex items-center space-x-1">
              <div
                className="w-7 h-7 bg-cover bg-center border border-current/20 shadow-sm"
                style={{ backgroundImage: `url('/01.jpg')` }}
              />
              <div
                className="w-7 h-7 bg-cover bg-center border border-current/20 shadow-sm"
                style={{ backgroundImage: `url('/02.jpg')` }}
              />
            </div>
            <span className="font-mono text-xs tracking-widest font-bold uppercase opacity-85 group-hover:opacity-100">
              ヨルシカ <span style={{ color: themeColor }}>/ ARCHIVE</span>
            </span>
          </Link>

          {/* 右侧: [ 夏陰 / 月光 ] 模式切换 & 月光青 MENU 磁贴按键 */}
          <div className="flex items-center space-x-4">
            
            {/* 纯文字主题切换 [ 夏陰 ] / [ 月光 ] */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'natsukage' ? 'gekkou' : 'natsukage')}
              className="font-mono text-xs opacity-75 hover:opacity-100 transition-opacity"
            >
              [ {theme === 'natsukage' ? '夏陰' : '月光'} ]
            </button>

            {/* 月光青 MENU 微交互正方形磁贴 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ backgroundColor: themeColor }}
                className={`text-zinc-950 font-mono font-bold transition-all duration-300 ease-out flex items-center justify-center shadow-sm overflow-hidden ${
                  menuOpen
                    ? 'w-44 h-10 rounded-none text-xs tracking-widest'
                    : 'w-10 h-10 rounded-none text-[10px] leading-tight'
                }`}
              >
                {menuOpen ? (
                  <span>[ MENU ]</span>
                ) : (
                  <div className="flex flex-col items-center">
                    <span>ME</span>
                    <span>NU</span>
                  </div>
                )}
              </button>

              {/* 弹出月光青色列表 (无横隔线，微小空隙，整合外链与 Bilibili/Github) */}
              {menuOpen && (
                <div
                  style={{ backgroundColor: themeColor }}
                  className="absolute right-0 top-12 w-44 shadow-2xl p-3 space-y-3 text-zinc-950 font-mono text-xs animate-in fade-in slide-in-from-top-2 duration-200 z-50"
                >
                  {/* 核心 5 大页面 */}
                  <div className="space-y-1.5">
                    <Link
                      href="/"
                      onClick={() => setMenuOpen(false)}
                      className="block hover:translate-x-1 transition-transform"
                    >
                      01. INDEX
                    </Link>
                    <Link
                      href="/music"
                      onClick={() => setMenuOpen(false)}
                      className="block hover:translate-x-1 transition-transform"
                    >
                      02. MUSIC
                    </Link>
                    <Link
                      href="/submit"
                      onClick={() => setMenuOpen(false)}
                      className="block hover:translate-x-1 transition-transform"
                    >
                      03. SUBMIT
                    </Link>
                    <Link
                      href="/about"
                      onClick={() => setMenuOpen(false)}
                      className="block hover:translate-x-1 transition-transform"
                    >
                      04. ABOUT
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="block hover:translate-x-1 transition-transform"
                    >
                      05. ADMIN
                    </Link>
                  </div>

                  {/* 3 大外链分站 (GALLERY, FORUM, MAGAZINE) */}
                  <div className="space-y-1.5 pt-2 text-[11px] opacity-90 border-t border-zinc-950/10">
                    <a
                      href="https://3000-687cf3853f2f7d36.monkeycode-ai.live/gallery"
                      target="_blank"
                      rel="noreferrer"
                      className="block hover:translate-x-1 transition-transform"
                    >
                      GALLERY &gt;
                    </a>
                    <a
                      href="https://3000-687cf3853f2f7d36.monkeycode-ai.live/forum"
                      target="_blank"
                      rel="noreferrer"
                      className="block hover:translate-x-1 transition-transform"
                    >
                      FORUM &gt;
                    </a>
                    <a
                      href="https://3000-687cf3853f2f7d36.monkeycode-ai.live/magazine"
                      target="_blank"
                      rel="noreferrer"
                      className="block hover:translate-x-1 transition-transform"
                    >
                      MAGAZINE &gt;
                    </a>
                  </div>

                  {/* 原底部栏移入这里的社交链接 (BILIBILI, GITHUB) */}
                  <div className="pt-2 flex justify-between text-[10px] opacity-75 border-t border-zinc-950/10">
                    <a
                      href="https://bilibili.com"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      BILIBILI
                    </a>
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      GITHUB
                    </a>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ------------------- 主页面内容 ------------------- */}
      <main className="pt-14 min-h-screen">{children}</main>

      {/* ------------------- 底部常驻 Mini 播放条 (Global Bottom Bar) ------------------- */}
      {currentTrack && !isMusicPage && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-md border-t border-current/10 px-4 py-2 transition-all duration-300">
          <div className="max-w-6xl mx-auto flex justify-between items-center font-mono">
            
            {/* 左侧: 封面 + 歌曲/艺术家 */}
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 bg-cover bg-center border border-current/20 rounded-none flex-shrink-0"
                style={{
                  backgroundImage: `url(${currentTrack.cover_url || currentTrack.cover || '/01.jpg'})`,
                }}
              />
              <div className="text-xs truncate max-w-[150px] sm:max-w-xs">
                <p className="font-medium truncate">{currentTrack.title || '言の葉'}</p>
                <p className="text-[10px] opacity-60 truncate">{currentTrack.artist || 'ヨルシカ'}</p>
              </div>
            </div>

            {/* 中间: Google Pixel 风格动态波浪进度条 */}
            <div className="hidden sm:flex flex-1 mx-8 items-center space-x-2">
              <div className="h-1 bg-current/20 flex-1 relative overflow-hidden rounded-none">
                <div
                  className="h-full transition-all duration-150"
                  style={{ width: `${progress}%`, backgroundColor: themeColor }}
                />
              </div>
            </div>

            {/* 右侧: 控制按键 [ PLAY / PAUSE ] 与切回 [ MUSIC > ] */}
            <div className="flex items-center space-x-3 text-xs">
              <button
                type="button"
                onClick={togglePlay}
                style={{ color: themeColor }}
                className="font-bold hover:underline"
              >
                [ {isPlaying ? 'PAUSE' : 'PLAY'} ]
              </button>

              <Link
                href={`/music${currentAlbum ? `?album=${currentAlbum.id}` : ''}`}
                className="hover:underline opacity-80"
              >
                [ MUSIC &gt; ]
              </Link>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
// -----------------------------------------------------------------------------
// 2. AudioProvider 核心组件 (包含原版全部 Pixel 进度条与音频控制)
// -----------------------------------------------------------------------------
export function AudioProvider({ children }) {
  const router = useRouter();

  // 音频与播放列表状态
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 ~ 100
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // 全局主题状态
  const [theme, setTheme] = useState('natsukage'); // 'natsukage' (夏陰/日间) | 'gekkou' (月光/夜间)
  const [themeColor, setThemeColor] = useState('#88abac'); // 默认月光青

  // 进站开场动画 State
  const [showIntro, setShowIntro] = useState(false);

  // 检查进站动画 (仅在首页首次进入时触发)
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('yorushika_intro_seen');
    if (!hasSeenIntro && router.pathname === '/') {
      setShowIntro(true);
      const timer = setTimeout(() => {
        setShowIntro(false);
        sessionStorage.setItem('yorushika_intro_seen', 'true');
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [router.pathname]);

  // 初始化 Audio 监听器
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setCurrentTime(audio.currentTime);
        setDuration(audio.duration);
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      playNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [currentIndex, playlist]);

  // 播放 API
  const playTrack = (track, album = null, newPlaylist = []) => {
    if (!track || (!track.audio_url && !track.audioUrl)) return;

    setCurrentTrack(track);
    if (album) setCurrentAlbum(album);
    if (newPlaylist.length > 0) {
      setPlaylist(newPlaylist);
      const idx = newPlaylist.findIndex((s) => s.id === track.id);
      if (idx !== -1) setCurrentIndex(idx);
    }

    if (audioRef.current) {
      audioRef.current.src = track.audio_url || track.audioUrl;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    const nextIdx = (currentIndex + 1) % playlist.length;
    playTrack(playlist[nextIdx], currentAlbum, playlist);
  };

  const playPrev = () => {
    if (playlist.length === 0) return;
    const prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
    playTrack(playlist[prevIdx], currentAlbum, playlist);
  };

  return (
    <AudioContext.Provider
      value={{
        theme,
        setTheme,
        themeColor,
        setThemeColor,
        isPlaying,
        currentTrack,
        currentAlbum,
        playlist,
        currentIndex,
        progress,
        duration,
        currentTime,
        playTrack,
        togglePlay,
        playNext,
        playPrev,
      }}
    >
      {/* 全局容器：配合 CSS 变量 & 主题 Toggle 解决背景黑屏 */}
      <div className={`min-h-screen transition-colors duration-500 font-serif ${
        theme === 'gekkou' ? 'bg-zinc-950 text-zinc-100 dark' : 'bg-stone-50 text-zinc-900'
      }`}>

        {/* 1. 进场动画蒙版 */}
        {showIntro && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-white font-serif animate-out fade-out duration-700">
            <h1 className="text-2xl tracking-widest mb-2 animate-pulse">ヨルシカ</h1>
            <p className="font-mono text-xs opacity-50">[ YORUSHIKA ARCHIVE ]</p>
          </div>
        )}

        {/* 2. 顶栏 Navbar */}
        <Navbar />

        {/* 3. 页面主体 */}
        <main className="w-full">{children}</main>

        {/* 4. 原版底部全功能播放栏 (包含唱片封面 & Pixel 风格波浪进度条) */}
        {currentTrack && (
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-current/10 px-4 py-2 font-mono text-xs">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              
              {/* 左侧: 封面与歌名 */}
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full overflow-hidden border border-current/20 flex-shrink-0 ${
                    isPlaying ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '8s' }}
                >
                  <img
                    src={
                      currentAlbum?.cover_url ||
                      currentAlbum?.coverUrl ||
                      currentTrack.cover_url ||
                      currentTrack.coverUrl ||
                      'https://yorushika-assets.pages.dev/cover/default.jpg'
                    }
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://yorushika-assets.pages.dev/cover/default.jpg';
                    }}
                  />
                </div>
                <div className="text-xs truncate max-w-[150px] sm:max-w-xs">
                  <p className="font-medium truncate">{currentTrack.title || '言の葉'}</p>
                  <p className="text-[10px] opacity-60 truncate">{currentTrack.artist || 'ヨルシカ'}</p>
                </div>
              </div>

              {/* 中间: Google Pixel 风格动态波浪进度条 */}
              <div className="hidden sm:flex flex-1 mx-8 items-center space-x-2">
                <div className="h-1 bg-current/20 flex-1 relative overflow-hidden rounded-none">
                  <div
                    className="h-full transition-all duration-150"
                    style={{ width: `${progress}%`, backgroundColor: themeColor }}
                  />
                </div>
              </div>

              {/* 右侧: 控制按键 [ PLAY / PAUSE ] 与切回 [ MUSIC > ] */}
              <div className="flex items-center space-x-3 text-xs">
                <button
                  type="button"
                  onClick={togglePlay}
                  style={{ color: themeColor }}
                  className="font-bold hover:underline"
                >
                  [ {isPlaying ? 'PAUSE' : 'PLAY'} ]
                </button>

                <Link
                  href={`/music${currentAlbum ? `?album=${currentAlbum.id}` : ''}`}
                  className="hover:underline opacity-80"
                >
                  [ MUSIC &gt; ]
                </Link>
              </div>

            </div>
          </div>
        )}

      </div>
    </AudioContext.Provider>
  );
}

export default AudioProvider;
