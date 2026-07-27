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
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const readerAreaRef = useRef(null);

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
          loadAndUnzip(currentMag.zip_url || currentMag.pdf_url);
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

  // 拉取戳记列表
  async function fetchStamps() {
    if (!id) return;
    try {
      const res = await fetch(`/api/stamp?magazineId=${id}`);
      const data = await res.json();
      if (data && Array.isArray(data.stamps)) {
        setStamps(data.stamps);
      } else if (Array.isArray(data)) {
        setStamps(data);
      }
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

  // 点击画幅，精准定位盖章位置并弹出浮层
  const handlePageClick = (e) => {
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
          <Link href="/magazine" className="text-xs font-mono text-[#a5c9ca] underline">
            ← 返回刊物列表
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* 顶部刊物标题与返回 */}
        <div className="mb-6 flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <Link href="/magazine" className="text-xs font-mono text-zinc-400 hover:text-zinc-700 transition">
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
              onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); setActiveCoords(null); }}
              className="px-5 py-2 bg-zinc-900 text-white font-mono text-xs rounded-full disabled:opacity-30 hover:bg-zinc-800 transition"
            >
              ← 上一页
            </button>
            <div className="text-xs font-mono text-zinc-600 font-medium">
              第 <span className="text-[#a5c9ca] font-bold text-sm">{currentPage}</span> / {pageImages.length} 页
            </div>
            <button
              disabled={currentPage >= pageImages.length}
              onClick={() => { setCurrentPage((p) => Math.min(pageImages.length, p + 1)); setActiveCoords(null); }}
              className="px-5 py-2 bg-zinc-900 text-white font-mono text-xs rounded-full disabled:opacity-30 hover:bg-zinc-800 transition"
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
            
            {/* 图像容器，支持点选盖章 */}
            <div 
              ref={readerAreaRef}
              onClick={handlePageClick}
              className="relative max-w-3xl w-full bg-white shadow-xl rounded-xl overflow-hidden border border-zinc-100 cursor-crosshair select-none"
            >
              <img
                src={pageImages[currentPage - 1]}
                alt={`Page ${currentPage}`}
                className="w-full h-auto object-contain block"
              />

              {/* 渲染已有戳记 */}
              {currentPageStamps.map((stamp, idx) => {
                const posX = stamp.x_percent || stamp.x || 50;
                const posY = stamp.y_percent || stamp.y || 50;
                return (
                  <div
                    key={stamp.id || idx}
                    style={{ left: `${posX}%`, top: `${posY}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#a5c9ca]/80 backdrop-blur-sm border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white font-mono animate-bounce cursor-pointer">
                      🌸
                    </div>
                    {/* 悬浮提示框 */}
                    <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover:block w-48 p-2.5 bg-zinc-900/95 text-white rounded-lg text-xs shadow-xl z-30 pointer-events-none">
                      <p className="font-semibold text-[11px] text-[#a5c9ca]">{stamp.nickname || stamp.author || '粉丝'}</p>
                      <p className="text-[11px] text-zinc-200 mt-0.5">{stamp.content}</p>
                    </div>
                  </div>
                );
              })}

              {/* 激活盖章时的精准原点指示 */}
              {activeCoords && (
                <div
                  style={{ left: `${activeCoords.x}%`, top: `${activeCoords.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-rose-500/80 border-2 border-white shadow-lg flex items-center justify-center text-xs text-white z-30 animate-pulse pointer-events-none"
                >
                  ✍️
                </div>
              )}
            </div>

            {/* 🌟 核心改进：在点击位置即时弹出浮动输入框 🌟 */}
            {activeCoords && (
              <div 
                style={{
                  left: `${Math.min(Math.max(Number(activeCoords.x), 15), 85)}%`,
                  top: `${Math.min(Math.max(Number(activeCoords.y), 15), 80)}%`
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-40 w-72 bg-white/95 backdrop-blur-md border border-zinc-200/90 rounded-2xl p-4 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <form onSubmit={handleStampSubmit}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-[#a5c9ca] font-semibold flex items-center gap-1">
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
                      className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#a5c9ca]"
                    />
                    <textarea
                      rows="2"
                      placeholder="写下对这一帧的感想/弹幕..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      autoFocus
                      className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-[#a5c9ca] resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCoords(null)}
                      className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-mono rounded-lg transition"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-1 bg-[#a5c9ca] hover:bg-[#94b8b9] text-white text-xs font-mono rounded-lg shadow-sm disabled:opacity-50 transition"
                    >
                      {submitting ? '发送中' : '发射 🚀'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <p className="mt-4 text-[11px] font-mono text-zinc-400">
              💡 提示：点击画幅任意角落即可原地弹出留言框盖章
            </p>

          </div>
        )}

      </div>
    </Layout>
  );
}