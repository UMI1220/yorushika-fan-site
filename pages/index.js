import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAudio } from '../components/Layout';

// -----------------------------------------------------------------------------
// 辅助函数: 实时计算坚果 OS 动态感知光影 (根据现实时间计算 Sunlight/Moonlight 偏移)
// -----------------------------------------------------------------------------
function getDynamicShadowStyle(theme) {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;

  if (theme === 'gekkou') {
    // [ 月光 ] 模式：极简缝隙月光深邃阴影
    return {
      boxShadow: '0px 12px 28px rgba(0, 0, 0, 0.75), 0px 4px 10px rgba(0, 0, 0, 0.5)',
    };
  }

  // [ 夏陰 ] 模式：随现实时刻平滑变化的光影角度 (晨光 -> 正午 -> 夕阳)
  const angle = ((hours - 6) / 12) * Math.PI; // 6点到18点弧度变化
  const offsetX = Math.cos(angle) * 12;
  const offsetY = Math.sin(angle) * 14 + 6;

  return {
    boxShadow: `${offsetX.toFixed(1)}px ${offsetY.toFixed(1)}px 24px rgba(0, 0, 0, 0.12), ${ (offsetX * 0.5).toFixed(1) }px ${ (offsetY * 0.5).toFixed(1) }px 8px rgba(0, 0, 0, 0.08)`,
  };
}

// -----------------------------------------------------------------------------
// 辅助函数: Canvas 动态 Monet 颜色提取 (提取专辑封面主色用于蒙版文字)
// -----------------------------------------------------------------------------
function extractDominantColor(imgUrl, callback) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = imgUrl;
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 10;
      canvas.height = 10;
      ctx.drawImage(img, 0, 0, 10, 10);
      const data = ctx.getImageData(0, 0, 10, 10).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      r = Math.floor(r / (data.length / 4));
      g = Math.floor(g / (data.length / 4));
      b = Math.floor(b / (data.length / 4));
      // 若提取颜色过淡，适当降低亮度提升对比度
      callback(`rgb(${r}, ${g}, ${b})`);
    } catch (e) {
      callback('#88abac'); // 降级兜底月光青
    }
  };
  img.onerror = () => callback('#88abac');
}

