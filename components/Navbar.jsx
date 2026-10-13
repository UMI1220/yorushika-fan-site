import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [opacityVal, setOpacityVal] = useState('80'); // 默认不透明度，后续可由 settings.js 控制

  useEffect(() => {
    const savedOpacity = localStorage.getItem('yorusend_navbar_opacity');
    if (savedOpacity) setOpacityVal(savedOpacity);
  }, []);

  const menuItems = [
    { label: 'index', href: '/' },
    { label: 'about', href: '/about' },
    { label: 'write', href: '/transition' }, // 严格按要求：write 先进入 transition 过渡页
    { label: 'inbox', href: '/inbox' },
    { label: 'admin', href: '/admin' },
    { label: 'music', href: '/music' },
    { label: 'settings', href: '/settings' },
  ];

  return (
    <header 
      className={`sticky top-0 z-40 w-full backdrop-blur-md border-b border-gray-200/40 dark:border-zinc-800/40 transition-colors duration-300`}
      style={{ backgroundColor: `rgba(var(--bg-rgb, 248, 249, 250), ${opacityVal / 100})` }}
    >
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between relative">
        
        {/* 左侧：Logo 图片 + ヨルセンド 文字 */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 dark:border-zinc-700 shadow-sm">
            <img src="/yorusend.jpg" alt="logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-base font-medium tracking-wider text-[#202124] dark:text-white group-hover:text-[#73C991] transition-colors">
            ヨルセンド <span className="text-xs font-normal text-gray-400 font-mono ml-1">夜邮</span>
          </span>
        </Link>

        {/* 右侧：月光青标准的 menu 胶囊按钮 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-5 py-2 bg-[#73C991] text-white text-xs font-medium tracking-widest rounded-full shadow-md hover:opacity-90 transition-all active:scale-95 uppercase"
        >
          menu
        </button>

        {/* 非线性动画弹出的 7 行菜单面板 */}
        {isOpen && (
          <div className="absolute top-20 right-6 w-56 bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-2 flex flex-col space-y-2">
            {menuItems.map((item, index) => {
              // 计算是否是第一行或最后一行，赋予对应的圆角特征
              const isFirst = index === 0;
              const isLast = index === menuItems.length - 1;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-5 py-3 text-xs font-mono tracking-wider text-gray-700 dark:text-zinc-200 hover:bg-[#73C991] hover:text-white transition-all flex items-center justify-between
                    ${isFirst ? 'rounded-t-2xl' : ''}
                    ${isLast ? 'rounded-b-2xl' : ''}
                    ${!isFirst && !isLast ? 'rounded-md' : ''}
                  `}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] opacity-40">→</span>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </header>
  );
}
