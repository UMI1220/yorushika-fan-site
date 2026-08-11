import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout, { useAudio } from '../components/Layout';

// -----------------------------------------------------------------------------
// 1. 本地已看专辑记录（抽尽算法全局缓存，直到全站专辑抽完一轮后重置）
// -----------------------------------------------------------------------------
let globalSeenAlbumIds = new Set();

export default function Home() {
  const router = useRouter();
  const { theme, themeColor, shadowStyle, setThemeColor } = useAudio();

  // 状态管理
  const [allAlbums, setAllAlbums] = useState([]);         // 数据库全量专辑
  const [currentTiles, setCurrentTiles] = useState([]);   // 当前屏显示的磁贴数组
  const [loading, setLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);  // 刷新时的淡出状态
  const [selectedTileId, setSelectedTileId] = useState(null); // PC端选中的磁贴ID
  const [activeHoverTile, setActiveHoverTile] = useState(null); // 当前悬停/轻触的磁贴

  // Touch 手势记录 (移动端全向滑动刷新)
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchTimeRef = useRef(0);

  // Monet 取色缓存 (避免重复 Canvas 取色)
  const colorCache = useRef({});

  // ---------------------------------------------------------------------------
  // 2. Google Pixel Monet 动态取色算法 (提取封面主色/互补色)
  // ---------------------------------------------------------------------------
  const getMonetColor = useCallback((imgUrl, callback) => {
    if (!imgUrl) return callback('#88abac');
    if (colorCache.current[imgUrl]) {
      return callback(colorCache.current[imgUrl]);
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imgUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 32;
        canvas.height = 32;
        ctx.drawImage(img, 0, 0, 32, 32);
        const data = ctx.getImageData(0, 0, 32, 32).data;
        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < data.length; i += 16) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        // 保证文本在模糊蒙版上的高对比度与艺术感
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        colorCache.current[imgUrl] = hex;
        callback(hex);
      } catch (e) {
        callback('#88abac');
      }
    };
    img.onerror = () => callback('#88abac');
  }, []);

  // ---------------------------------------------------------------------------
  // 3. 磁贴尺寸与“不重复抽尽”算法 (WP 8.1 破碎感 + 4:3 极值比例)
  // ---------------------------------------------------------------------------
  const generateTiles = useCallback((albumList) => {
    if (!albumList || albumList.length === 0) return [];

    // 根据屏幕宽度确定磁贴抽取数量（移动端 3-4 个，桌面端 6-8 个）
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const tileCount = isMobile ? 4 : 8;

    // 筛选未看过的专辑
    let unallocated = albumList.filter((a) => !globalSeenAlbumIds.has(a.id));

    // 如果未看过的专辑数量不够一屏，重置已看集合（开启新一轮全量抽尽）
    if (unallocated.length < tileCount) {
      globalSeenAlbumIds.clear();
      unallocated = [...albumList];
    }

    // 随机打乱并抽取对应的专辑
    const shuffled = [...unallocated].sort(() => Math.random() - 0.5);
    const selectedAlbums = shuffled.slice(0, tileCount);

    // 将抽中的专辑标记为已看
    selectedAlbums.forEach((a) => globalSeenAlbumIds.add(a.id));

    // 计算 4:3 极值正方形尺寸与破碎排布（允许空槽位 Placeholder）
    return selectedAlbums.map((album, idx) => {
      // 4:3 比例因子（基础尺寸的 0.75 到 1.0 之间随机）
      const sizeScale = 0.75 + Math.random() * 0.25; 
      // 随机插入不规则留空标志（破碎美感）
      const isEmptySlot = Math.random() < 0.15 && idx > 0;

      return {
        id: album.id,
        album,
        sizeScale,
        isEmptySlot,
        // WP 8.1 倾斜进场动画延迟系数
        animationDelay: idx * 0.08,
      };
    });
  }, []);

  // ---------------------------------------------------------------------------
  // 4. API 数据拉取与刷新（旧磁贴淡出 -> 新磁贴排布与渐入）
  // ---------------------------------------------------------------------------
  const refreshTiles = useCallback(() => {
    if (allAlbums.length === 0) return;
    setIsFadingOut(true);

    setTimeout(() => {
      const nextTiles = generateTiles(allAlbums);
      setCurrentTiles(nextTiles);
      setIsFadingOut(false);
      setSelectedTileId(null);
      setActiveHoverTile(null);
    }, 300); // 300ms 对应淡出动画时长
  }, [allAlbums, generateTiles]);

  // 初始化拉取全量专辑列表
  useEffect(() => {
    async function fetchAlbums() {
      try {
        setLoading(true);
        const res = await fetch('/api/albums?summary=true');
        const data = await res.json();
        if (data && Array.isArray(data.albums)) {
          setAllAlbums(data.albums);
          setCurrentTiles(generateTiles(data.albums));
        }
      } catch (err) {
        console.error('Failed to fetch albums:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlbums();
  }, [generateTiles]);

  // ---------------------------------------------------------------------------
  // 5. 交互事件处理：移动端全向滑动刷新 & 桌面端滚轮左右切换
  // ---------------------------------------------------------------------------
  // 移动端 Touch 事件
  const handleTouchStart = (e) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    touchTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartPos.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const timeTaken = Date.now() - touchTimeRef.current;

    // 全向划动刷新：滑动距离 > 60px 且用时 < 400ms 触发
    if (distance > 60 && timeTaken < 400) {
      refreshTiles();
    }
  };

  // 桌面端选中的磁贴响应滚轮左右切换
  const handleWheel = (e) => {
    if (!selectedTileId) return;
    // 滚轮 Y 轴或 X 轴滚动均可触发左右平滑刷新
    if (Math.abs(e.deltaY) > 40 || Math.abs(e.deltaX) > 40) {
      refreshTiles();
    }
  };
  // ---------------------------------------------------------------------------
  // 6. 磁贴点击跳转事件（带 Monet 颜色预调色并跳转至 /music?album=[id]）
  // ---------------------------------------------------------------------------
  const handleTileClick = (tile) => {
    if (!tile || !tile.album) return;

    // 提取当前选中专辑的主色，联动全站月光青主色
    const coverUrl = tile.album.cover_url;
    if (coverUrl) {
      getMonetColor(coverUrl, (monetColor) => {
        setThemeColor(monetColor);
        // 携带专辑 ID 开启音乐播放页
        router.push(`/music?album=${tile.album.id}`);
      });
    } else {
      router.push(`/music?album=${tile.album.id}`);
    }
  };

  return (
    <Layout>
      {/* --------------------------------------------------------------------- */}
      {/* 顶部破碎美感标语与刷新手势提示 (文字 UI 严禁 Emoji)                      */}
      {/* --------------------------------------------------------------------- */}
      <div className="mb-6 flex items-baseline justify-between opacity-80 border-b border-current/10 pb-2">
        <div className="text-xs tracking-widest uppercase">
          [ YORUSHIKA DISC MESH / 盗作 & 夏色 ]
        </div>
        <button
          type="button"
          onClick={refreshTiles}
          className="text-xs tracking-wider transition-opacity hover:opacity-100 cursor-pointer font-bold"
        >
          [ REFRESH TILES ]
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* WP 8.1 极简 1:1 无边框破碎感磁贴网格主体                               */}
      {/* --------------------------------------------------------------------- */}
      <div
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`min-h-[70vh] transition-opacity duration-300 ${
          isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {loading ? (
          // 加载骨架屏 (保持 1:1 无边框正方形结构)
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="aspect-square bg-current/5 animate-pulse rounded-none"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 items-start">
            {currentTiles.map((tile) => {
              // 处理不规则留空槽位 (营造夜鹿破碎文学空灵感)
              if (tile.isEmptySlot) {
                return (
                  <div
                    key={`empty-${tile.id}`}
                    className="aspect-square hidden sm:block pointer-events-none"
                  />
                );
              }

              const { album } = tile;
              const isHovered = activeHoverTile?.id === tile.id;
              const isSelected = selectedTileId === tile.id;

              return (
                <div
                  key={tile.id}
                  onClick={() => {
                    setSelectedTileId(tile.id);
                    handleTileClick(tile);
                  }}
                  onMouseEnter={() => {
                    setActiveHoverTile(tile);
                    if (album.cover_url) {
                      getMonetColor(album.cover_url, (c) => setThemeColor(c));
                    }
                  }}
                  onMouseLeave={() => setActiveHoverTile(null)}
                  style={{
                    boxShadow: shadowStyle, // Smartisan OS 斜射物理光影
                    animationDelay: `${tile.animationDelay}s`,
                    transform: `scale(${tile.sizeScale})`, // 4:3 极值比例随机缩放
                  }}
                  className={`relative aspect-square cursor-pointer overflow-hidden rounded-none transition-all duration-300 group animate-tileFlip ${
                    isSelected ? 'ring-2 ring-current' : ''
                  }`}
                >
                  {/* 1. 磁贴底图 (专辑封面) */}
                  <img
                    src={album.cover_url || '/01.jpg'}
                    alt={album.title || album.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* 2. Google Pixel Monet 动态取色高斯模糊蒙版 */}
                  <div
                    className={`absolute inset-0 backdrop-blur-md bg-black/40 p-4 flex flex-col justify-between transition-opacity duration-300 ${
                      isHovered || isSelected ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {/* 蒙版顶部：专辑名与发行年份 */}
                    <div>
                      <p
                        className="text-xs font-bold tracking-wider uppercase mb-1 line-clamp-1"
                        style={{ color: themeColor }}
                      >
                        [ {album.title || album.name} ]
                      </p>
                      <p className="text-[10px] text-white/70 tracking-widest">
                        RELEASE: {album.release_date || '2020.07.29'}
                      </p>
                      <p className="text-[10px] text-white/70 tracking-widest">
                        TRACKS: {album.song_count || album.track_count || 10} SONGS
                      </p>
                    </div>

                    {/* 蒙版中部：代表歌词 (文学破碎感) */}
                    <div className="my-auto py-2">
                      <p className="text-xs italic text-white/90 line-clamp-3 leading-relaxed font-serif">
                        “{album.representative_lyric || '僕らはただ、夏の終わりに歌を盗む。'}”
                      </p>
                    </div>

                    {/* 蒙版底部：纯文字进入提示 */}
                    <div className="text-right">
                      <span
                        className="text-[10px] font-bold tracking-widest underline underline-offset-4"
                        style={{ color: themeColor }}
                      >
                        [ VIEW ALBUM &gt; ]
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* WP 8.1 3D 倾斜进场 (Tile Flip Entrance) 动画 CSS                      */}
      {/* --------------------------------------------------------------------- */}
      <style jsx>{`
        @keyframes tileFlip {
          0% {
            opacity: 0;
            transform: perspective(600px) rotateY(-30deg) translateX(-40px);
          }
          100% {
            opacity: 1;
            transform: perspective(600px) rotateY(0deg) translateX(0deg);
          }
        }
        .animate-tileFlip {
          animation: tileFlip 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </Layout>
  );
}
