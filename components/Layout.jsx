import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

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

  // 进站动画控制
  const [hasEntered, setHasEntered] = useState(false);

  // 全局音频播放控制
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // 主题（'natsukage' 夏陰 / 'gekko' 月光）与 Monet 动态取色（默认月光青 #88abac）
  const [theme, setTheme] = useState('natsukage');
  const [themeColor, setThemeColor] = useState('#88abac');

  // Smartisan OS (坚果 OS) 物理感知光影
  const [shadowStyle, setShadowStyle] = useState('6px 6px 16px rgba(0,0,0,0.12)');

  // 1. 计算 Smartisan OS 斜射日光/月光物理阴影
  useEffect(() => {
    const updateShadow = () => {
      const hour = new Date().getHours();
      // 白天 6-12点 (日光自左上斜射，阴影向右下)
      // 白天 12-18点 (日光自右上斜射，阴影向左下)
      // 夜间 18-6点 (柔和月光弥散阴影)
      if (hour >= 6 && hour < 12) {
        const offset = Math.floor((hour - 6) * 1.5);
        setShadowStyle(`${6 + offset}px ${8 + offset}px 18px rgba(0, 0, 0, 0.12)`);
      } else if (hour >= 12 && hour < 18) {
        const offset = Math.floor((18 - hour) * 1.5);
        setShadowStyle(`-${6 + offset}px ${8 + offset}px 18px rgba(0, 0, 0, 0.12)`);
      } else {
        setShadowStyle('0px 8px 24px rgba(0, 0, 0, 0.28)');
      }
    };
    updateShadow();
    const interval = setInterval(updateShadow, 600000); // 每10分钟计算一次太阳角度
    return () => clearInterval(interval);
  }, []);

  // 2. Google Pixel 动态 Monet 算法 (从封面抽取核心主色并覆盖全站月光青)
  const extractMonetColor = (imgUrl) => {
    if (!imgUrl) return;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imgUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 32;
        canvas.height = 32;
        ctx.drawImage(img, 0, 0, 32, 32);
        const data = ctx.getImageData(0, 0, 32, 32).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        
        // 保证色彩纯度适中，不至于过暗或过亮
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        setThemeColor(hex);
      } catch (e) {
        // 跨域或图片读取失败时保持默认月光青
        setThemeColor('#88abac');
      }
    };
  };

  // 3. 播放器控制核心方法
  const playTrack = (track, album = null, list = []) => {
    setCurrentTrack(track);
    if (album) setCurrentAlbum(album);
    if (list && list.length > 0) {
      setPlaylist(list);
      const idx = list.findIndex((t) => t.id === track.id);
      if (idx !== -1) setCurrentIndex(idx);
    }

    // 触发 Monet 取色算法，改变全站月光青主色
    const cover = track.cover_url || album?.cover_url;
    if (cover) extractMonetColor(cover);

    if (audioRef.current) {
      audioRef.current.src = track.audio_url || '';
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
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

  const seek = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 1;
      setCurrentTime(cur);
      setDuration(dur);
      setProgress((cur / dur) * 100);
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
        setThemeColor,
        playTrack,
        togglePlay,
        playNext,
        playPrev,
        seek,
      }}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={playNext}
        style={{ display: 'none' }}
      />
      {children}
    </AudioContext.Provider>
  );
}
// -----------------------------------------------------------------------------
// 2. 主 Layout 组件（全量 UI、物理拉伸 MENU、多端 Navbar 唤出 & 底部 Mini 播放器）
// -----------------------------------------------------------------------------
export default function Layout({ children }) {
  const router = useRouter();
  const {
    theme,
    setTheme,
    themeColor,
    shadowStyle,
    isPlaying,
    currentTrack,
    currentAlbum,
    progress,
    togglePlay,
  } = useAudio();

  // MENU 展开状态
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 导航栏隐现逻辑控制（含滚屏与移动端下滑唤出）
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    // 监听页面滚动隐现
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // 展开菜单时不隐藏 Navbar，防止菜单被突然裁切
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        if (!isMenuOpen) setNavVisible(false); // 向下滑动隐藏
      } else {
        setNavVisible(true); // 向上滑动显示
      }
      lastScrollY.current = currentScrollY;
    };

    // 移动端下划唤出 (Touch Gesture)
    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const touchCurrentY = e.touches[0].clientY;
      // 手机端向下滑（Y增加 > 30px）直接平滑唤出 Navbar
      if (touchCurrentY - touchStartY.current > 30) {
        setNavVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMenuOpen]);

  // 路由切换时自动关闭 MENU 菜单
  useEffect(() => {
    setIsMenuOpen(false);
  }, [router.pathname]);

  return (
    <div
      className={`min-h-screen transition-colors duration-500 font-sans select-none relative ${
        theme === 'gekko'
          ? 'bg-[#12181a] text-[#a5c9ca]'
          : 'bg-[#faf8f5] text-[#2c3e50]'
      }`}
    >
      {/* --------------------------------------------------------------------- */}
      {/* 1. 顶部毛玻璃导航栏 (Header Bar - z-index 50 确保最高点击层级)           */}
      {/* --------------------------------------------------------------------- */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out backdrop-blur-md border-b ${
          theme === 'gekko'
            ? 'bg-[#12181a]/70 border-white/10'
            : 'bg-[#faf8f5]/80 border-black/5'
        } ${navVisible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* 左侧双 Logo (01.jpg & 02.jpg 并排，月光模式下优雅反色) */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div
              className={`flex items-center space-x-1.5 transition-all duration-300 ${
                theme === 'gekko' ? 'filter invert-[0.9] hue-rotate-180' : ''
              }`}
            >
              <img
                src="/01.jpg"
                alt="Yorushika Logo 1"
                className="h-8 w-auto object-contain transition-opacity duration-300 group-hover:opacity-80"
              />
              <img
                src="/02.jpg"
                alt="Yorushika Logo 2"
                className="h-8 w-auto object-contain transition-opacity duration-300 group-hover:opacity-80"
              />
            </div>
          </Link>

          {/* 右侧控件区域：[ 夏陰 / 月光 ] 主题切换与物理变形 MENU 按钮 */}
          <div className="flex items-center space-x-4">
            {/* 主题切换按钮 */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'natsukage' ? 'gekko' : 'natsukage')}
              className="text-xs tracking-wider transition-opacity hover:opacity-70 font-medium cursor-pointer"
            >
              [ {theme === 'natsukage' ? '夏陰' : '月光'} ]
            </button>

            {/* 🍔 MENU 控件 (物理横向拉伸 + ME/NU 合并为 [ MENU ]) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ backgroundColor: themeColor }}
                className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] text-white shadow-md flex items-center justify-center font-bold text-xs tracking-wider cursor-pointer ${
                  isMenuOpen
                    ? 'w-48 h-10 rounded-none px-3' // 展开状态：变长为与下拉菜单同宽的长方形
                    : 'w-10 h-10 rounded-none'     // 默认状态：正方形
                }`}
              >
                {isMenuOpen ? (
                  <span>[ MENU ]</span>
                ) : (
                  <div className="flex flex-col leading-none text-[10px] text-center">
                    <span>ME</span>
                    <span>NU</span>
                  </div>
                )}
              </button>

              {/* MENU 下拉列表 (微小空隙，无分隔线，月光青与 Monet 实时配色) */}
              {isMenuOpen && (
                <div
                  style={{ backgroundColor: themeColor, boxShadow: shadowStyle }}
                  className="absolute right-0 top-12 w-48 py-3 text-white z-50 transition-all duration-300 animate-fadeIn"
                >
                  <nav className="flex flex-col text-xs font-medium space-y-2.5 px-4">
                    {/* 站内核心页面 */}
                    <Link href="/" className="hover:translate-x-1 transition-transform opacity-90 hover:opacity-100">
                      [ INDEX ]
                    </Link>
                    <Link href="/music" className="hover:translate-x-1 transition-transform opacity-90 hover:opacity-100">
                      [ MUSIC ]
                    </Link>
                    <Link href="/submit" className="hover:translate-x-1 transition-transform opacity-90 hover:opacity-100">
                      [ SUBMIT ]
                    </Link>
                    <Link href="/about" className="hover:translate-x-1 transition-transform opacity-90 hover:opacity-100">
                      [ ABOUT ]
                    </Link>
                    <Link href="/admin" className="hover:translate-x-1 transition-transform opacity-90 hover:opacity-100">
                      [ ADMIN ]
                    </Link>

                    {/* 三大分站 / 概念专辑外链 */}
                    <div className="my-1 border-t border-white/20 pt-2 flex flex-col space-y-2.5">
                      <a
                        href="https://yorushika-fan-chapter.online/forum"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:translate-x-1 transition-transform opacity-90 hover:opacity-100"
                      >
                        [ forum ]
                      </a>
                      <a
                        href="https://yorushika-fan-chapter.online/magazine"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:translate-x-1 transition-transform opacity-90 hover:opacity-100"
                      >
                        [ magazine ]
                      </a>
                      <a
                        href="https://yorushika-fan-chapter.online/gallery"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:translate-x-1 transition-transform opacity-90 hover:opacity-100"
                      >
                        [ gallery ]
                      </a>
                    </div>

                    {/* 社区与 GitHub 官方外链 */}
                    <div className="border-t border-white/20 pt-2 flex flex-col space-y-2.5">
                      <a
                        href="https://space.bilibili.com/3546934872640225"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:translate-x-1 transition-transform opacity-90 hover:opacity-100"
                      >
                        [ Bilibili ]
                      </a>
                      <a
                        href="https://github.com/UMI1220"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:translate-x-1 transition-transform opacity-90 hover:opacity-100"
                      >
                        [ GitHub ]
                      </a>
                    </div>
                  </nav>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* 2. 主页面内容挂载区 (Main Content)                                     */}
      {/* --------------------------------------------------------------------- */}
      <main className="pt-20 pb-24 min-h-screen px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>

      {/* --------------------------------------------------------------------- */}
      {/* 3. 底部全局 Mini 播放器 (Global Mini Player - 有播放曲目时常驻浮现)    */}
      {/* --------------------------------------------------------------------- */}
      {currentTrack && (
        <div
          style={{ boxShadow: shadowStyle }}
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 z-40 transition-all duration-300 p-3 backdrop-blur-lg border ${
            theme === 'gekko'
              ? 'bg-[#12181a]/90 border-white/10 text-white'
              : 'bg-white/90 border-black/5 text-[#2c3e50]'
          }`}
        >
          {/* Pixel 风格动态进度条 */}
          <div className="w-full bg-current/10 h-1 mb-2 relative overflow-hidden">
            <div
              className="h-full transition-all duration-150"
              style={{ width: `${progress}%`, backgroundColor: themeColor }}
            />
          </div>

          <div className="flex items-center justify-between">
            {/* 左侧：专辑/歌曲信息 */}
            <div className="flex items-center space-x-3 overflow-hidden">
              <img
                src={currentTrack.cover_url || currentAlbum?.cover_url || '/01.jpg'}
                alt={currentTrack.title}
                className="w-10 h-10 object-cover flex-shrink-0"
              />
              <div className="text-xs truncate max-w-[140px]">
                <p className="font-bold truncate">{currentTrack.title || '盗作'}</p>
                <p className="opacity-60 text-[10px] truncate">{currentTrack.artist || 'ヨルシカ'}</p>
              </div>
            </div>

            {/* 右侧：播放/暂停控制与快捷进入播放页 */}
            <div className="flex items-center space-x-3 text-xs font-bold">
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
      )}
    </div>
  );
}
