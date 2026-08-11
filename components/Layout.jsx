import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import IntroOverlay from './IntroOverlay';

// -----------------------------------------------------------------------------
// 1. 全局 Audio & UI 核心上下文 (Global Audio & Layout Context)
// -----------------------------------------------------------------------------
const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
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
      shadowStyle: '',
      hasEntered: false,
      setHasEntered: () => {},
      setTheme: () => {},
      toggleTheme: () => {},
      setThemeColor: () => {},
      playTrack: () => {},
      togglePlay: () => {},
      playNext: () => {},
      playPrev: () => {},
      seek: () => {},
    };
  }
  return context;
};

export function AudioProvider({ children }) {
  const router = useRouter();

  // 1. 进站动画控制状态
  const [hasEntered, setHasEntered] = useState(false);

  // 2. 主题管理 ('natsukage' 夏陰 | 'gekkou' 月光)
  const [theme, setTheme] = useState('natsukage');
  const [themeColor, setThemeColor] = useState('#88abac');

  // 初始化主题（从 localStorage 读取历史设定）
  useEffect(() => {
    const savedTheme = localStorage.getItem('yorushika_theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // 核心：切换主题并同步存储到本地
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === 'natsukage' ? 'gekkou' : 'natsukage';
      localStorage.setItem('yorushika_theme', nextTheme);
      return nextTheme;
    });
  };

  // 3. 坚果 OS 动态感知物理光影（夏陰: 随现实时间演变的日光倾斜与影子 | 月光: 浓郁沉浸夜间阴影）
  const [shadowStyle, setShadowStyle] = useState('');

  useEffect(() => {
    const updateShadow = () => {
      const now = new Date();
      const hours = now.getHours() + now.getMinutes() / 60;

      if (theme === 'gekkou') {
        // [月光模式]：深沉立体悬浮阴影（对应规范要求）
        setShadowStyle('0px 14px 32px rgba(0, 0, 0, 0.85), 0px 4px 12px rgba(0, 0, 0, 0.6)');
      } else {
        // [夏陰模式]：模拟现实日光移动 (晨昏角度倾斜与长影演变，对应规范要求)
        const angle = ((hours - 6) / 12) * Math.PI;
        const offsetX = Math.cos(angle) * 12;
        const offsetY = Math.sin(angle) * 14 + 6;
        setShadowStyle(
          `${offsetX.toFixed(1)}px ${offsetY.toFixed(1)}px 24px rgba(0, 0, 0, 0.12), ${(offsetX * 0.5).toFixed(1)}px ${(offsetY * 0.5).toFixed(1)}px 8px rgba(0, 0, 0, 0.08)`
        );
      }
    };

    updateShadow();
    const interval = setInterval(updateShadow, 60000); // 每分钟实时更新角度
    return () => clearInterval(interval);
  }, [theme]);

  // 4. 全局音频播放控制状态
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const playTrack = (track, album = null, newPlaylist = []) => {
    if (track) {
      setCurrentTrack(track);
      if (album) setCurrentAlbum(album);
      if (newPlaylist && newPlaylist.length > 0) {
        setPlaylist(newPlaylist);
        const idx = newPlaylist.findIndex((t) => t.id === track.id);
        if (idx !== -1) setCurrentIndex(idx);
      }
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const playNext = () => {
    if (playlist.length > 0) {
      const nextIdx = (currentIndex + 1) % playlist.length;
      setCurrentIndex(nextIdx);
      setCurrentTrack(playlist[nextIdx]);
    }
  };

  const playPrev = () => {
    if (playlist.length > 0) {
      const prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
      setCurrentIndex(prevIdx);
      setCurrentTrack(playlist[prevIdx]);
    }
  };

  const seek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        theme,
        themeColor,
        isPlaying,
        currentTrack,
        currentAlbum,
        playlist,
        currentIndex,
        progress,
        duration,
        currentTime,
        shadowStyle,
        hasEntered,
        setHasEntered,
        setTheme,
        toggleTheme,
        setThemeColor,
        playTrack,
        togglePlay,
        playNext,
        playPrev,
        seek,
      }}
    >
      {children}
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.audio_url}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
              setDuration(audioRef.current.duration || 0);
              setProgress(
                (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100
              );
            }
          }}
          onEnded={playNext}
          autoPlay
        />
      )}
    </AudioContext.Provider>
  );
}

