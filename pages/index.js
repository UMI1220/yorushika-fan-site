import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { YORUSHIKA_DISCOGRAPHY } from '../lib/discography';

// Pixel 封面色彩提取函数
function extractCoverColor(imageSrc, callback) {
  if (typeof window === 'undefined') return;
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = imageSrc;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 16;
    canvas.height = 16;
    ctx.drawImage(img, 0, 0, 16, 16);
    const data = ctx.getImageData(0, 0, 16, 16).data;
    
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness > 30 && brightness < 225) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
    }
    if (count > 0) {
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      callback(`rgb(${r}, ${g}, ${b})`);
    } else {
      callback('rgb(165, 201, 202)'); // Fallback 月光青
    }
  };
  img.onerror = () => callback('rgb(165, 201, 202)');
}

export default function Home() {
  const router = useRouter();
  const [albums, setAlbums] = useState(YORUSHIKA_DISCOGRAPHY);
  const [isMoonlight, setIsMoonlight] = useState(false);
  const [activeTile, setActiveTile] = useState(null);
  const [extractedColors, setExtractedColors] = useState({});
  const [loaded, setLoaded] = useState(false);
  const scrollContainerRef = useRef(null);

  // 初始化尝试从 D1 接口拉取；若接口尚未配置好，优先使用精准的本地数据
  useEffect(() => {
    async function loadAlbums() {
      try {
        const res = await fetch('/api/albums');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length >= 40) {
            setAlbums(data.map((item, idx) => ({
              id: item.id,
              name: item.title_jp,
              date: item.release_date || 'YORUSHIKA',
              tracks: 'Disc',
              cover: item.cover_url || `/covers/${item.id}.jpg`,
              quote: item.letter_title || item.title_cn || 'ヨルシカ'
            })));
          }
        }
      } catch (e) {
        // 保持 YORUSHIKA_DISCOGRAPHY
      } finally {
        setTimeout(() => setLoaded(true), 100);
      }
    }

    loadAlbums();
  }, []);

  // 为全量 46 张封面实时提取颜色
  useEffect(() => {
    albums.forEach((album) => {
      extractCoverColor(album.cover, (colorStr) => {
        setExtractedColors((prev) => ({ ...prev, [album.id]: colorStr }));
      });
    });
  }, [albums]);

  // 电脑端鼠标滚轮横向滑动
  const handleWheel = (e) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleTileClick = (albumId) => {
    if (activeTile === albumId) {
      // 再次点击直接进入音乐播放与专页
      router.push(`/music?album=${albumId}`);
    } else {
      setActiveTile(albumId);
    }
  };

  return (
    <Layout isMoonlight={isMoonlight} onToggleTheme={() => setIsMoonlight(!isMoonlight)}>
      <div className="w-full min-h-[calc(100vh-140px)] py-6 sm:py-12 px-4 sm:px-8 flex flex-col justify-center">
        
        {/* 标头文字 */}
        <div className="max-w-6xl mx-auto w-full mb-6 sm:mb-8 flex justify-between items-end">
          <div>
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase opacity-50 block mb-1">
              DISCOGRAPHY / 磁貼画廊 ({albums.length})
            </span>
            <h1 className="text-lg sm:text-2xl font-serif font-light tracking-widest">
              作品集与音乐自白
            </h1>
          </div>
          <span className="text-[10px] font-mono opacity-40 hidden sm:inline-block">
            WP8.1 TILES LAYOUT
          </span>
        </div>

        {/* 磁贴网格容器 */}
        <div 
          ref={scrollContainerRef}
          onWheel={handleWheel}
          className="w-full overflow-x-auto no-scrollbar scroll-smooth py-4"
        >
          <div className="grid grid-flow-col grid-rows-2 sm:grid-rows-3 gap-3 sm:gap-4 auto-cols-[160px] sm:auto-cols-[240px] max-w-full">
            {albums.map((album, index) => {
              const isSelected = activeTile === album.id;
              const extractedColor = extractedColors[album.id] || 'rgb(165, 201, 202)';

              // 随机跨度打造 WP8.1 错落不规则感
              const isLarge = index % 5 === 0;
              const tileClass = isLarge 
                ? 'col-span-2 row-span-2 aspect-[4/3]' 
                : 'col-span-1 row-span-1 aspect-[4/3]';

              return (
                <div
                  key={album.id}
                  onClick={() => handleTileClick(album.id)}
                  style={{
                    animationDelay: `${(index % 12) * 60}ms`,
                    transformStyle: 'preserve-3d',
                  }}
                  className={`relative group cursor-pointer overflow-hidden rounded-none border-none shadow-md transition-all duration-500 select-none ${tileClass} ${
                    loaded ? 'animate-in fade-in slide-in-from-left-8 duration-700' : 'opacity-0'
                  }`}
                >
                  {/* 封面底图 */}
                  <img
                    src={album.cover}
                    alt={album.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* 磁贴右下角发售日期 */}
                  <div className="absolute bottom-1.5 right-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-mono px-1.5 py-0.5 pointer-events-none">
                    {album.date}
                  </div>

                  {/* Pixel 高斯模糊蒙版与提取色渲染 */}
                  <div 
                    className={`absolute inset-0 backdrop-blur-md transition-opacity duration-300 p-3 sm:p-4 flex flex-col justify-between ${
                      isSelected 
                        ? 'opacity-100 bg-black/70' 
                        : 'opacity-0 group-hover:opacity-100 bg-black/60'
                    }`}
                  >
                    <div>
                      <span 
                        className="text-[9px] font-mono tracking-widest block mb-1 uppercase"
                        style={{ color: extractedColor }}
                      >
                        {album.tracks}
                      </span>
                      <h3 className="text-xs sm:text-sm font-serif font-medium text-white line-clamp-2 leading-snug">
                        {album.name}
                      </h3>
                    </div>

                    <div>
                      <p 
                        className="text-[10px] sm:text-xs font-serif italic line-clamp-2 leading-relaxed"
                        style={{ color: extractedColor }}
                      >
                        {album.quote}
                      </p>
                      
                      <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-[9px] font-mono text-zinc-300">
                        <span>点击进入专页</span>
                        <span>→</span>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center font-mono text-[10px] opacity-40">
          <span className="sm:hidden">← 任意方向滑动浏览 46 首作品磁贴 · 轻触查看详情 →</span>
          <span className="hidden sm:inline">← 滚轮左右切换 46 首作品磁贴 · 双击进入音乐播放与书信专页 →</span>
        </div>

      </div>
    </Layout>
  );
}
