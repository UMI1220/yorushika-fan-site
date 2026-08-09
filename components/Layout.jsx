import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// 1. 创建全局 Audio Context
export const AudioContext = createContext(null);

export function useAudio() {
  return useContext(AudioContext);
}

export default function Layout({ children }) {
  const router = useRouter();
  const isMusicPage = router.pathname === '/music';

  // 全局播放状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState({
    id: 1,
    title: '言の葉',
    artist: 'ヨルシカ',
    cover: '/covers/01.jpg',
    src: 'https://cdn.example.com/music/kotonoha.mp3',
  });
  const [progress, setProgress] = useState(35); // 0 - 100

  // 全局主题状态: 'natsukage' (夏陰/日间) | 'gekkou' (月光/夜间暗化)
  const [theme, setTheme] = useState('natsukage');

  // MENU 导航栏展开状态
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 音乐播放页导航栏显隐状态 (默认隐藏)
  const [showNavInMusic, setShowNavInMusic] = useState(false);

  // 监听键盘 ESC 键唤出/收起播放页导航栏
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMusicPage) {
        setShowNavInMusic((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMusicPage]);

  // 监听移动端向下滑动唤出导航栏
  const touchStartY = useRef(0);
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    if (isMusicPage && touchEndY - touchStartY.current > 60) {
      // 向下滑动超过 60px 唤出顶栏
      setShowNavInMusic(true);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'natsukage' ? 'gekkou' : 'natsukage'));
  };

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        setIsPlaying,
        currentTrack,
        setCurrentTrack,
        progress,
        setProgress,
        theme,
        setTheme,
      }}
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`min-h-screen transition-colors duration-500 font-serif select-none relative ${
          theme === 'gekkou' ? 'bg-zinc-950 text-zinc-100' : 'bg-[#f4f3ef] text-zinc-800'
        }`}
      >
        {/* 顶部毛玻璃 Header */}
        <header
          className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-out backdrop-blur-md border-b ${
            theme === 'gekkou'
              ? 'bg-zinc-950/70 border-white/5'
              : 'bg-white/70 border-black/5'
          } ${
            isMusicPage && !showNavInMusic && !isMenuOpen
              ? '-translate-y-full'
              : 'translate-y-0'
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 h-14 flex justify-between items-center relative">
            {/* 左侧 夜鹿 Logo (点击返回主页) */}
            <Link href="/" className="flex items-center space-x-3 group">
              <span className="font-mono text-xs tracking-widest font-bold text-[#88abac] group-hover:text-[#6a8d8e] transition">
                YORUSHIKA
              </span>
              <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest hidden sm:inline">
                / 音楽泥棒の庭
              </span>
            </Link>

            {/* 右侧 MENU 拉伸伸缩按键组件 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className={`h-10 bg-[#88abac] hover:bg-[#789b9c] text-zinc-950 font-mono font-bold text-xs tracking-wider transition-all duration-300 ease-in-out flex items-center justify-center shadow-md ${
                  isMenuOpen ? 'w-48 sm:w-56 px-4' : 'w-10 h-10'
                }`}
                style={{
                  boxShadow:
                    theme === 'natsukage'
                      ? '0 4px 12px rgba(136,171,172,0.3)'
                      : '0 4px 12px rgba(0,0,0,0.5)',
                }}
              >
                {isMenuOpen ? (
                  <span className="animate-in fade-in duration-200">MENU</span>
                ) : (
                  <div className="flex flex-col text-[9px] leading-tight text-center">
                    <span>ME</span>
                    <span>NU</span>
                  </div>
                )}
              </button>

              {/* 展开的月光青下拉菜单 (完全等宽对齐，无实线分割) */}
              {isMenuOpen && (
                <div
                  className="absolute right-0 top-12 w-48 sm:w-56 bg-[#88abac] text-zinc-950 font-mono text-xs shadow-2xl p-4 space-y-3 z-50 animate-in slide-in-from-top-2 duration-300"
                  style={{
                    boxShadow: '0 16px 32px rgba(0,0,0,0.3)',
                  }}
                >
                  <div className="flex justify-between items-center border-b border-zinc-900/10 pb-2 mb-2 text-[10px] opacity-60">
                    <span>NAVIGATION</span>
                    <button
                      type="button"
                      onClick={() => setIsMenuOpen(false)}
                      className="hover:font-bold"
                    >
                      [ CLOSE ]
                    </button>
                  </div>

                  {/* 核心页面 */}
                  <nav className="space-y-2">
                    <Link
                      href="/"
                      onClick={() => setIsMenuOpen(false)}
                      className="block hover:translate-x-1 transition opacity-80 hover:opacity-100"
                    >
                      01. INDEX / 主页
                    </Link>
                    <Link
                      href="/music"
                      onClick={() => setIsMenuOpen(false)}
                      className="block hover:translate-x-1 transition opacity-80 hover:opacity-100"
                    >
                      02. MUSIC / 播放器
                    </Link>
                    <Link
                      href="/submit"
                      onClick={() => setIsMenuOpen(false)}
                      className="block hover:translate-x-1 transition opacity-80 hover:opacity-100"
                    >
                      03. SUBMIT / 贡献
                    </Link>
                    <Link
                      href="/about"
                      onClick={() => setIsMenuOpen(false)}
                      className="block hover:translate-x-1 transition opacity-80 hover:opacity-100"
                    >
                      04. ABOUT / 关于
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="block hover:translate-x-1 transition opacity-80 hover:opacity-100"
                    >
                      05. ADMIN / 管理
                    </Link>
                  </nav>

                  {/* 三大分站 */}
                  <div className="pt-2 border-t border-zinc-900/10 space-y-1.5 text-[11px]">
                    <a
                      href="https://yorushika-fan-chapter.online/gallery"
                      target="_blank"
                      rel="noreferrer"
                      className="block hover:translate-x-1 transition opacity-70 hover:opacity-100"
                    >
                      GALLERY / 画廊 ↗
                    </a>
                    <a
                      href="https://yorushika-fan-chapter.online/forum"
                      target="_blank"
                      rel="noreferrer"
                      className="block hover:translate-x-1 transition opacity-70 hover:opacity-100"
                    >
                      FORUM / 论坛 ↗
                    </a>
                    <a
                      href="https://yorushika-fan-chapter.online/magazine"
                      target="_blank"
                      rel="noreferrer"
                      className="block hover:translate-x-1 transition opacity-70 hover:opacity-100"
                    >
                      MAGAZINE / 刊物 ↗
                    </a>
                  </div>

                  {/* 外链与主题切换 */}
                  <div className="pt-2 border-t border-zinc-900/10 flex justify-between items-center text-[10px]">
                    <a
                      href="https://space.bilibili.com"
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
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="font-bold border border-zinc-950/30 px-1.5 py-0.5 hover:bg-zinc-950 hover:text-[#88abac] transition"
                    >
                      [ {theme === 'natsukage' ? '夏陰' : '月光'} ]
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 主内容区域 (播放页预留全屏，非播放页留出顶栏高度) */}
        <main className={isMusicPage ? 'pt-0' : 'pt-16'}>{children}</main>

        {/* 离场常驻底部 Mini 播放控制条 (仅在非播放页且有曲目时显示) */}
        {!isMusicPage && currentTrack && (
          <div
            className={`fixed bottom-0 left-0 right-0 z-40 h-12 border-t backdrop-blur-md px-4 flex justify-between items-center font-mono text-xs ${
              theme === 'gekkou'
                ? 'bg-zinc-950/80 border-white/10 text-zinc-200'
                : 'bg-white/80 border-black/10 text-zinc-800'
            }`}
            style={{
              boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
            }}
          >
            {/* 曲名与封面 */}
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 bg-zinc-700 bg-cover bg-center border border-white/10"
                style={{ backgroundImage: `url(${currentTrack.cover})` }}
              />
              <div className="text-[11px] leading-tight">
                <div className="font-bold truncate max-w-[120px] sm:max-w-[200px]">
                  {currentTrack.title}
                </div>
                <div className="opacity-50 text-[9px]">{currentTrack.artist}</div>
              </div>
            </div>

            {/* Google Pixel 波浪进度条微缩版 */}
            <div className="hidden sm:flex flex-1 max-w-xs mx-6 items-center space-x-1">
              <div className="h-1 flex-1 bg-zinc-700 relative overflow-hidden rounded-full">
                <div
                  className="h-full bg-[#88abac] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 文字控制按键 (无 Emoji) */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="hover:text-[#88abac] transition font-bold text-[10px]"
              >
                [ {isPlaying ? 'PAUSE' : 'PLAY'} ]
              </button>
              <Link
                href="/music"
                className="bg-[#88abac] text-zinc-950 px-2 py-1 text-[10px] font-bold hover:bg-[#789b9c] transition"
              >
                MUSIC &gt;
              </Link>
            </div>
          </div>
        )}
      </div>
    </AudioContext.Provider>
  );
}
