import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAudio } from '../components/Layout';

export default function Home() {
  const router = useRouter();
  const { setThemeColor, theme } = useAudio();

  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [albumColors, setAlbumColors] = useState({});

  // 容器 & 拖拽/平移控制
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const scrollPos = useRef({ x: 0, y: 0 });

  // 长按定时器Ref
  const longPressTimer = useRef(null);

  // ---------------------------------------------------------------------------
  // 1. 数据获取: 请求 /api/albums 接口
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function fetchAlbums() {
      try {
        const res = await fetch('/api/albums');
        const data = await res.json();
        if (data.success && data.albums) {
          // 为每个专辑预设随机尺寸比例 (4:3 范围内的 S_min ~ S_max 权重)
          const formatted = data.albums.map((album, idx) => {
            // 43 个专辑的随机 4:3 布局因子 (1.0 ~ 1.33)
            const scaleFactor = 0.75 + Math.random() * 0.5; 
            return {
              ...album,
              scaleFactor,
              // 示例备用歌词/专辑信息（若 API 中未单独带 lyric 字段）
              lyricSnippet: album.lyricSnippet || album.description || 'カトレアの花が咲いた、夏草に邪魔をされる。',
              coverImg: album.coverUrl || album.cover || `/covers/${album.id || idx + 1}.jpg`,
            };
          });
          setAlbums(formatted);
          // 异步提取 Pixel 封面颜色
          extractColors(formatted);
        }
      } catch (err) {
        console.error('加载专辑数据失败:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlbums();
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Google Pixel 算法: 从专辑封面 Canvas 提取主色
  // ---------------------------------------------------------------------------
  const extractColors = (albumList) => {
    albumList.forEach((album) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = album.coverImg;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 10;
        canvas.height = 10;
        ctx.drawImage(img, 0, 0, 10, 10);
        const data = ctx.getImageData(0, 0, 10, 10).data;

        // 简易 Pixel 取色平均值
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        const count = data.length / 4;
        const hex = `#${Math.floor(r / count).toString(16).padStart(2, '0')}${Math.floor(g / count).toString(16).padStart(2, '0')}${Math.floor(b / count).toString(16).padStart(2, '0')}`;
        
        setAlbumColors((prev) => ({ ...prev, [album.id]: hex }));
      };
    });
  };

  // ---------------------------------------------------------------------------
  // 3. 多端交互: 桌面端滚轮横向平移 / 移动端 Apple Watch 全向拖拽刷新
  // ---------------------------------------------------------------------------
  // 桌面端 Wheel 监听
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // 移动端/鼠标 拖拽手势
  const handleMouseDown = (e) => {
    isDragging.current = true;
    startPos.current = { x: e.clientX || e.touches?.[0].clientX, y: e.clientY || e.touches?.[0].clientY };
    scrollPos.current = { x: containerRef.current.scrollLeft, y: containerRef.current.scrollTop };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;
    const clientX = e.clientX || e.touches?.[0].clientX;
    const clientY = e.clientY || e.touches?.[0].clientY;
    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;

    containerRef.current.scrollLeft = scrollPos.current.x - dx;
    containerRef.current.scrollTop = scrollPos.current.y - dy;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // ---------------------------------------------------------------------------
  // 4. 磁贴点击 / 双击 / 长按换色逻辑
  // ---------------------------------------------------------------------------
  const handleTileTouchStart = (album) => {
    // 启动长按定时器 (700ms 触发全站主题换色)
    longPressTimer.current = setTimeout(() => {
      const extractedColor = albumColors[album.id] || '#88abac';
      setThemeColor(extractedColor);
      if (navigator.vibrate) navigator.vibrate(50); // 震动反馈
    }, 700);
  };

  const handleTileTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleTileClick = (album) => {
    if (selectedAlbumId === album.id) {
      // 再次点击/双击：进入音乐播放页
      router.push(`/music?album=${album.id}`);
    } else {
      // 首次选中：弹出取色蒙版
      setSelectedAlbumId(album.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-xs tracking-widest opacity-60">
        LOADING DISCOGRAPHY...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      className="w-full h-[calc(100vh-3.5rem)] overflow-auto cursor-grab active:cursor-grabbing select-none p-6 sm:p-12 relative"
    >
      {/* ------------------- WP8.1 4:3 绝对直角正方形磁贴网格 ------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 max-w-[1800px] mx-auto pb-24">
        {albums.map((album, index) => {
          const isSelected = selectedAlbumId === album.id;
          const pixelColor = albumColors[album.id] || '#88abac';

          // 故意制造《盗作》留空破碎感：某些索引项产生偏移或占位 gap
          const isBrokenGap = index % 9 === 4;

          return (
            <React.Fragment key={album.id || index}>
              {/* 破碎留空盒 */}
              {isBrokenGap && <div className="hidden sm:block pointer-events-none" />}

              {/* 直角磁贴容器 */}
              <div
                onTouchStart={() => handleTileTouchStart(album)}
                onTouchEnd={handleTileTouchEnd}
                onMouseDown={() => handleTileTouchStart(album)}
                onMouseUp={handleTileTouchEnd}
                onClick={() => handleTileClick(album)}
                style={{
                  animationDelay: `${index * 40}ms`,
                  // 坚果 OS 动态物理日光斜影 / 月光缝隙光晕
                  boxShadow:
                    theme === 'natsukage'
                      ? '12px 12px 24px -6px rgba(0, 0, 0, 0.12), 4px 4px 8px -2px rgba(0,0,0,0.06)'
                      : '0 0 15px -3px rgba(136, 171, 172, 0.25)',
                }}
                className={`group relative aspect-square w-full rounded-none overflow-hidden transition-all duration-300 transform animate-in fade-in zoom-in-90 fill-mode-forwards ${
                  isSelected ? 'scale-105 z-20' : 'hover:scale-[1.02] z-10'
                }`}
              >
                {/* 1. 封面图 */}
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${album.coverImg})` }}
                />

                {/* 2. Google Pixel 动态取色高斯模糊蒙版 */}
                <div
                  className={`absolute inset-0 backdrop-blur-md transition-opacity duration-300 p-4 flex flex-col justify-between ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: `${pixelColor}CC`, // 带透明度的高斯蒙版
                  }}
                >
                  {/* 顶部: 专辑歌词与配词 */}
                  <div className="space-y-1">
                    <p className="font-serif text-xs font-bold leading-relaxed line-clamp-3 text-zinc-950">
                      「{album.lyricSnippet}」
                    </p>
                  </div>

                  {/* 底部: 专辑名称与年份/曲目数信息 */}
                  <div className="border-t border-zinc-950/20 pt-2 text-zinc-950 font-mono">
                    <p className="text-xs font-bold truncate">{album.title || album.name}</p>
                    <p className="text-[10px] opacity-75">
                      {album.releaseDate || 'YORUSHIKA'} • {album.tracksCount || 'DISC'}
                    </p>
                    <p className="text-[9px] tracking-tighter opacity-60 mt-1">
                      [ CLICK AGAIN TO PLAY ]
                    </p>
                  </div>
                </div>

                {/* WP8.1 磁贴右下角微缩标题 (未选中时常驻) */}
                {!isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white font-mono text-[10px] truncate opacity-90 group-hover:opacity-0 transition-opacity">
                    {album.title || album.name}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
