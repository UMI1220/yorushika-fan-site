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
  
  // 戳记与留言弹窗状态
  const [stamps, setStamps] = useState([]);
  const [activeCoords, setActiveCoords] = useState(null);
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
        
        // 请求数据列表接口
        const res = await fetch('/api/list');
        const data = await res.json();
        
        // ✅ 兼容直接返回数组 [...] 或返回对象 { magazines: [...] } 的结构
        const list = Array.isArray(data) ? data : (data.magazines || []);
        const currentMag = list.find((item) => String(item.id) === String(id));

        if (!currentMag) {
          alert('未找到该刊物信息');
          router.push('/magazine');
          return;
        }

        setMagazine(currentMag);

        // 获取当前刊物的戳记弹幕
        try {
          const stampRes = await fetch(`/api/stamp?magazineId=${id}`);
          const stampData = await stampRes.json();
          if (stampData.success && stampData.annotations) {
            setStamps(stampData.annotations);
          }
        } catch (sErr) {
          console.error('获取戳记失败:', sErr);
        }

      } catch (err) {
        console.error('获取期刊详情失败:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMagazineDetail();
  }, [id, router]);

  // 2. 解压 ZIP 刊物资源并提取所有图片
  useEffect(() => {
    if (!magazine || !magazine.zip_url) return;

    async function decompressZip() {
      try {
        setDecompressing(true);
        
        // 下载 ZIP 文件
        const response = await fetch(magazine.zip_url);
        if (!response.ok) throw new Error('刊物 ZIP 资源下载失败');
        
        const zipBlob = await response.blob();
        const zip = await JSZip.loadAsync(zipBlob);

        const imageFiles = [];

        // 递归遍历 ZIP 包内的文件，按名字排序并提取图片
        const entries = Object.keys(zip.files).sort();

        for (const filename of entries) {
          const file = zip.files[filename];
          // 排除文件夹，只处理 jpg/png/jpeg/webp
          if (!file.dir && /\.(jpg|jpeg|png|webp)$/i.test(filename)) {
            const blob = await file.async('blob');
            const imageUrl = URL.createObjectURL(blob);
            imageFiles.push(imageUrl);
          }
        }

        if (imageFiles.length === 0) {
          alert('压缩包内未识别到 JPG/PNG 图片页面');
        } else {
          setPageImages(imageFiles);
        }
      } catch (err) {
        console.error('ZIP 解压失败:', err);
        alert(`刊物资源加载失败: ${err.message}`);
      } finally {
        setDecompressing(false);
      }
    }

    decompressZip();
  }, [magazine]);

  // 点击页面放置“戳记”
  const handlePageClick = (e) => {
    if (!readerAreaRef.current) return;
    const rect = readerAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setActiveCoords({ x: x.toFixed(2), y: y.toFixed(2) });
  };

  // 提交戳记评论
  const handleStampSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !activeCoords) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          magazineId: id,
          pageIndex: currentPage - 1,
          content: content.trim(),
          nickname: nickname.trim() || '匿名鹿友',
          x_percent: parseFloat(activeCoords.x),
          y_percent: parseFloat(activeCoords.y),
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || '戳记发表失败');

      // 本地刷新显示
      setStamps((prev) => [
        ...prev,
        {
          id: Date.now(),
          page_index: currentPage - 1,
          content: content.trim(),
          nickname: nickname.trim() || '匿名鹿友',
          x_percent: parseFloat(activeCoords.x),
          y_percent: parseFloat(activeCoords.y),
        },
      ]);

      setContent('');
      setActiveCoords(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-6 py-20 text-center font-mono text-xs text-zinc-400 animate-pulse">
          Loading magazine reader...
        </div>
      </Layout>
    );
  }

  if (!magazine) return null;

  // 当前页对应的戳记
  const currentPageStamps = stamps.filter((s) => Number(s.page_index) === currentPage - 1);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        
        {/* 返回按钮与头部标题 */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/magazine"
            className="text-xs font-mono text-zinc-500 hover:text-zinc-800 transition"
          >
            ← 返回刊物列表
          </Link>
          <span className="text-xs font-mono text-[#a5c9ca]">
            {magazine.issue_number || 'Vol.1'} · {magazine.author || 'Yorushika Fan Club'}
          </span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-xl sm:text-2xl font-serif text-zinc-900 mb-2">
            {magazine.title}
          </h1>
          <p className="text-xs text-zinc-500 font-light max-w-xl mx-auto">
            {magazine.description}
          </p>
        </div>

        {/* 翻页控制器 */}
        {pageImages.length > 0 && (
          <div className="flex items-center justify-center space-x-6 mb-6 font-mono text-xs text-zinc-600">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg disabled:opacity-30 transition"
            >
              上一页
            </button>
            <span>
              {currentPage} / {pageImages.length}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pageImages.length, p + 1))}
              disabled={currentPage === pageImages.length}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg disabled:opacity-30 transition"
            >
              下一页
            </button>
          </div>
        )}

        {/* 在线阅读与戳记交互核心区 */}
        <div className="relative bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl min-h-[500px] flex items-center justify-center">
          {decompressing ? (
            <div className="text-white font-mono text-xs animate-pulse">
              正在解压并渲染刊物高清页面...
            </div>
          ) : pageImages.length > 0 ? (
            <div
              ref={readerAreaRef}
              onClick={handlePageClick}
              className="relative cursor-crosshair select-none inline-block max-w-full"
            >
              <img
                src={pageImages[currentPage - 1]}
                alt={`Page ${currentPage}`}
                className="max-h-[85vh] w-auto object-contain mx-auto block"
              />

              {/* 渲染当前页已有戳记弹幕 */}
              {currentPageStamps.map((stamp) => (
                <div
                  key={stamp.id}
                  style={{
                    left: `${stamp.x_percent || 50}%`,
                    top: `${stamp.y_percent || 50}%`,
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-black/75 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full text-xs pointer-events-none shadow-lg animate-fade-in"
                >
                  <span className="text-[#a5c9ca] font-mono mr-1">
                    {stamp.nickname}:
                  </span>
                  {stamp.content}
                </div>
              ))}

              {/* 点击创建新戳记弹窗 */}
              {activeCoords && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    left: `${activeCoords.x}%`,
                    top: `${activeCoords.y}%`,
                  }}
                  className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-4 shadow-2xl border border-zinc-200 w-64 text-left"
                >
                  <h4 className="text-xs font-mono text-zinc-500 mb-2">
                    在此留下印记评论
                  </h4>
                  <form onSubmit={handleStampSubmit}>
                    <input
                      type="text"
                      placeholder="你的昵称 (可选)"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 mb-2 text-xs text-zinc-800 focus:outline-none focus:border-[#a5c9ca]"
                    />
                    <textarea
                      rows="3"
                      placeholder="写下对这一页的感受..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 mb-2 text-xs text-zinc-800 focus:outline-none focus:border-[#a5c9ca] resize-none"
                      required
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setActiveCoords(null)}
                        className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-xs font-mono"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-3 py-1 bg-[#a5c9ca] hover:bg-[#94b8b9] text-white rounded-lg text-xs font-mono disabled:opacity-50"
                      >
                        {submitting ? '发射中...' : '盖章'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="text-zinc-500 font-mono text-xs">
              无有效页面显示
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}