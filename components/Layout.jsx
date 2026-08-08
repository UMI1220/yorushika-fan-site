import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import IntroOverlay from './IntroOverlay';

export default function Layout({ children, isMoonlight = false, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // 社区分站外链地址（可根据实际分站域名修改）
  const SUB_STATION_URL = 'https://sub.yorushika.club'; 

  return (
    <>
      <Head>
        <title>ヨルシカ FanSite</title>
        <link rel="icon" type="image/jpeg" href="/covers/0.jpg?v=2" />
        <link rel="shortcut icon" href="/covers/0.jpg?v=2" />
      </Head>

      {/* 开场视频动画蒙层 */}
      <IntroOverlay />

      <div className={`min-h-screen flex flex-col transition-colors duration-500 font-sans tracking-wide ${
        isMoonlight ? 'bg-zinc-950 text-zinc-100' : 'bg-[#fafafa] text-zinc-800'
      }`}>
        
        {/* 顶部 Header：保留原有的毛玻璃质感 */}
        <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-500 px-4 sm:px-8 py-3.5 ${
          isMoonlight ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-zinc-200/80'
        }`}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            
            {/* 保留原 LOGO 区域：眼睛 (01.jpg) + 手写日文 (02.jpg) */}
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group shrink-0">
              <img 
                src="/01.jpg" 
                alt="Yorushika Eye Logo" 
                className="h-7 sm:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
              />
              <img 
                src="/02.jpg" 
                alt="Yorushika Text Logo" 
                className={`h-6 sm:h-8 w-auto object-contain transition-opacity duration-300 ${
                  isMoonlight ? 'invert opacity-90' : 'opacity-80 group-hover:opacity-100'
                }`} 
              />
            </Link>

            {/* 右侧操作区：模式切换 + 月光青 MENU 按钮 */}
            <div className="flex items-center space-x-4 relative">
              
              {/* 「夏阴 / 月光」模式切换按钮 */}
              <button
                onClick={onToggleTheme}
                title="切换夏阴/月光光影"
                className={`text-xs font-mono px-3 py-1.5 rounded-none border transition-all duration-300 ${
                  isMoonlight
                    ? 'border-amber-300/40 text-amber-200 hover:bg-amber-300/10'
                    : 'border-teal-700/30 text-teal-800 hover:bg-teal-50'
                }`}
              >
                {isMoonlight ? '🌙 月光' : '☀️ 夏阴'}
              </button>

              {/* 月光青方型 MENU 按钮 */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-10 h-10 bg-[#a5c9ca] hover:bg-[#88abac] text-slate-900 font-mono text-[10px] font-bold leading-tight flex flex-col items-center justify-center transition-transform active:scale-95 shadow-sm"
                  aria-label="Toggle Menu"
                >
                  <span>ME</span>
                  <span>NU</span>
                </button>

                {/* 点击展开的月光青列表 (非线性流畅弹出) */}
                {menuOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-[#a5c9ca] text-slate-900 shadow-2xl z-50 p-4 transition-all duration-300 animate-in fade-in slide-in-from-top-2">
                    <nav className="flex flex-col space-y-3 font-mono text-xs tracking-widest">
                      
                      {/* 主站音乐体验核心 */}
                      <Link 
                        href="/" 
                        onClick={() => setMenuOpen(false)}
                        className="hover:translate-x-1 transition-transform font-bold"
                      >
                        DISCOGRAPHY / 音乐
                      </Link>

                      <Link 
                        href="/about" 
                        onClick={() => setMenuOpen(false)}
                        className="hover:translate-x-1 transition-transform"
                      >
                        ABOUT / 关于鹿站
                      </Link>

                      {/* 社区分站重定向外链 */}
                      <div className="pt-2 border-t border-slate-700/15 flex flex-col space-y-2.5 text-[11px] opacity-90">
                        <a 
                          href={`${SUB_STATION_URL}/magazine`}
                          target="_blank" 
                          rel="noreferrer"
                          className="hover:translate-x-1 transition-transform flex items-center justify-between"
                        >
                          <span>MAGAZINE 同人刊物</span>
                          <span className="text-[9px] opacity-60">↗</span>
                        </a>

                        <a 
                          href={`${SUB_STATION_URL}/forum`}
                          target="_blank" 
                          rel="noreferrer"
                          className="hover:translate-x-1 transition-transform flex items-center justify-between"
                        >
                          <span>FORUM 社区讨论</span>
                          <span className="text-[9px] opacity-60">↗</span>
                        </a>

                        <a 
                          href={`${SUB_STATION_URL}/gallery`}
                          target="_blank" 
                          rel="noreferrer"
                          className="hover:translate-x-1 transition-transform flex items-center justify-between"
                        >
                          <span>GALLERY 同人画集</span>
                          <span className="text-[9px] opacity-60">↗</span>
                        </a>
                      </div>

                      {/* 移至 MENU 内的社交与外部链接 */}
                      <div className="pt-2 border-t border-slate-700/15 flex items-center justify-between text-[10px] font-bold">
                        <a 
                          href="https://space.bilibili.com" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:underline"
                        >
                          BILIBILI
                        </a>
                        <a 
                          href="https://github.com/UMI1220" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="hover:underline"
                        >
                          GITHUB
                        </a>
                      </div>

                    </nav>
                  </div>
                )}
              </div>

            </div>

          </div>
        </header>

        {/* 主要内容区域 */}
        <main className="flex-1">{children}</main>

        {/* 底部 Footer：保留月光青色背景与极简版权信息 */}
        <footer className={`py-10 px-6 sm:px-8 mt-16 sm:mt-20 text-xs border-t transition-colors duration-500 ${
          isMoonlight 
            ? 'bg-zinc-900 text-zinc-400 border-zinc-800' 
            : 'bg-[#a5c9ca] text-slate-800 border-teal-200/50'
        }`}>
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 tracking-widest font-mono">
            
            <div className="text-[10px] sm:text-xs">
              © 2026 YORUSHIKA FAN SITE. ALL MUSIC RIGHTS BELONG TO YORUSHIKA.
            </div>

            <div className="flex items-center space-x-6 text-[11px]">
              <Link href="/about" className="hover:opacity-75 transition">ABOUT</Link>
              <a 
                href="https://github.com/UMI1220" 
                target="_blank" 
                rel="noreferrer" 
                className="hover:opacity-75 transition"
              >
                GITHUB
              </a>
            </div>

          </div>
        </footer>

      </div>
    </>
  );
}
