import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-zinc-800 font-sans tracking-wide">
      {/* 顶部 Header：纯白半透明背景 */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-zinc-200/80 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* LOGO 区域：眼睛 (01.jpg) + 手写日文 (02.jpg) */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group shrink-0">
            <img 
              src="/01.jpg" 
              alt="Yorushika Eye Logo" 
              className="h-7 sm:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <img 
              src="/02.jpg" 
              alt="ヨルシカ Handwrite Logo" 
              className="h-5 sm:h-7 w-auto object-contain transition-opacity duration-300 group-hover:opacity-80"
            />
          </Link>

          {/* 顶部导航菜单：文字使用官网青绿色 (#a5c9ca) */}
          <nav className="flex items-center space-x-4 sm:space-x-8 text-[11px] sm:text-xs font-semibold tracking-widest text-[#a5c9ca] uppercase overflow-x-auto no-scrollbar py-1 ml-4">
            <Link href="/" className="hover:text-teal-600 transition shrink-0">INDEX</Link>
            <Link href="/magazine" className="hover:text-teal-600 transition shrink-0">MAGAZINE</Link>
            <Link href="/forum" className="hover:text-teal-600 transition shrink-0">FORUM</Link>
            <Link href="/gallery" className="hover:text-teal-600 transition shrink-0">GALLERY</Link>
            <Link href="/music" className="hover:text-teal-600 transition shrink-0">DISCOGRAPHY</Link>
            <Link href="/about" className="hover:text-teal-600 transition shrink-0">ABOUT</Link>
          </nav>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="flex-1">{children}</main>

      {/* 底部 Footer：官网青绿色背景，移除标志 */}
      <footer className="bg-[#a5c9ca] text-slate-800 py-10 px-6 sm:px-8 mt-16 sm:mt-20 text-xs border-t border-teal-200/50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 tracking-widest">
          
          <div className="text-[10px] sm:text-xs font-medium">
            © 2026 YORUSHIKA FAN SITE.
          </div>

          <div className="flex items-center space-x-6 sm:space-x-8 text-[11px] font-medium">
            <Link href="/about" className="hover:text-black transition">ABOUT</Link>
            <a href="https://github.com/UMI1220" target="_blank" rel="noreferrer" className="hover:text-black transition">GITHUB</a>
            <a href="https://space.bilibili.com/3546934872640225" target="_blank" rel="noreferrer" className="hover:text-black transition">BILIBILI</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
