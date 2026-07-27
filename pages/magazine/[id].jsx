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

  // 1. 获取期刊详情
  useEffect(() => {
    if (!id) return;

    async function fetchMagazineDetail() {
      try {
        setLoading(true);
        const res = await fetch('/api/list');
        const data = await res.json();
        
        // 兼容数组或 { magazines: [...] } 结构
        const list = Array.isArray(data) ? data : (data.magazines || []);
        const currentMag = list.find((m) => String(m.id) === String(id));

        if (currentMag) {
          setMagazine(currentMag);
          // 拿到数据后开始下载解压 ZIP
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
  }, [id]);

  // 2. 解压 ZIP 并提取所有图片
  async function loadAndUnzip(fileUrl) {
    if (!fileUrl) {
      console.error('未找到 ZIP 资源链接');
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

      // 遍历 ZIP 中所有文件，识别常见图片格式（支持嵌套子文件夹）
      zipContent.forEach((relativePath, file) => {
        if (!file.dir && /\.(jpg|jpeg|png|webp|gif)$/i.test(relativePath)) {
          imageNames.push(relativePath);
        }
      });

      // 自然排序文件名 (如 page1.jpg, page2.jpg, page10.jpg)
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
        
        {/* 返回按钮 & 标题 */}
        <div className="mb-8 flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <Link href="/magazine" className="text-xs font-mono text-zinc-400 hover:text-zinc-700 transition">
              ← 返回列表
            </Link>
            <h1 className="text-xl font-serif text-zinc-900 mt-2">{magazine.title}</h1>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              By {magazine.author || 'Yorushika Fan Club'} · {magazine.issue_number || 'Vol.1'}
            </p>
          </div>

          {pageImages.length > 0 && (
            <div className="text-xs font-mono text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full">
              {currentPage} / {pageImages.length} 页
            </div>
          )}
        </div>

        {/* 阅读器主区域 */}
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
          <div className="flex flex-col items-center">
            {/* 当前页面图片 */}
            <div className="relative max-w-3xl w-full bg-white shadow-lg rounded-lg overflow-hidden border border-zinc-100">
              <img
                src={pageImages[currentPage - 1]}
                alt={`Page ${currentPage}`}
                className="w-full h-auto object-contain select-none"
              />
            </div>

            {/* 翻页控制按钮 */}
            <div className="mt-8 flex items-center space-x-6 font-mono text-xs">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-5 py-2 bg-zinc-900 text-white rounded-full disabled:opacity-30 hover:bg-zinc-800 transition"
              >
                上一页
              </button>
              <span className="text-zinc-400">
                {currentPage} / {pageImages.length}
              </span>
              <button
                disabled={currentPage >= pageImages.length}
                onClick={() => setCurrentPage((p) => Math.min(pageImages.length, p + 1))}
                className="px-5 py-2 bg-zinc-900 text-white rounded-full disabled:opacity-30 hover:bg-zinc-800 transition"
              >
                下一页
              </button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}