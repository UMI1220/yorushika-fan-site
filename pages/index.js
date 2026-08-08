import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import { YORUSHIKA_DISCOGRAPHY } from '../lib/discography';

// Google Pixel 画布主色提取算法
function extractPixelColor(imageSrc, callback) {
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
      if (brightness > 30 && brightness < 230) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
    }
    if (count > 0) {
      callback(`rgb(${Math.floor(r / count)}, ${Math.floor(g / count)}, ${Math.floor(b / count)})`);
    } else {
      callback('#a5c9ca');
    }
  };
  img.onerror = () => callback('#a5c9ca');
}

export default function Home() {
  const router = useRouter();
  
  // 状态管理
  const [albums] = useState(YORUSHIKA_DISCOGRAPHY);
  const [isMoonlight, setIsMoonlight] = useState(false);
  const [themeColor, setThemeColor] = useState('#a5c9ca'); // 默认月光青
  const [extractedColors, setExtractedColors] = useState({});
  const [activeTileId, setActiveTileId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  
  // 坚果 OS 风格“感知光影”实时角度（基于 24 小时时间）
  const [shadowAngle, setShadowAngle] = useState({ x: 4, y: 8, blur: 12 });

  // 引用与长按定时器
  const containerRef = useRef(null);
  const longPressTimer = useRef(null);
  const resetBlurTimer = useRef(null);

  // 1. 自动计算当前真实时间的光影角度
  useEffect(() => {
    const updateLightAndShadow = () => {
      const now = new Date();
      const hours = now.getHours() + now.getMinutes() / 60;
      // 将 24 小时映射为 -180 deg 到 180 deg 的太阳/月亮轨道角度
      const rad = ((hours - 12) / 12) * Math.PI;
      const shadowX = Math.round(Math.sin(rad) * 12);
      const shadowY = Math.round(Math.cos(rad) * 10) + 4;
      setShadowAngle({ x: shadowX, y: shadowY, blur: 14 });
    };

    updateLightAndShadow();
    const interval = setInterval(updateLightAndShadow, 60000); // 每分钟刷新一次光影
    return () => clearInterval(interval);
  }, []);

  // 2. 批量提取专辑封面主色
  useEffect(() => {
    albums.forEach((album) => {
      extractPixelColor(album.cover, (color) => {
        setExtractedColors((prev) => ({ ...prev, [album.id]: color }));
      });
    });
    // 进场动画延迟触发生效
    setTimeout(() => setLoaded(true), 150);
  }, [albums]);

  // 3. PC端滚轮左右滑动
  const handleWheel = (e) => {
    if (containerRef.current) {
      containerRef.current.scrollLeft += e.deltaY * 1.2;
    }
  };

  // 4. 磁贴点击 / 双击 / 自动复原逻辑
  const handleTileClick = (albumId) => {
    if (activeTileId === albumId) {
      // 再次点击（复原前再点一次）：进入音乐播放页
      router.push(`/music?album=${albumId}`);
    } else {
      setActiveTileId(albumId);
      
      // 一段时间不动后自动复原蒙版
      if (resetBlurTimer.current) clearTimeout(resetBlurTimer.current);
      resetBlurTimer.current = setTimeout(() => {
        setActiveTileId(null);
      }, 4500);
    }
  };

  // 5. 长按磁贴：提取当前专辑主色更新全站主题色
  const handleTouchStart = (albumId) => {
    longPressTimer.current = setTimeout(() => {
      const color = extractedColors[albumId] || '#a5c9ca';
      setThemeColor(color);
      if (navigator.vibrate) navigator.vibrate(50); // 震动反馈
    }, 700);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <Layout 
      isMoonlight={isMoonlight} 
      onToggleTheme={() => setIsMoonlight(!isMoonlight)}
      themeColor={themeColor}
    >
      <Head>
        <title>ヨルシカ (Yorushika) - OFFICIAL DISCOGRAPHY</title>
      </Head>

      <div className="w-full min-h-[calc(100vh-80px)] py-6 px-4 sm:px-8 flex flex-col justify-between overflow-hidden">
        
        {/* 顶部标头与诗意点缀 */}
        <div className="max-w-7xl mx-auto w-full mb-4 flex justify-between items-end border-b border-zinc-500/20 pb-3">
          <div>
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase opacity-50 block mb-1">
              DISCOGRAPHY / 言の葉と夏の幻
            </span>
            <h1 className="text-base sm:text-xl font-serif tracking-widest font-light">
              作品集・音楽泥棒の盗作
            </h1>
          </div>
          <div className="text-right font-serif text-xs opacity-60 hidden sm:block">
            <span>「言葉に出来ないから、歌を歌うことにした」</span>
          </div>
        </div>

        {/* 磁贴画廊区域 (手机端任意方向滑动，PC端滚轮左右切换) */}
        <div 
          ref={containerRef}
          onWheel={handleWheel}
          className="w-full overflow-x-auto overflow-y-auto sm:overflow-y-hidden no-scrollbar py-8 my-auto touch-pan-x touch-pan-y"
        >
          {/* 不规则布局网格：
            - 直角无圆角磁贴（无边框）
            - 尺寸比例：最大磁贴与最小磁贴为 4:3 
              手机端：最小 120px，最大 160px (160:120 = 4:3)
              PC端：  最小 180px，最大 240px (240:180 = 4:3)
          */}
          <div className="grid grid-flow-dense grid-rows-3 sm:grid-rows-2 gap-3 sm:gap-5 auto-cols-[120px] sm:auto-cols-[180px] w-max">
            {albums.map((album, index) => {
              const isSelected = activeTileId === album.id;
              const extractedColor = extractedColors[album.id] || themeColor;

              // 根据 4:3 比例控制磁贴尺寸与跨度，制造破碎感与不规则留空
              const isMaxTile = (index * 7) % 5 === 0;
              const isMediumTile = (index * 3) % 4 === 0;
              
              // 4:3 尺寸计算 (例如 1x1 最小，2x2 或 2x1 跨度)
              let spanClass = 'col-span-1 row-span-1 w-[120px] h-[120px] sm:w-[180px] sm:h-[180px]';
              if (isMaxTile) {
                // 最大磁贴边长 (160px / 240px，保持 4:3)
                spanClass = 'col-span-2 row-span-2 w-[160px] h-[160px] sm:w-[240px] sm:h-[240px]';
              } else if (isMediumTile) {
                spanClass = 'col-span-2 row-span-1 w-[160px] h-[120px] sm:w-[240px] sm:h-[180px]';
              }

              // 感知光影动态 Shadow & Glow
              const shadowStyle = isMoonlight ? {
                // 月光模式：透光缝隙与月光背光
                boxShadow: `${-shadowAngle.x}px ${shadowAngle.y}px ${shadowAngle.blur}px rgba(165, 201, 202, 0.18)`,
              } : {
                // 夏陰模式：感知日光投影
                boxShadow: `${shadowAngle.x}px ${shadowAngle.y}px ${shadowAngle.blur}px rgba(0, 0, 0, 0.15)`,
              };

              return (
                <div
                  key={album.id}
                  onClick={() => handleTileClick(album.id)}
                  onTouchStart={() => handleTouchStart(album.id)}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={() => handleTouchStart(album.id)}
                  onMouseUp={handleTouchEnd}
                  style={{
                    ...shadowStyle,
                    animationDelay: `${(index % 10) * 80}ms`,
                  }}
                  className={`relative cursor-pointer overflow-hidden rounded-none border-none select-none transition-all duration-500 transform ${spanClass} ${
                    loaded ? 'animate-in fade-in slide-in-from-left-12 duration-700' : 'opacity-0'
                  }`}
                >
                  {/* 专辑封面底图 */}
                  <img
                    src={album.cover}
                    alt={album.name}
                    className="w-full h-full object-cover rounded-none transition-transform duration-700 hover:scale-105"
                  />

                  {/* 磁贴右下角发售日期 */}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-mono px-1 py-0.5 pointer-events-none">
                    {album.date}
                  </div>

                  {/* Google Pixel 高斯模糊蒙版与提取色渲染：
                    保留“言の葉”、“夏の幻”等文学引言与中日文诗意文案
                  */}
                  <div 
                    className={`absolute inset-0 backdrop-blur-md transition-all duration-300 p-3 flex flex-col justify-between ${
                      isSelected 
                        ? 'opacity-100 bg-black/75' 
                        : 'opacity-0 hover:opacity-100 bg-black/65'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span 
                          className="text-[8px] font-mono tracking-widest uppercase block"
                          style={{ color: extractedColor }}
                        >
                          {album.type}
                        </span>
                        <span className="text-[8px] font-serif opacity-70 text-zinc-300">
                          言の葉
                        </span>
                      </div>
                      
                      <h3 className="text-xs sm:text-sm font-serif font-medium text-white line-clamp-2 leading-tight">
                        {album.name}
                      </h3>
                    </div>

                    <div>
                      {/* 保留言之叶、夏之幻等金句与日文文案 */}
                      <p 
                        className="text-[10px] font-serif italic line-clamp-2 leading-relaxed"
                        style={{ color: extractedColor }}
                      >
                        {album.quote}
                      </p>
                      
                      <div className="mt-2 pt-1 border-t border-white/10 flex justify-between items-center text-[8px] font-mono text-zinc-300">
                        <span>再点进入播放</span>
                        <span>長押し色抽</span>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* 底部极简交互提示 */}
        <div className="text-center font-mono text-[9px] opacity-40 py-2">
          <span className="sm:hidden">← 任意方向滑动刷新磁贴 · 轻触取色 · 再点进入音乐页 →</span>
          <span className="hidden sm:inline">← 点击选中磁贴 · 滚轮左右切换 · 长按提取主题色 · 双击进入播放页 →</span>
        </div>

      </div>
    </Layout>
  );
}
