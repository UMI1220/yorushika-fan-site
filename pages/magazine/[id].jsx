import { toCDNUrl } from '../../lib/cdn';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import JSZip from 'jszip';
import Layout from '../../components/Layout';

export default function MagazineDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decompressing, setDecompressing] = useState(false);
  
  // 解压提取出的图片 Blob URL 列表
  const [pageImages, setPageImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // 戳记与留言状态
  const [stamps, setStamps] = useState([]);
  const [activeCoords, setActiveCoords] = useState(null); // { x, y } 相对百分比
  const [selectedStamp, setSelectedStamp] = useState(null); // 📱 移动端/点击选中的戳记
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const readerAreaRef = useRef(null);
  const longPressTimerRef = useRef(null);

  // 📱 手机端触摸滑动坐标记录
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // 1. 获取期刊详情与已有戳记
  useEffect(() => {
    if (!id) return;

    async function fetchMagazineDetail() {
      try {
        setLoading(true);
        const res = await fetch('/api/list');
        const data = await res.json();
        
        const list = Array.isArray(data) ? data : (data.magazines || []);
        const currentMag = list.find((m) => String(m.id) === String(id));

        if (currentMag) {
          setMagazine(currentMag);
          const targetUrl = currentMag.zip_url || currentMag.file_url || currentMag.pdf_url;
          if (targetUrl) {
            loadAndUnzip(toCDNUrl(targetUrl));
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('获取期刊详情失败:', err);
        setLoading(false);
      }
    }

    fetchMagazineDetail();
    fetchStamps();
  }, [id]);

  // 监听键盘左右方向键操控翻页
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        setCurrentPage((p) => Math.max(1, p - 1));
        setActiveCoords(null);
        setSelectedStamp(null);
      } else if (e.key === 'ArrowRight') {
        setPageImages((images) => {
          if (images.length > 0) {
            setCurrentPage((p) => Math.min(images.length, p + 1));
            setActiveCoords(null);
            setSelectedStamp(null);
          }
          return images;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 拉取戳记列表
  async function fetchStamps() {
    if (!id) return;
    try {
      const res = await fetch(`/api/stamp?magazineId=${id}`);
      const data = await res.json();
      const list = data.annotations || data.stamps || (Array.isArray(data) ? data : []);
      setStamps(list);
    } catch (err) {
      console.error('获取戳记失败:', err);
    }
  }

  // 2. 解压 ZIP 并提取图片
  async function loadAndUnzip(fileUrl) {
    if (!fileUrl) {
      setLoading(false);
      return;
    }

    try {
      setDecompressing(true);
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('网络请求错误');
      const blob = await response.blob();
      
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(blob);

      const imagePromises = [];
      const imageNames = [];

      zipContent.forEach((relativePath, file) => {
        if (!file.dir && /\.(jpg|jpeg|png|webp|gif)$/i.test(relativePath)) {
          imageNames.push(relativePath);
        }
      });

      imageNames.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

      for (const name of imageNames) {
        const file = zipContent.file(name);
        if (file) {
          const p = file.async('blob').then((imgBlob) => URL.createObjectURL(imgBlob));
          imagePromises.push(p);
        }
      }

      const imageUrls = await Promise.all(imagePromises);
      setPageImages(imageUrls);
    } catch (err) {
      console.error('解压刊物失败:', err);
    } finally {
      setDecompressing(false);
      setLoading(false);
    }
  }

  // 📱 手机端滑动切页处理函数
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const distance = touchStartX.current - touchEndX.current;

    if (distance > 50 && currentPage < pageImages.length) {
      setCurrentPage((p) => Math.min(pageImages.length, p + 1));
      setActiveCoords(null);
      setSelectedStamp(null);
    } 
    else if (distance < -50 && currentPage > 1) {
      setCurrentPage((p) => Math.max(1, p - 1));
      setActiveCoords(null);
      setSelectedStamp(null);
    }
  };

  // 点击画幅：精准定位盖章位置
  const handlePageClick = (e) => {
    if (selectedStamp) {
      setSelectedStamp(null);
      return;
    }

    if (!readerAreaRef.current) return;
    const rect = readerAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setActiveCoords({ x: x.toFixed(2), y: y.toFixed(2) });
  };

  // 提交新戳记
  const handleStampSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          magazineId: id,
          pageIndex: currentPage,
          content,
          nickname: nickname.trim() || '月光下的鹿友',
          x_percent: activeCoords ? activeCoords.x : 50,
          y_percent: activeCoords ? activeCoords.y : 50,
        }),
      });

      if (res.ok) {
        setContent('');
        setActiveCoords(null);
        fetchStamps();
      } else {
        alert('戳记发送失败，请重试');
      }
    } catch (err) {
      console.error('提交戳记出错:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // 过滤当前页面的戳记
  const currentPageStamps = stamps.filter((s) => Number(s.page_index || s.pageIndex) === Number(currentPage));

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-32 font-mono text-xs text-zinc-400 animate-pulse">
          Loading magazine reader...
        </div>
      </Layout>
    );
  }

  if (!magazine) {
    return (
      <Layout>
        <div className="text-center py-32">
          <p className="text-xs font-mono text-zinc-400 mb-4">未找到该刊物信息</p>
          <Link href="/magazine" className="text-xs font-mono text-[#88abac] underline">
            ← 返回刊物列表
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8 relative">
        
        {/* 顶部刊物标题与返回 */}
        <div className="mb-6 flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <Link href="/magazine" className="text-xs font-mono text-[#88abac] hover:text-[#a5c9ca] transition">
              ← 返回列表
            </Link>
            <h1 className="text-xl font-serif text-zinc-900 mt-2">{magazine.title}</h1>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              By {magazine.author || 'Yorushika Fan Club'} · {magazine.issue_number || 'Vol.1'}
            </p>
          </div>
        </div>

        {/* 顶置翻页控制栏 */}
        {pageImages.length > 0 && !decompressing && (
          <div className="mb-6 flex items-center justify-between bg-zinc-50 px-6 py-3 rounded-2xl border border-zinc-200/80 shadow-sm">
            <button
              disabled={currentPage <= 1}
              onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); setActiveCoords(null); setSelectedStamp(null); }}
              className="px-5 py-2 bg-[#88abac] hover:bg-[#a5c9ca] text-white font-mono text-xs rounded-full disabled:opacity-30 transition shadow-sm"
            >
              ← 上一页
            </button>
            <div className="text-xs font-mono text-zinc-600 font-medium">
              第 <span className="text-[#88abac] font-bold text-sm">{currentPage}</span> / {pageImages.length} 页
            </div>
            <button
              disabled={currentPage >= pageImages.length}
              onClick={() => { setCurrentPage((p) => Math.min(pageImages.length, p + 1)); setActiveCoords(null); setSelectedStamp(null); }}
              className="px-5 py-2 bg-[#88abac] hover:bg-[#a5c9ca] text-white font-mono text-xs rounded-full disabled:opacity-30 transition shadow-sm"
            >
              下一页 →
            </button>
          </div>
        )}

        {/* 阅读器与浮动戳记区域 */}
        {decompressing ? (
          <div className="text-center py-24 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-xs font-mono text-zinc-400 animate-pulse">
              正在解压并加载画幅资源...
            </p>
          </div>
        ) : pageImages.length === 0 ? (
          <div className="text-center py-24 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-xs font-mono text-zinc-400">未在压缩包内识别到 JPG / PNG 图片</p>
          </div>
        ) : (
          <div className="flex flex-col items-center relative">
            
            {/* 图像容器：使用 relative 且防撑开 */}
            <div 
              ref={readerAreaRef}
              onClick={handlePageClick}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative max-w-3xl w-full bg-white shadow-xl rounded-xl border border-zinc-100 cursor-crosshair select-none touch-pan-y"
            >
              <img
                src={pageImages[currentPage - 1]}
                alt={`Page ${currentPage}`}
                className="w-full h-auto object-contain block rounded-xl"
              />

              {/* 渲染已有戳记图标：原本大小不透明度 + PC右键拖拽 / 手机长按拖拽松开弹回 */}
              {currentPageStamps.map((stamp, idx) => {
                const posX = Number(stamp.x_percent || stamp.x || 50);
                const posY = Number(stamp.y_percent || stamp.y || 50);
                const isSelected = selectedStamp && (selectedStamp.id === stamp.id || selectedStamp === stamp);
                
                // 判断左右半屏
                const isLeftHalf = posX < 50;

                return (
                  <div
                    key={stamp.id || idx}
                    style={{ left: `${posX}%`, top: `${posY}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group touch-none"
                  >
                    <div
                      style={{
                        transform: `translate(${stamp._dragOffset?.x || 0}px, ${stamp._dragOffset?.y || 0}px)`,
                        transition: stamp._isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                      className="p-2 cursor-pointer select-none"
                      onContextMenu={(e) => e.preventDefault()} // 阻止右键默认菜单
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const targetElement = e.currentTarget;

                        // 判别：是否为 PC 右键拖拽 (button === 2)
                        const isRightClick = e.button === 2;

                        const startDragging = () => {
                          try {
                            targetElement.setPointerCapture(e.pointerId);
                          } catch (err) {}
                          setStamps((prev) =>
                            prev.map((s) => (s === stamp || s.id === stamp.id ? { ...s, _isDragging: true } : s))
                          );
                        };

                        // 📱 手机端触摸长按 200ms 触发拖拽，PC端右键直接触发
                        if (isRightClick) {
                          startDragging();
                        } else if (e.pointerType === 'touch') {
                          longPressTimerRef.current = setTimeout(() => {
                            startDragging();
                          }, 200);
                        }

                        const handlePointerMove = (moveEvent) => {
                          const deltaX = moveEvent.clientX - startX;
                          const deltaY = moveEvent.clientY - startY;

                          // 如果移动距离超过 5px 且还没触发拖拽，取消长按定时器
                          if (Math.hypot(deltaX, deltaY) > 5 && !stamp._isDragging) {
                            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                          }

                          setStamps((prev) => {
                            const cur = prev.find((s) => s === stamp || s.id === stamp.id);
                            if (cur && cur._isDragging) {
                              return prev.map((s) =>
                                s === stamp || s.id === stamp.id
                                  ? { ...s, _dragOffset: { x: deltaX, y: deltaY } }
                                  : s
                              );
                            }
                            return prev;
                          });
                        };

                        const handlePointerUp = (upEvent) => {
                          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

                          setStamps((prev) =>
                            prev.map((s) =>
                              s === stamp || s.id === stamp.id
                                ? { ...s, _isDragging: false, _dragOffset: { x: 0, y: 0 } }
                                : s
                            )
                          );

                          try {
                            if (targetElement.hasPointerCapture(upEvent.pointerId)) {
                              targetElement.releasePointerCapture(upEvent.pointerId);
                            }
                          } catch (err) {}

                          window.removeEventListener('pointermove', handlePointerMove);
                          window.removeEventListener('pointerup', handlePointerUp);
                        };

                        window.addEventListener('pointermove', handlePointerMove);
                        window.addEventListener('pointerup', handlePointerUp);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // 触发点击看气泡
                        if (!stamp._isDragging) {
                          setActiveCoords(null);
                          setSelectedStamp(isSelected ? null : stamp);
                        }
                      }}
                    >
                      {/* 🌸 恢复原本样式的大小、透明度与悬停动画 */}
                      <div
                        className={`w-6 h-6 rounded-full bg-[#88abac]/90 backdrop-blur-sm border-2 border-white shadow-md flex items-center justify-center text-[11px] font-mono transition-transform active:scale-125 ${
                          isSelected ? 'scale-125 ring-2 ring-[#88abac]' : 'hover:scale-110'
                        }`}
                      >
                        🌸
                      </div>
                    </div>

                    {/* 💻 仅桌面端显示的原位 hover/click 气泡 */}
                    <div 
                      className={`
                        hidden sm:block absolute bottom-full mb-2 ${isLeftHalf ? 'left-0' : 'right-0'} w-64 p-4
                        bg-white/85 backdrop-blur-md border border-white/70 shadow-2xl rounded-2xl text-zinc-800 text-xs
                        transition-all duration-200 pointer-events-auto ${
                          isSelected ? 'scale-100 opacity-100' : 'scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100'
                        }
                      `}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/50 mb-2">
                        <span className="font-semibold text-xs text-[#88abac] font-mono truncate max-w-[150px]">
                          @{stamp.nickname || stamp.author || '月光下的鹿友'}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setSelectedStamp(null)} 
                          className="text-zinc-400 hover:text-zinc-700 text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-xs text-zinc-700 leading-relaxed break-words whitespace-pre-wrap font-sans">
                        {stamp.content}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* 激活盖章时的指示点 */}
              {activeCoords && (
                <div
                  style={{ left: `${activeCoords.x}%`, top: `${activeCoords.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#88abac] border-2 border-white shadow-lg flex items-center justify-center text-xs text-white z-30 animate-pulse pointer-events-none"
                >
                  ✍️
                </div>
              )}

              {/* 💻 仅桌面端（sm: block）原位绝对定位卡片，根据点击坐标定位 */}
              {activeCoords && (
                <div 
                  style={{
                    left: `${Math.min(Math.max(Number(activeCoords.x), 20), 80)}%`,
                    top: `${Math.min(Math.max(Number(activeCoords.y), 20), 80)}%`
                  }}
                  className="hidden sm:block absolute -translate-x-1/2 -translate-y-1/2 z-40 w-72 p-4 bg-white/85 backdrop-blur-md border border-white/70 shadow-2xl rounded-2xl transition-all animate-in fade-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <form onSubmit={handleStampSubmit}>
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-zinc-200/50">
                      <span className="text-[11px] font-mono text-[#88abac] font-semibold flex items-center gap-1">
                        <span>🌸</span> 留下画幅戳记
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveCoords(null)}
                        className="text-xs text-zinc-400 hover:text-zinc-700 transition"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <input
                        type="text"
                        placeholder="昵称 (可选)"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white/60 backdrop-blur-sm border border-zinc-200/80 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#88abac]"
                      />
                      <textarea
                        rows="2"
                        placeholder="写下对这一帧的感想/弹幕..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        autoFocus
                        className="w-full px-2.5 py-1.5 bg-white/60 backdrop-blur-sm border border-zinc-200/80 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#88abac] resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveCoords(null)}
                        className="px-3 py-1 bg-zinc-100/80 hover:bg-zinc-200 text-zinc-600 text-xs font-mono rounded-lg transition"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-1 bg-[#88abac] hover:bg-[#a5c9ca] text-white text-xs font-mono rounded-lg shadow-sm disabled:opacity-50 transition"
                      >
                        {submitting ? '发送中' : '发射 🚀'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>

            <p className="mt-4 text-[11px] font-mono text-zinc-400">
              💡 提示：电脑端右键拖拽/手机端长按拖拽可将戳记临时移开，点击角落即可盖章
            </p>

          </div>
        )}

        {/* 📱 手机专用浮层 */}
        {selectedStamp && (
          <div 
            className="sm:hidden fixed inset-x-4 bottom-6 z-[99] p-4 bg-white/85 backdrop-blur-md border border-white/80 shadow-2xl rounded-2xl animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/50 mb-2">
              <span className="font-semibold text-xs text-[#88abac] font-mono truncate max-w-[200px]">
                @{selectedStamp.nickname || selectedStamp.author || '月光下的鹿友'}
              </span>
              <button 
                type="button" 
                onClick={() => setSelectedStamp(null)} 
                className="text-zinc-400 hover:text-zinc-700 text-xs px-2 py-0.5"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-700 leading-relaxed break-words whitespace-pre-wrap font-sans my-1">
              {selectedStamp.content}
            </p>
          </div>
        )}

        {activeCoords && (
          <div 
            className="sm:hidden fixed inset-x-4 bottom-6 z-[99] p-4 bg-white/85 backdrop-blur-md border border-white/80 shadow-2xl rounded-2xl animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleStampSubmit}>
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-zinc-200/50">
                <span className="text-[11px] font-mono text-[#88abac] font-semibold flex items-center gap-1">
                  <span>🌸</span> 留下画幅戳记
                </span>
                <button
                  type="button"
                  onClick={() => setActiveCoords(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-700 transition"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  placeholder="昵称 (可选)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white/60 backdrop-blur-sm border border-zinc-200/80 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#88abac]"
                />
                <textarea
                  rows="2"
                  placeholder="写下对这一帧的感想/弹幕..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-2.5 py-1.5 bg-white/60 backdrop-blur-sm border border-zinc-200/80 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#88abac] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCoords(null)}
                  className="px-3 py-1 bg-zinc-100/80 hover:bg-zinc-200 text-zinc-600 text-xs font-mono rounded-lg transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1 bg-[#88abac] hover:bg-[#a5c9ca] text-white text-xs font-mono rounded-lg shadow-sm disabled:opacity-50 transition"
                >
                  {submitting ? '发送中' : '发射 🚀'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </Layout>
  );
}