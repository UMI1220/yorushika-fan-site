import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-6 px-8 bg-[#73C991] text-white shadow-inner mt-auto transition-colors duration-300">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
        
        {/* 左侧：工作室头像 + 文本 */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/40 shadow-sm flex-shrink-0">
            <img src="/studio.jpg" alt="Studio Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-medium tracking-wider opacity-95">
            「八月、某、追逐月光」工作室
          </span>
        </div>

        {/* 右侧：社交/个人主页链接 */}
        <div className="flex items-center space-x-6 text-xs font-mono tracking-wider">
          <a 
            href="https://space.bilibili.com/3690971699087989" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity flex items-center space-x-1"
          >
            <span>Bilibili</span>
            <span className="text-[10px] opacity-60">↗</span>
          </a>

          <a 
            href="https://github.com/UMI1220" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity flex items-center space-x-1"
          >
            <span>GitHub (UMI1220)</span>
            <span className="text-[10px] opacity-60">↗</span>
          </a>
        </div>

      </div>
    </footer>
  );
}
