import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';

// 模拟夜鹿专辑数据 (实际可结合 /api/albums 接口)
const ALBUMS = [
  {
    id: '01',
    title: '夏草が邪魔をする',
    subtitle: '夏草旁骛',
    quote: '「カトレアの花が咲いた、夏が始まる」',
    cover: '/covers/01.jpg',
    color: '#3b5998', // Pixel 吸色备用值
  },
  {
    id: '02',
    title: '負け犬にアンコールはいらない',
    subtitle: '败犬重奏',
    quote: '「只一言、ただ一言でいいから」',
    cover: '/covers/02.jpg',
    color: '#8b4513',
  },
  {
    id: '03',
    title: 'だから僕は音楽を辞めた',
    subtitle: '所以放弃音乐',
    quote: '「僕らはただ、あの人の歌を盗み続けていた」',
    cover: '/covers/03.jpg',
    color: '#1a365d',
  },
  {
    id: '04',
    title: 'エルマ',
    subtitle: 'Elma',
    quote: '「夕凪の街、君の残したノート」',
    cover: '/covers/04.jpg',
    color: '#2d3748',
  },
  {
    id: '05',
    title: '盗作',
    subtitle: '盗作',
    quote: '「音楽の盗作をして生きていた」',
    cover: '/covers/05.jpg',
    color: '#742a2a',
  },
  {
    id: '06',
    title: '幻燈',
    subtitle: 'Magic Lantern',
    quote: '「画集に描かれた、夏の幻影」',
    cover: '/covers/06.jpg',
    color: '#2c5282',
  },
];

export default function Home() {
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [tileSizeStyles, setTileSizeStyles] = useState([]);

  // 计算 Max:Min = 4:3 的正方形磁贴尺寸数组
  useEffect(() => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    // 基础最大边长 (依屏幕动态决定)
    const baseMax = Math.min(Math.max(screenWidth / 4, 180), 280); 
    const baseMin = baseMax * 0.75; // 4:3 比例的 S_min

    const styles = ALBUMS.map(() => {
      // 在 [S_min, S_max] 内随机抽选边长
      const randomSize = Math.floor(baseMin + Math.random() * (baseMax - baseMin));
      return {
        width: `${randomSize}px`,
        height: `${randomSize}px`, // 100% 绝对正方形
      };
    });

    setTileSizeStyles(styles);
  }, []);

  return (
    <Layout>
      <Head>
        <title>INDEX / 音楽泥棒の庭 · ヨルシカ Fan Site</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8 font-serif">
        {/* 页头标语 */}
        <div className="mb-8 border-b border-[#88abac]/20 pb-4 flex justify-between items-end">
          <div>
            <span className="text-[10px] font-mono text-[#a5c9ca] tracking-widest uppercase block mb-1">
              DISCOGRAPHY / 1:1 WP8.1 TILES
            </span>
            <h1 className="text-xl sm:text-2xl font-medium tracking-wider text-current">
              ヨルシカ 作品集
            </h1>
          </div>
          <span className="text-[10px] font-mono opacity-50 uppercase hidden sm:inline">
            SMARTISAN LIGHT & SHADOW ENABLED
          </span>
        </div>

        {/* 磁贴网格容器 (带有 WP8.1 从左至右轴向翻转进场) */}
        <div className="flex flex-wrap gap-4 sm:gap-6 justify-center items-start py-4 min-h-[60vh]">
          {ALBUMS.map((album, idx) => {
            const isSelected = selectedAlbum?.id === album.id;
            const tileStyle = tileSizeStyles[idx] || { width: '220px', height: '220px' };

            return (
              <div
                key={album.id}
                onClick={() => setSelectedAlbum(isSelected ? null : album)}
                onDoubleClick={() => {
                  window.location.href = `/music?album=${album.id}`;
                }}
                className="relative cursor-pointer transition-all duration-500 transform hover:-translate-y-1 group select-none animate-in fade-in zoom-in-90 duration-700"
                style={{
                  ...tileStyle,
                  animationDelay: `${idx * 120}ms`, // 从左至右逐个进场
                  // 坚果 OS 动态光影：悬浮真实物理阴影
                  boxShadow: isSelected
                    ? `0 20px 40px ${album.color}66, 0 8px 16px rgba(0,0,0,0.4)`
                    : '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
                }}
              >
                {/* 100% 正方形专辑封面 */}
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${album.cover})` }}
                />

                {/* 坚果 OS 质感光影斜切滤镜overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />

                {/* Google Pixel 吸色高斯模糊蒙版 (选中/悬停时触发) */}
                <div
                  className={`absolute inset-0 backdrop-blur-md transition-opacity duration-300 p-4 flex flex-col justify-between ${
                    isSelected ? 'opacity-100' : 'opacity-0 hover:opacity-90'
                  }`}
                  style={{
                    backgroundColor: `${album.color}dd`, // 提取的主色透明度
                  }}
                >
                  {/* 编号与日文金句 */}
                  <div className="flex justify-between items-start font-mono text-white/80">
                    <span className="text-xs font-bold">[{album.id}]</span>
                    <span className="text-[9px] uppercase tracking-widest border border-white/20 px-1">
                      SELECT
                    </span>
                  </div>

                  <div className="space-y-1 text-white">
                    <p className="text-xs font-serif italic leading-relaxed font-light">
                      {album.quote}
                    </p>
                    <div className="text-sm font-medium border-t border-white/20 pt-2">
                      {album.title}
                    </div>
                    <div className="text-[10px] font-mono text-white/70">
                      {album.subtitle}
                    </div>
                  </div>

                  {/* 双击进入播放页文字提示 */}
                  <div className="text-[9px] font-mono text-white/60 text-right uppercase">
                    DOUBLE CLICK TO PLAY &gt;
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 底部文学感底部说明 */}
        <div className="mt-12 text-center font-mono text-[10px] opacity-40 space-y-1 border-t border-current/10 pt-6">
          <div>TOUCH / CLICK TILE TO INSPECT · DOUBLE CLICK TO ENTER PLAYER</div>
          <div>YORUSHIKA FAN SITE · NO EMOJI LITERARY TEXT UI</div>
        </div>
      </div>
    </Layout>
  );
}
