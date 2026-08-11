import React from 'react';
import Link from 'next/link';
import Layout, { useAudio } from '../components/Layout';

// -----------------------------------------------------------------------------
// 1. 坚果 OS 动态物理光影计算 (随现实时间演变)
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
    boxShadow: `${offsetX.toFixed(1)}px ${offsetY.toFixed(1)}px 24px rgba(0, 0, 0, 0.12), ${(offsetX * 0.5).toFixed(1)}px ${(offsetY * 0.5).toFixed(1)}px 8px rgba(0, 0, 0, 0.08)`,
  };
}

// -----------------------------------------------------------------------------
// 主页面组件: AboutPage
// -----------------------------------------------------------------------------
export default function AboutPage() {
  const { theme, themeColor } = useAudio();
  const dynamicShadow = getDynamicShadowStyle(theme);

  return (
    <Layout>
      <div className="min-h-[calc(100vh-3.5rem)] px-4 py-8 max-w-5xl mx-auto font-serif text-current select-none space-y-8">
        
        {/* ------------------- 顶部标题栏 ------------------- */}
        <div className="border-b border-current/10 pb-4 flex justify-between items-end font-mono text-xs">
          <div>
            <h1 className="text-base font-bold tracking-widest">[ ABOUT & CONFESSION ]</h1>
            <p className="text-[10px] opacity-60 mt-1">ヨルシカ (YORUSHIKA) FAN ARCHIVE — 自白与设计自述</p>
          </div>
          <span className="opacity-40 text-[10px] hidden sm:inline">[ ARCHIVE VER 4.51.32 ]</span>
        </div>

        {/* ------------------- 网格磁贴区域 ------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. 档案馆自白 (Intro) */}
          <div
            style={dynamicShadow}
            className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-current/10 p-6 space-y-4 rounded-none transition-all duration-300"
          >
            <div className="font-mono text-xs font-bold tracking-wider border-b border-current/10 pb-2 flex justify-between">
              <span>[ 01. STATEMENT / 档案馆自白 ]</span>
              <span style={{ color: themeColor }}>01</span>
            </div>
            <div className="space-y-3 text-xs leading-relaxed opacity-90">
              <p className="font-bold italic">「 僕らはただ、夏の間じゅうずっと、あの人の歌を盗み続けていた。」</p>
              <p>
                本站为 ヨルシカ (Yorushika) 非商业二次创作粉丝档案馆。旨在梳理与呈现 n-buna 与 suis 创作的音乐、歌词与文学世界观。
              </p>
              <p className="text-[11px] opacity-70">
                全站视觉融合 Windows Phone 8.1 磁贴美学、Smartisan OS 物理日光/月光演算以及 Google Pixel 动态 Monet 调色算法，为您呈现纯粹的文学感体验。
              </p>
            </div>
          </div>

          {/* 2. 版权与免责声明 (Copyright & Disclaimer) */}
          <div
            style={dynamicShadow}
            className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-current/10 p-6 space-y-4 rounded-none transition-all duration-300"
          >
            <div className="font-mono text-xs font-bold tracking-wider border-b border-current/10 pb-2 flex justify-between">
              <span>[ 02. COPYRIGHT / 版权申诉 ]</span>
              <span style={{ color: themeColor }}>02</span>
            </div>
            <div className="space-y-3 text-xs leading-relaxed opacity-90">
              <p>
                本站包含的所有音频、唱片封面、歌词文本与视觉素材，其版权均归属于 <span className="font-bold">UNIVERSAL MUSIC LLC</span> 及 <span className="font-bold">ヨルシカ 官方</span> 所有。
              </p>
              <p>
                本站不进行任何形式的商业变现或广告投放。若您为版权方并认为本站内容存在侵权，请联系我们进行处理或下架。
              </p>
              <div className="pt-2 font-mono text-[11px]">
                <Link
                  href="/submit?mode=edit"
                  style={{ color: themeColor }}
                  className="hover:underline font-bold"
                >
                  [ REPORT OR MODIFY / 提交纠错与申诉 &gt; ]
                </Link>
              </div>
            </div>
          </div>

          {/* 3. 架构与技术栈 (Tech Stack) */}
          <div
            style={dynamicShadow}
            className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-current/10 p-6 space-y-4 rounded-none transition-all duration-300"
          >
            <div className="font-mono text-xs font-bold tracking-wider border-b border-current/10 pb-2 flex justify-between">
              <span>[ 03. ARCHITECTURE / 架构规约 ]</span>
              <span style={{ color: themeColor }}>03</span>
            </div>
            <div className="space-y-2 font-mono text-xs opacity-80">
              <div className="flex justify-between border-b border-current/5 pb-1">
                <span>FRAMEWORK</span>
                <span className="font-serif">Next.js (Pages Router)</span>
              </div>
              <div className="flex justify-between border-b border-current/5 pb-1">
                <span>STYLING</span>
                <span className="font-serif">Tailwind CSS (Custom WP8 Tiles)</span>
              </div>
              <div className="flex justify-between border-b border-current/5 pb-1">
                <span>EDGE DATABASE</span>
                <span className="font-serif">Cloudflare D1 SQLite (env.DB)</span>
              </div>
              <div className="flex justify-between border-b border-current/5 pb-1">
                <span>ASSETS CDN</span>
                <span className="font-serif">GitHub (UMI1220/yorushika-assets)</span>
              </div>
            </div>
          </div>

          {/* 4. 外链与致谢 (Credits & External Links) */}
          <div
            style={dynamicShadow}
            className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-current/10 p-6 space-y-4 rounded-none transition-all duration-300"
          >
            <div className="font-mono text-xs font-bold tracking-wider border-b border-current/10 pb-2 flex justify-between">
              <span>[ 04. LINKS & CREDITS / 链接与贡献 ]</span>
              <span style={{ color: themeColor }}>04</span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex flex-col space-y-2">
                <a
                  href="https://yorushika.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline opacity-80 hover:opacity-100"
                >
                  [ YORUSHIKA OFFICIAL SITE &gt; ]
                </a>
                <a
                  href="https://space.bilibili.com/23201889"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline opacity-80 hover:opacity-100"
                >
                  [ YORUSHIKA BILIBILI CHANNEL &gt; ]
                </a>
                <a
                  href="https://github.com/UMI1220/yorushika-assets"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline opacity-80 hover:opacity-100"
                >
                  [ GITHUB ASSETS REPOSITORY &gt; ]
                </a>
              </div>
              <div className="pt-2 border-t border-current/10 text-[10px] opacity-60">
                SPECIAL THANKS TO ALL CONTRIBUTORS / 感谢所有参与档案补充与校对的贡献者。
              </div>
            </div>
          </div>

        </div>

        {/* 底部文学落款 */}
        <div className="pt-6 text-center font-mono text-[10px] opacity-40">
          [ END OF PAGE — ARCHIVE SYSTEM VER 4.51.32 ]
        </div>
      </div>
    </Layout>
  );
}
