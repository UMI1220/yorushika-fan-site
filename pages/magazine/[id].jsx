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
        const currentMag = (data.magazines || []).find(m => m.id.toString() === id.toString());
        
        if (currentMag) {
          setMagazine(currentMag);
          // 获取 pdf_url 并解压 (无论是叫 pdf_url 还是 pdfUrl)
          const fileUrl = currentMag.pdf_url || currentMag.pdfUrl;
          if (fileUrl) {
            loadAndUnzip(fileUrl);
          }
        }

        // 获取该期刊对应的所有戳记留言
        const stampRes = await fetch(`/api/stamp?magazineId=${id}`);
        const stampData = await stampRes.json();
        if (stampData && stampData.annotations) {
          setStamps(stampData.annotations);
        }
      } catch (err) {
        console.error('获取期刊详情失败:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMagazineDetail();
  }, [id]);

  // 2. 在线下载 ZIP 包并使用 JSZip 解压图片 (超强兼容版)
  const loadAndUnzip = async (zipUrl) => {
    setDecompressing(true);
    console.log('📦 开始读取 ZIP 压缩包:', zipUrl);

    try {
      const response = await fetch(zipUrl);
      if (!response.ok) throw new Error(`HTTP 状态码错误: ${response.status}`);

      const blob = await response.blob();
      const zip = await JSZip.loadAsync(blob);
      const filenames = [];

      // 遍历 zip 包内部的所有条目
      zip.forEach((relativePath, zipEntry) => {
        // 打印包内文件清单，方便排查
        console.log('📂 扫描 ZIP 内条目:', relativePath);

        const lowerPath = relativePath.toLowerCase();
        
        // 排除目录和苹果系统自动生成的隐藏缓存文件
        if (
          !zipEntry.isDirectory && 
          !relativePath.includes('__MACOSX') &&
          !relativePath.startsWith('.') &&
          (lowerPath.includes('.jpg') || lowerPath.includes('.jpeg') || lowerPath.includes('.png') || lowerPath.includes('.webp'))
        ) {
          filenames.push(relativePath);
        }
      });

      console.log('🔍 筛选匹配到的图片文件清单:', filenames);

      if (filenames.length === 0) {
        console.warn('⚠️ ZIP 包内未能成功匹配到 JPG/PNG 图片文件，请检查上面的扫描条目！');
        setDecompressing(false);
        return;
      }

      // 按文件名中的数字进行自然数字排序（匹配 page-1.jpg -> 1, page-2.jpg -> 2 ...）
      filenames.sort((a, b) => {
        const cleanA = a.split('/').pop() || '';
        const cleanB = b.split('/').pop() || '';
        const matchesA = cleanA.match(/\d+/g);
        const matchesB = cleanB.match(/\d+/g);
        const numA = matchesA ? parseInt(matchesA[matchesA.length - 1], 10) : 0;
        const numB = matchesB ? parseInt(matchesB[matchesB.length - 1], 10) : 0;
        return numA - numB;
      });

      // 将压缩包内的图片转为浏览器可直接渲染的 Blob URL
      const blobUrls = [];
      for (const name of filenames) {
        const fileData = await zip.file(name).async('blob');
        blobUrls.push(URL.createObjectURL(fileData));
      }

      console.log(`🎉 成功解压并准备渲染 ${blobUrls.length} 页图片！`);
      setPageImages(blobUrls);
    } catch (err) {
      console.error('❌ ZIP 在线解压失败:', err);
    } finally {
      setDecompressing(false);
    }
  };

  // 3. 点击视图图片捕获相对百分比坐标
  const handleReaderClick = (e) => {
    if (e.target.closest('.stamp-node') || e.target.closest('form')) return;

    const rect = readerAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setActiveCoords({ x, y });
  };

  // 4. 发送印章留言
  const handleAddStamp = async (e) => {
    e.preventDefault();
    if (!content.trim() || !activeCoords) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          magazineId: id,
          pageIndex: currentPage,
          x: activeCoords.x,
          y: activeCoords.y,
          content: content.trim(),
          nickname: nickname.trim() || '匿名粉丝',
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      // 重新拉取戳记
      const stampRes = await fetch(`/api/stamp?magazineId=${id}`);
      const stampData = await stampRes.json();
      if (stampData && stampData.annotations) {
        setStamps(stampData.annotations);
      }

      setContent('');
      setNickname('');
      setActiveCoords(null);
    } catch (err) {
      alert('留下印章失败：' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 筛选属于当前展示页的戳记
  const currentPageStamps = stamps.filter(
    (s) => (s.page_index || s.pageIndex || 1) === currentPage
  );

  const totalPages = pageImages.length || magazine?.total_pages || magazine?.totalPages || 1;

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-32 text-xs font-mono text-zinc-400 tracking-widest">
          正在读取刊物数据……
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-12 sm:py-20">
        
        {/* 返回按钮 */}
        <div className="mb-8">
          <Link 
            href="/magazine" 
            className="text-xs font-mono text-zinc-400 hover:text-zinc-800 transition tracking-widest inline-flex items-center space-x-2"
          >
            <span>← 返回刊物列表 / MAGAZINE INDEX</span>
          </Link>
        </div>

        {/* 刊物信息标头 */}
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-zinc-100 shadow-sm mb-10">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-40 aspect-[3/4] rounded-xl overflow-hidden shadow-md shrink-0 bg-zinc-100 border border-zinc-200">
              <img 
                src={magazine?.cover_img || magazine?.coverImg || '/covers/1.jpg'} 
                alt={magazine?.title} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <span className="text-xs font-mono text-[#a5c9ca] tracking-widest uppercase block mb-2">
                {magazine?.author || '回声编辑部'} · 共 {totalPages} 页
              </span>
              <h1 className="text-xl font-serif font-medium text-zinc-900 mb-3">
                {magazine?.title}
              </h1>
              <p className="text-xs text-zinc-600 font-light leading-relaxed mb-4">
                {magazine?.description || '暂无简介'}
              </p>
            </div>
          </div>
        </div>

        {/* 交互式阅读与印章区 */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-zinc-100 shadow-sm mb-12">
          
          {/* 阅读器控制头栏 */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b border-zinc-100 font-mono text-xs">
            <div className="flex items-center space-x-3">
              <span className="text-zinc-800 font-semibold tracking-widest uppercase">
                PAGE {currentPage} / {totalPages}
              </span>
              <span className="text-zinc-400 font-light">| 本页有 {currentPageStamps.length} 条印章</span>
            </div>

            {/* 翻页控制按钮 */}
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage <= 1 || decompressing}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-1.5 rounded-full bg-zinc-100 hover:bg-[#a5c9ca] hover:text-white disabled:opacity-30 transition"
              >
                ← 上一页
              </button>
              <button
                disabled={currentPage >= totalPages || decompressing}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-1.5 rounded-full bg-zinc-100 hover:bg-[#a5c9ca] hover:text-white disabled:opacity-30 transition"
              >
                下一页 →
              </button>
            </div>
          </div>

          {/* 解压中提示 */}
          {decompressing && (
            <div className="text-center py-24 font-mono text-xs text-[#a5c9ca] animate-pulse">
              正在解压高画质期刊图集包，请稍候...
            </div>
          )}

          {/* 图片渲染 & 印章覆盖层 */}
          {!decompressing && (
            <div 
              ref={readerAreaRef}
              onClick={handleReaderClick}
              className="relative w-full bg-zinc-900 rounded-xl overflow-hidden shadow-inner cursor-crosshair min-h-[600px] flex items-center justify-center select-none"
            >
              {/* 1. 当前页图片 */}
              {pageImages.length > 0 ? (
                <img 
                  src={pageImages[currentPage - 1]} 
                  alt={`Page ${currentPage}`} 
                  className="max-h-[850px] w-auto object-contain pointer-events-none"
                />
              ) : (
                <div className="text-xs font-mono text-zinc-400 p-12 text-center">
                  暂无图片预览或未能读取到 ZIP 包内容
                </div>
              )}

              {/* 2. 当前页上的所有印章点 */}
              {currentPageStamps.map((stamp, idx) => (
                <div 
                  key={stamp.id || idx}
                  style={{ top: `${stamp.y || 50}%`, left: `${stamp.x || 50}%` }}
                  className="absolute stamp-node -translate-x-1/2 -translate-y-1/2 z-30 group/stamp"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-8 h-8 rounded-full bg-[#a5c9ca] text-white border-2 border-white shadow-lg flex items-center justify-center text-xs font-mono hover:scale-125 transition-transform cursor-pointer animate-pulse">
                    💮
                  </div>
                  
                  {/* 悬浮预览弹窗 */}
                  <div className="absolute left-9 top-0 hidden group-hover/stamp:block bg-white/95 backdrop-blur-md text-zinc-800 p-3.5 rounded-xl shadow-2xl border border-zinc-200 text-xs w-52 z-40">
                    <div className="flex justify-between items-center mb-1.5 text-[10px] font-mono text-[#a5c9ca]">
                      <span className="font-medium">{stamp.nickname || '匿名粉丝'}</span>
                      <span>{stamp.created_at ? new Date(stamp.created_at).toLocaleDateString() : '刚刚'}</span>
                    </div>
                    <p className="font-light leading-relaxed text-zinc-700">{stamp.content}</p>
                  </div>
                </div>
              ))}

              {/* 3. 盖章添加弹窗 */}
              {activeCoords && (
                <div 
                  style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                  className="absolute z-50 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-zinc-200 w-80 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-mono font-medium text-zinc-800 text-xs">
                      💮 在第 {currentPage} 页留下印章
                    </span>
                    <button 
                      onClick={() => setActiveCoords(null)}
                      className="text-zinc-400 hover:text-zinc-700 text-base"
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleAddStamp}>
                    <input 
                      type="text"
                      placeholder="你的昵称 (可选)"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 mb-2 text-zinc-800 focus:outline-none focus:border-[#a5c9ca]"
                    />
                    <textarea 
                      rows="3"
                      placeholder="写下对这一页的感受..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 mb-3 text-zinc-800 focus:outline-none focus:border-[#a5c9ca] resize-none"
                      required
                      autoFocus
                    />
                    <div className="flex justify-end space-x-2">
                      <button 
                        type="button"
                        onClick={() => setActiveCoords(null)}
                        className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg"
                      >
                        取消
                      </button>
                      <button 
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-1.5 bg-[#a5c9ca] hover:bg-[#94b8b9] text-white rounded-lg font-mono disabled:opacity-50"
                      >
                        {submitting ? '发送中...' : '盖章发射'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}