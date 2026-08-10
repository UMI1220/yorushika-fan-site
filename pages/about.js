import React, { useState } from 'react';
import Link from 'next/link';
import { useAudio } from '../components/Layout';

export default function AboutPage() {
  const { themeColor, theme } = useAudio();
  const [zenMode, setZenMode] = useState(false);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-12 px-4 max-w-3xl mx-auto font-serif text-xs leading-relaxed">
      
      {/* 顶栏控制 */}
      <div className="flex justify-between items-center mb-10 font-mono text-xs border-b border-current/10 pb-4">
        <Link href="/" className="opacity-70 hover:opacity-100 transition-opacity">
          [ &lt; INDEX ]
        </Link>
        <button
          type="button"
          onClick={() => setZenMode(!zenMode)}
          className="opacity-70 hover:opacity-100 transition-opacity"
        >
          [ {zenMode ? 'CARD VIEW' : 'ZEN READ MODE'} ]
        </button>
      </div>

      {/* 主体容器 */}
      <div
        className={`transition-all duration-500 space-y-10 ${
          zenMode
            ? 'p-2 bg-transparent'
            : 'bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-current/10 p-6 sm:p-10 shadow-xl'
        }`}
      >
        {/* 标题 */}
        <div className="space-y-2 border-b border-current/10 pb-6">
          <p className="font-mono text-[10px] tracking-widest opacity-60">
            [ ABOUT YORUSHIKA FAN PROJECT ]
          </p>
          <h1 className="text-xl font-bold tracking-wider">エルマとエイミー、そして僕らの盗作</h1>
          <p className="font-mono text-[11px] opacity-70">
            ヨルシカ / YORUSHIKA UNOFFICIAL ARCHIVE
          </p>
        </div>

        {/* 01. 序言 */}
        <section className="space-y-3">
          <p className="font-mono text-[10px] font-bold tracking-widest opacity-50" style={{ color: themeColor }}>
            01. PREFACE / 序言
          </p>
          <p className="opacity-90 leading-loose text-sm">
            「月明かりもない夜に、ただギターの音だけが響いていた。」
          </p>
          <p className="opacity-80 leading-relaxed">
            这是一个献给ヨルシカ（Yorushika）及其文学哲思的非商业粉丝整理与试听项目。从《夏草に邪魔をされる》的初夏燥热，到《盗作》对艺术与抄袭的终极拷问，我们记录并整理关于 n-buna 的词曲世界与 suis 声音记忆的每一个片段。
          </p>
        </section>

        {/* 02. 版权与自白 */}
        <section className="space-y-3 pt-4 border-t border-current/10">
          <p className="font-mono text-[10px] font-bold tracking-widest opacity-50" style={{ color: themeColor }}>
            02. STATEMENT / 声明与自白
          </p>
          <p className="opacity-80 leading-relaxed">
            本站所有音乐作品、歌词、视觉图片及视频版权均归属于 n-buna、suis 以及所属唱片公司 Universal Music Japan 所有。本站不进行任何形式的商业变现，所有资源均用于粉丝试听交流与归档。
          </p>
          <p className="opacity-80 leading-relaxed">
            如果您喜爱ヨルシカ的作品，请务必前往官方渠道支持正版专辑与 Live 演出。
          </p>
        </section>

        {/* 03. 三大分站生态 */}
        <section className="space-y-4 pt-4 border-t border-current/10 font-mono">
          <p className="text-[10px] font-bold tracking-widest opacity-50" style={{ color: themeColor }}>
            03. ECOSYSTEM / 同人分站矩阵
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <a
              href="https://3000-687cf3853f2f7d36.monkeycode-ai.live/gallery"
              target="_blank"
              rel="noreferrer"
              className="p-3 border border-current/20 hover:bg-current/5 transition-colors block"
            >
              <p className="font-bold mb-1">GALLERY &gt;</p>
              <p className="text-[10px] font-serif opacity-70">视觉与画廊沉浸分站</p>
            </a>

            <a
              href="https://3000-687cf3853f2f7d36.monkeycode-ai.live/forum"
              target="_blank"
              rel="noreferrer"
              className="p-3 border border-current/20 hover:bg-current/5 transition-colors block"
            >
              <p className="font-bold mb-1">FORUM &gt;</p>
              <p className="text-[10px] font-serif opacity-70">粉丝讨论与歌词解构</p>
            </a>

            <a
              href="https://3000-687cf3853f2f7d36.monkeycode-ai.live/magazine"
              target="_blank"
              rel="noreferrer"
              className="p-3 border border-current/20 hover:bg-current/5 transition-colors block"
            >
              <p className="font-bold mb-1">MAGAZINE &gt;</p>
              <p className="text-[10px] font-serif opacity-70">同人月刊与文学随笔</p>
            </a>
          </div>
        </section>

        {/* 04. 致谢与落款 */}
        <section className="space-y-3 pt-4 border-t border-current/10 font-mono text-[11px]">
          <p className="text-[10px] font-bold tracking-widest opacity-50" style={{ color: themeColor }}>
            04. CREDITS & SYSTEM / 致谢与构建
          </p>
          <div className="flex justify-between opacity-70">
            <span>DESIGN LANGUAGE:</span>
            <span>WP8.1 / SMARTISAN OS / GOOGLE PIXEL</span>
          </div>
          <div className="flex justify-between opacity-70">
            <span>INFRASTRUCTURE:</span>
            <span>NEXT.JS / CLOUDFLARE D1 / GITHUB API</span>
          </div>
          <div className="flex justify-between opacity-70">
            <span>PROJECT MAINTAINER:</span>
            <span>UMI & YORUSHIKA FAN PROJECT</span>
          </div>
        </section>

        {/* 底部落款 */}
        <div className="pt-6 text-center font-mono text-[10px] opacity-50 space-y-1">
          <p>「だから僕は音楽を辞めた。」</p>
          <p>© {new Date().getFullYear()} YORUSHIKA FAN ARCHIVE. ALL RIGHTS RESERVED.</p>
        </div>

      </div>
    </div>
  );
}
