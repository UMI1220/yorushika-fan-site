import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// -----------------------------------------------------------------------------
// 1. 全局 Audio & UI 上下文 (Global Audio Context)
// -----------------------------------------------------------------------------
const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export function AudioProvider({ children }) {
  const router = useRouter();

  // 音频状态
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0~100
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // 全局主题状态
  const [theme, setTheme] = useState('natsukage'); // 'natsukage' (夏陰/日间) | 'gekkou' (月光/夜间)
  const [themeColor, setThemeColor] = useState('#88abac'); // 默认月光青，可通过长按磁贴动态覆盖

  // 初始化 Audio 监听
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
      // 自动播放下一首逻辑
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

  // 播放指定曲目
  const playTrack = (track, album, newPlaylist = []) => {
    setCurrentTrack(track);
    if (album) setCurrentAlbum(album);
    if (newPlaylist.length > 0) setPlaylist(newPlaylist);

    if (audioRef.current) {
      audioRef.current.src = track.audioUrl || track.audio_path || '';
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

  // MENU 下拉展开状态
  const [menuOpen, setMenuOpen] = useState(false);

  // /music 页面顶栏自动隐唤控制
  const [headerVisible, setHeaderVisible] = useState(!isMusicPage);
  const touchStartY = useRef(0);
  const hideTimerRef = useRef(null);

  // 1. 监听键盘 ESC 键隐唤顶栏
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setHeaderVisible((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. 路由变更时重置顶栏形态
  useEffect(() => {
    setMenuOpen(false);
    if (isMusicPage) {
      // 进入音乐页，默认向上移出隐藏
      setHeaderVisible(false);
    } else {
      setHeaderVisible(true);
    }
  }, [router.pathname, isMusicPage]);

  // 3. 移动端 Swipe Down 唤出顶栏逻辑
  const handleTouchStart = (e) => {
    if (!isMusicPage) return;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!isMusicPage) return;
    const currentY = e.touches[0].clientY;
    // 下滑距离超过 50px 唤出顶栏
    if (currentY - touchStartY.current > 50) {
      setHeaderVisible(true);
      resetAutoHideTimer();
    }
  };

  // 4. 一段时间无操作自动隐藏顶栏
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
          
          {/* 左侧: Logo & 返回 Home */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div
              className="w-8 h-8 rounded-sm bg-cover bg-center border border-current/20 transition-transform group-hover:scale-105"
              style={{ backgroundImage: `url('/01.jpg')` }}
            />
            <span className="font-mono text-xs tracking-widest font-bold opacity-80 group-hover:opacity-100">
              ヨルシカ / YORUSHIKA
            </span>
          </Link>

          {/* 中右侧: [ 夏陰 / 月光 ] 主题切换 & 正方形 MENU */}
          <div className="flex items-center space-x-4">
            
            {/* 纯文字主题切换 */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'natsukage' ? 'gekkou' : 'natsukage')}
              className="font-mono text-xs opacity-70 hover:opacity-100 transition-opacity"
            >
              [ {theme === 'natsukage' ? '夏陰' : '月光'} ]
            </button>

            {/* WP8.1 风格 MENU 按钮 (拉伸与展开) */}
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

              {/* 下拉列表 (与拉伸后的 MENU 完全等宽, 稍有间隙, 纯文字列表) */}
              {menuOpen && (
                <div
                  style={{ backgroundColor: themeColor }}
                  className="absolute right-0 top-12 w-44 shadow-2xl p-3 space-y-2 text-zinc-950 font-mono text-xs animate-in fade-in slide-in-from-top-2 duration-200 z-50"
                >
                  {/* 核心页面 */}
                  <div className="space-y-1 pb-2 border-b border-zinc-950/20">
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
                      href="/music/submit"
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

                  {/* 三大分站 (外链直达) */}
                  <div className="space-y-1 py-2 border-b border-zinc-950/20 text-[11px] opacity-90">
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

                  {/* 社交 / 脚标 */}
                  <div className="pt-1 flex justify-between text-[10px] opacity-75">
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

      {/* ------------------- 主页面内容容器 ------------------- */}
      <main className="pt-14 min-h-screen">{children}</main>

      {/* ------------------- 底部常驻 Mini 播放条 (Global Bottom Mini Bar) ------------------- */}
      {/* 仅在：有歌曲处于队列，且当前页面不是 /music 时显示 */}
      {currentTrack && !isMusicPage && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/70 dark:bg-zinc-900/80 backdrop-blur-md border-t border-current/10 px-4 py-2 transition-all duration-300">
          <div className="max-w-6xl mx-auto flex justify-between items-center font-mono">
            
            {/* 左侧: 封面 + 歌名/歌手 */}
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 bg-cover bg-center rounded-none border border-current/20 flex-shrink-0"
                style={{
                  backgroundImage: `url(${currentTrack.coverUrl || currentTrack.cover || '/covers/01.jpg'})`,
                }}
              />
              <div className="text-xs truncate max-w-[150px] sm:max-w-xs">
                <p className="font-medium truncate">{currentTrack.title || currentTrack.name || '言の葉'}</p>
                <p className="text-[10px] opacity-60 truncate">{currentTrack.artist || 'ヨルシカ'}</p>
              </div>
            </div>

            {/* 中间: Google Pixel 动态波浪进度条 */}
            <div className="hidden sm:flex flex-1 mx-8 items-center space-x-2">
              <div className="h-1 bg-current/20 flex-1 relative overflow-hidden rounded-full">
                <div
                  className="h-full transition-all duration-150"
                  style={{ width: `${progress}%`, backgroundColor: themeColor }}
                />
              </div>
            </div>

            {/* 右侧: 控制按键 [ PLAY / PAUSE ] & 切回播放页 [ MUSIC > ] */}
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