// -----------------------------------------------------------------------------
// 主组件: HomePage
// -----------------------------------------------------------------------------
export default function HomePage() {
  const router = useRouter();
  const { theme, setThemeColor } = useAudio();

  const [allAlbums, setAllAlbums] = useState([]);      // 全量专辑库
  const [displayedTiles, setDisplayedTiles] = useState([]); // 当前呈现在首页的磁贴数据
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);    // 当前悬停/选中的磁贴 ID
  const [tileColors, setTileColors] = useState({});    // 提取的主色集合 map { [id]: color }
  const [isFadingOut, setIsFadingOut] = useState(false);

  // 长按定时器 Ref
  const longPressTimer = useRef(null);
  // 移动端 Touch 坐标 Ref (用于自由拖拽刷新)
  const touchStartPos = useRef({ x: 0, y: 0 });

  // 1. 初始化拉取全量专辑摘要
  useEffect(() => {
    fetchAlbumsSummary();
  }, []);

  const fetchAlbumsSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/albums?summary=true');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAllAlbums(json.data);
        generateTiles(json.data);
      }
    } catch (err) {
      console.error('Fetch Albums Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. “不重复抽尽”核心抽取逻辑
  const generateTiles = (albumPool) => {
    if (!albumPool || albumPool.length === 0) return;

    // 读取 sessionStorage 中已访问过的 visitedAlbumIds
    let visited = [];
    try {
      visited = JSON.parse(sessionStorage.getItem('visitedAlbumIds') || '[]');
    } catch (e) {
      visited = [];
    }

    // 过滤出未访问过的专辑
    let unvisited = albumPool.filter(a => !visited.includes(a.id));

    // 如果未访问池不够或已空，清空记录重新开启新一轮全遍历
    if (unvisited.length === 0) {
      visited = [];
      sessionStorage.setItem('visitedAlbumIds', JSON.stringify([]));
      unvisited = [...albumPool];
    }

    // 计算当前设备适配的磁贴渲染数量 (例如: 6 ~ 9 个)
    const tileCount = Math.min(6, unvisited.length);

    // 从未访问池中随机抽取指定数量专辑
    const shuffled = [...unvisited].sort(() => 0.5 - Math.random());
    const selectedAlbums = shuffled.slice(0, tileCount);

    // 记录最新已访问的专辑 ID
    const newlyVisited = [...visited, ...selectedAlbums.map(a => a.id)];
    sessionStorage.setItem('visitedAlbumIds', JSON.stringify(newlyVisited));

    // 3. 计算 4:3 比例的不规则直角磁贴排布
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const maxTileSize = screenWidth < 640 ? 160 : 220; // S_max
    const minTileSize = Math.floor(maxTileSize * 0.75); // S_min (4:3)

    const formattedTiles = selectedAlbums.map((album, idx) => {
      // 随机尺寸在 [S_min, S_max] 之间
      const size = Math.floor(Math.random() * (maxTileSize - minTileSize + 1)) + minTileSize;
      
      // 提取专辑封面主色用于蒙版
      if (album.cover_url) {
        extractDominantColor(album.cover_url, (extractedColor) => {
          setTileColors(prev => ({ ...prev, [album.id]: extractedColor }));
        });
      }

      return {
        ...album,
        size,
        // WP8.1 3D 轴向进场动画延迟
        animDelay: idx * 80,
      };
    });

    setDisplayedTiles(formattedTiles);
  };

  // 4. 刷新机制 (旧磁贴淡出 -> 新抽取)
  const triggerRefresh = () => {
    if (isFadingOut || allAlbums.length === 0) return;
    setIsFadingOut(true);
    setTimeout(() => {
      generateTiles(allAlbums);
      setIsFadingOut(false);
    }, 300);
  };

  // 5. 桌面端滚轮横向刷新逻辑
  const handleWheel = (e) => {
    if (Math.abs(e.deltaX) > 40 || Math.abs(e.deltaY) > 40) {
      triggerRefresh();
    }
  };

  // 6. 移动端全向自由拖拽刷新
  const handleTouchStart = (e) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartPos.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartPos.current.y;
    // 滑动超过 80px 触发刷新
    if (Math.hypot(deltaX, deltaY) > 80) {
      triggerRefresh();
    }
  };

  // 7. 点击 / 双击 / 长按交互规约
  const handleTileTouchStart = (album) => {
    longPressTimer.current = setTimeout(() => {
      // 长按：提取该专辑主色，覆盖替换全站主题色 (themeColor)
      const color = tileColors[album.id] || '#88abac';
      setThemeColor(color);
    }, 800);
  };

  const handleTileTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleTileDoubleClick = (albumId) => {
    // 双击带参跳转播放页
    router.push(`/music?album=${albumId}`);
  };

  return (
    <div
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-[calc(100vh-3.5rem)] px-4 py-8 max-w-7xl mx-auto flex flex-col justify-center items-center select-none"
    >
      {/* 顶部简短提示 */}
      <div className="w-full flex justify-between items-center mb-6 font-mono text-[11px] opacity-60">
        <span>[ INDEX / TILES ARCHIVE ]</span>
        <button
          type="button"
          onClick={triggerRefresh}
          className="hover:underline focus:outline-none"
        >
          [ REFRESH ]
        </button>
      </div>

      {loading ? (
        <div className="font-mono text-xs tracking-widest opacity-60 py-20 animate-pulse">
          LOADING ARCHIVES...
        </div>
      ) : (
        /* ------------------- WP8.1 无边框正方形磁贴墙 ------------------- */
        <div
          className={`w-full flex flex-wrap justify-center items-center gap-4 sm:gap-6 transition-opacity duration-300 ${
            isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          {displayedTiles.map((album) => {
            const dynamicShadow = getDynamicShadowStyle(theme);
            const isHovered = hoveredId === album.id;
            const dominantColor = tileColors[album.id] || '#88abac';

            return (
              <div
                key={album.id}
                style={{
                  width: `${album.size}px`,
                  height: `${album.size}px`,
                  ...dynamicShadow,
                  animationDelay: `${album.animDelay}ms`,
                }}
                onMouseEnter={() => setHoveredId(album.id)}
                onMouseLeave={() => setHoveredId(null)}
                onTouchStart={() => handleTileTouchStart(album)}
                onTouchEnd={handleTileTouchEnd}
                onClick={() => setHoveredId(album.id)}
                onDoubleClick={() => handleTileDoubleClick(album.id)}
                className="relative bg-zinc-800 rounded-none overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1 active:scale-95 animate-in fade-in zoom-in-90"
              >
                {/* 专辑封面背景 */}
                <div
                  className="w-full h-full bg-cover bg-center rounded-none"
                  style={{ backgroundImage: `url(${album.cover_url || '/01.jpg'})` }}
                />

                {/* 悬停/点击：Google Pixel Monet 模糊蒙版 & 数据库代表歌词 (representative_lyric) */}
                <div
                  className={`absolute inset-0 backdrop-blur-md bg-black/40 transition-opacity duration-300 p-3 flex flex-col justify-between rounded-none ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {/* 顶部: 专辑名称与年份 */}
                  <div className="font-mono text-[10px] tracking-wider text-white/80 border-b border-white/20 pb-1 flex justify-between">
                    <span className="truncate max-w-[80%]">{album.title}</span>
                    <span>{album.release_date ? album.release_date.substring(0, 4) : ''}</span>
                  </div>

                  {/* 中间: 调取数据库 representative_lyric 字段展现日文金句 */}
                  <div className="my-auto font-serif text-xs leading-relaxed text-center px-1 font-medium">
                    <p style={{ color: dominantColor }}>
                      {album.representative_lyric || '言の葉の奥に、夏が咲いている。'}
                    </p>
                  </div>

                  {/* 底部: 歌曲数量与双击提示 */}
                  <div className="font-mono text-[9px] text-white/60 flex justify-between">
                    <span>{album.song_count ? `${album.song_count} TRACKS` : 'YORUSHIKA'}</span>
                    <span>[ DOUBLE CLICK ]</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 底部操作指南提示 */}
      <div className="mt-12 text-center font-mono text-[10px] opacity-40 space-y-1">
        <p>[ SWIPE / WHEEL TO REFRESH ]</p>
        <p>[ DOUBLE CLICK TO PLAY • LONG PRESS TO APPLY THEME COLOR ]</p>
      </div>
    </div>
  );
}