// -----------------------------------------------------------------------------
// 2. 主 Layout 容器组件
// -----------------------------------------------------------------------------
export default function Layout({ children }) {
  const router = useRouter();
  const {
    theme,
    toggleTheme,
    themeColor,
    hasEntered,
    setHasEntered,
    currentTrack,
    currentAlbum,
    isPlaying,
    togglePlay,
    progress,
  } = useAudio();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      className={`min-h-screen transition-colors duration-500 font-sans ${
        theme === 'gekkou' ? 'bg-[#121212] text-white/90' : 'bg-[#fdfbf7] text-[#2c2c2c]'
      }`}
    >
      {/* 1. 进站动画 (未进入状态时全屏覆盖) */}
      {!hasEntered && (
        <IntroOverlay onComplete={() => setHasEntered(true)} />
      )}

      {/* 2. 顶部导航栏 */}
      <header
        className={`sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors duration-300 ${
          theme === 'gekkou'
            ? 'bg-[#121212]/80 border-white/10'
            : 'bg-[#fdfbf7]/80 border-black/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo 区域 */}
          <Link href="/" className="flex items-center space-x-2.5 cursor-pointer">
            <img src="/01.jpg" alt="Logo" className="w-8 h-8 object-cover rounded-none" />
            <span className="font-mono text-xs font-bold tracking-widest">YORUSHIKA ARCHIVE</span>
          </Link>

          {/* 右侧控制区：切换按钮 + MENU 按钮 */}
          <div className="flex items-center space-x-3">
            {/* 核心修复：夏陰 / 月光 点击按钮 */}
            <button
              type="button"
              onClick={toggleTheme}
              className="px-2.5 py-1 font-mono text-xs border border-current/20 hover:bg-current/10 transition-colors cursor-pointer"
            >
              [ {theme === 'gekkou' ? '月光' : '夏陰'} ]
            </button>

            {/* ME/NU 方块按钮 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 flex flex-col items-center justify-center font-mono text-[10px] leading-none bg-[#88abac] text-white cursor-pointer shadow-sm hover:opacity-90"
              >
                <span>ME</span>
                <span>NU</span>
              </button>

              {/* 下拉菜单 */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#88abac] text-white font-mono text-xs shadow-2xl z-50 p-2 space-y-1">
                  <Link
                    href="/"
                    onClick={() => setIsMenuOpen(false)}
                    className="block p-2 hover:bg-white/10"
                  >
                    [ INDEX / 首页 ]
                  </Link>
                  <Link
                    href="/music"
                    onClick={() => setIsMenuOpen(false)}
                    className="block p-2 hover:bg-white/10"
                  >
                    [ MUSIC / 音乐 ]
                  </Link>
                  <Link
                    href="/submit"
                    onClick={() => setIsMenuOpen(false)}
                    className="block p-2 hover:bg-white/10"
                  >
                    [ SUBMIT / 补充修改 ]
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setIsMenuOpen(false)}
                    className="block p-2 hover:bg-white/10"
                  >
                    [ ABOUT / 关于 ]
                  </Link>
                  <div className="pt-2 border-t border-white/20 text-[10px] space-y-1 opacity-80">
                    <a
                      href="https://space.bilibili.com/23201889"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-2 hover:underline"
                    >
                      [ BILIBILI &gt; ]
                    </a>
                    <a
                      href="https://github.com/UMI1220/yorushika-assets"
                      target="_blank"
                      rel="noreferrer"
                      className="block px-2 hover:underline"
                    >
                      [ GITHUB &gt; ]
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. 页面主体内容 */}
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>

      {/* 4. 底部悬浮播放条 */}
      {currentTrack && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-md px-4 py-2 transition-all ${
            theme === 'gekkou' ? 'bg-[#181818]/90 border-white/10' : 'bg-[#ffffff]/90 border-black/10'
          }`}
        >
          <div className="max-w-7xl mx-auto flex flex-col space-y-1">
            <div className="w-full bg-current/10 h-1 overflow-hidden">
              <div
                className="h-full transition-all duration-150"
                style={{ width: `${progress}%`, backgroundColor: themeColor }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-3 overflow-hidden">
                <img
                  src={currentTrack.cover_url || currentAlbum?.cover_url || '/01.jpg'}
                  alt={currentTrack.title}
                  className="w-9 h-9 object-cover flex-shrink-0"
                />
                <div className="text-xs truncate max-w-[140px]">
                  <p className="font-bold truncate">{currentTrack.title || '盗作'}</p>
                  <p className="opacity-60 text-[10px] truncate">
                    {currentTrack.artist || 'ヨルシカ'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs font-bold font-mono">
                <button
                  type="button"
                  onClick={togglePlay}
                  style={{ color: themeColor }}
                  className="hover:underline cursor-pointer"
                >
                  [ {isPlaying ? 'PAUSE' : 'PLAY'} ]
                </button>
                <Link href="/music" className="opacity-80 hover:opacity-100">
                  [ MUSIC &gt; ]
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
