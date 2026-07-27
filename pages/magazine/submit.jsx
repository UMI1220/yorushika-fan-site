import { useState } from 'react';
import { useRouter } from 'next/router';
import JSZip from 'jszip';
import Layout from '../../components/Layout';

export default function SubmitMagazine() {
  const router = useRouter();

  // 表单基础状态
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  
  // 封面图片文件
  const [coverFile, setCoverFile] = useState(null);

  // 上传模式切换: 'zip' (直接传ZIP包) | 'images' (多图自动打包)
  const [uploadMode, setUploadMode] = useState('zip');

  // 文件状态
  const [zipFile, setZipFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);

  // 提交状态与进度
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('');

  // 处理提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('请输入刊物名称');
      return;
    }
    if (!coverFile) {
      alert('请上传刊物封面图');
      return;
    }

    if (uploadMode === 'zip' && !zipFile) {
      alert('请选择需要上传的 ZIP 压缩包');
      return;
    }

    if (uploadMode === 'images' && imageFiles.length === 0) {
      alert('请选择至少一张期刊页面图片');
      return;
    }

    setSubmitting(true);

    try {
      let finalZipBlob = null;
      let finalZipFileName = '';

      // ----------------------------------------------------
      // 1. 处理刊物主体文件 (根据模式生成或获取 ZIP Blob)
      // ----------------------------------------------------
      if (uploadMode === 'zip') {
        setStatusText('正在准备上传 ZIP 文件...');
        finalZipBlob = zipFile;
        finalZipFileName = zipFile.name;
      } else {
        // 模式 B：在线将多张图片使用 JSZip 打包
        setStatusText(`正在将 ${imageFiles.length} 张图片在线打包压缩中...`);
        const zip = new JSZip();

        // 将选中的多图按自然数字名称排序 (如 page-1.jpg, page-2.jpg)
        const sortedImages = Array.from(imageFiles).sort((a, b) => {
          const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
          const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
          return numA - numB;
        });

        // 将排序后的图片逐个写入 ZIP 实例根目录
        sortedImages.forEach((file, index) => {
          // 保持原扩展名或统一规范格式
          const ext = file.name.split('.').pop() || 'jpg';
          const formattedName = `page-${index + 1}.${ext}`;
          zip.file(formattedName, file);
        });

        // 异步生成 zip Blob
        finalZipBlob = await zip.generateAsync({ type: 'blob' });
        finalZipFileName = `${Date.now()}-magazine.zip`;
      }

      // ----------------------------------------------------
      // 2. 将封面图上传至后端 API
      // ----------------------------------------------------
      setStatusText('正在上传封面图...');
      const coverFormData = new FormData();
      coverFormData.append('file', coverFile);

      const coverRes = await fetch('/api/upload', {
        method: 'POST',
        body: coverFormData,
      });

      const coverData = await coverRes.json();
      if (!coverRes.ok) throw new Error(coverData.error || '封面图上传失败');
      const coverUrl = coverData.url;

      // ----------------------------------------------------
      // 3. 将 ZIP Blob 上传至后端 API
      // ----------------------------------------------------
      setStatusText('正在上传期刊图片包...');
      const zipFormData = new FormData();
      // 创建一个新的 File 对象传给后端
      const zipFileToUpload = new File([finalZipBlob], finalZipFileName, {
        type: 'application/zip',
      });
      zipFormData.append('file', zipFileToUpload);

      const zipRes = await fetch('/api/upload', {
        method: 'POST',
        body: zipFormData,
      });

      const zipData = await zipRes.json();
      if (!zipRes.ok) throw new Error(zipData.error || 'ZIP 文件上传失败');
      const pdfUrl = zipData.url; // 这里依然存入数据库的 pdf_url 字段

      // ----------------------------------------------------
      // 4. 计算总页数并向数据库写入条目
      // ----------------------------------------------------
      setStatusText('正在录入期刊数据库记录...');
      const totalPagesCount = uploadMode === 'images' ? imageFiles.length : 1;

      const createRes = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim() || '回声编辑部',
          description: description.trim(),
          coverImg: coverUrl,
          pdfUrl: pdfUrl,
          totalPages: totalPagesCount,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || '写入数据库失败');

      setStatusText('发布成功！即将跳转...');
      setTimeout(() => {
        router.push('/magazine');
      }, 1000);

    } catch (err) {
      console.error('发布失败:', err);
      alert('发布失败: ' + err.message);
    } finally {
      setSubmitting(false);
      setStatusText('');
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-12 sm:py-20">
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-zinc-100 shadow-sm">
          
          <div className="mb-8 border-b border-zinc-100 pb-6">
            <h1 className="text-xl font-serif font-medium text-zinc-900 mb-2">
              发布新刊物 / PUBLISH MAGAZINE
            </h1>
            <p className="text-xs font-mono text-zinc-400">
              填写刊物基本信息并上传高清图集包
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            
            {/* 刊物名称 */}
            <div>
              <label className="block font-mono text-zinc-700 font-medium mb-2">
                刊物名称 *
              </label>
              <input
                type="text"
                placeholder="例如：Echo Issue 01 - 夏季特别号"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-800 focus:outline-none focus:border-[#a5c9ca] transition"
                required
              />
            </div>

            {/* 作者/编辑部 */}
            <div>
              <label className="block font-mono text-zinc-700 font-medium mb-2">
                作者 / 编辑部
              </label>
              <input
                type="text"
                placeholder="例如：回声编辑部"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-zinc-800 focus:outline-none focus:border-[#a5c9ca] transition"
              />
            </div>

            {/* 简介 */}
            <div>
              <label className="block font-mono text-zinc-700 font-medium mb-2">
                刊物简介
              </label>
              <textarea
                rows="3"
                placeholder="请输入刊物的简短介绍..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-zinc-800 focus:outline-none focus:border-[#a5c9ca] transition resize-none"
              />
            </div>

            {/* 封面图上传 */}
            <div>
              <label className="block font-mono text-zinc-700 font-medium mb-2">
                刊物封面图 (JPG / PNG) *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="w-full text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-mono file:bg-[#a5c9ca]/10 file:text-[#a5c9ca] hover:file:bg-[#a5c9ca]/20"
                required
              />
            </div>

            {/* 上传模式选择 Tab */}
            <div className="pt-4 border-t border-zinc-100">
              <label className="block font-mono text-zinc-700 font-medium mb-3">
                选择期刊内容上传方式 *
              </label>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setUploadMode('zip')}
                  className={`py-3 px-4 rounded-xl border text-center font-mono transition ${
                    uploadMode === 'zip'
                      ? 'border-[#a5c9ca] bg-[#a5c9ca]/10 text-[#a5c9ca] font-medium'
                      : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  📦 模式 A：直接上传现成 ZIP 包
                </button>

                <button
                  type="button"
                  onClick={() => setUploadMode('images')}
                  className={`py-3 px-4 rounded-xl border text-center font-mono transition ${
                    uploadMode === 'images'
                      ? 'border-[#a5c9ca] bg-[#a5c9ca]/10 text-[#a5c9ca] font-medium'
                      : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  🖼️ 模式 B：多选图片（自动压缩打包）
                </button>
              </div>

              {/* 模式 A 的窗口：选择 ZIP 文件 */}
              {uploadMode === 'zip' && (
                <div className="bg-zinc-50 rounded-xl p-5 border border-dashed border-zinc-200">
                  <span className="block text-zinc-500 mb-2 font-mono">
                    上传打包好的包含图片页面的 ZIP 文件：
                  </span>
                  <input
                    type="file"
                    accept=".zip,application/zip"
                    onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                    className="w-full text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-mono file:bg-zinc-200 file:text-zinc-700 hover:file:bg-zinc-300"
                  />
                  {zipFile && (
                    <p className="mt-2 text-[11px] font-mono text-[#a5c9ca]">
                      已选中压缩包: {zipFile.name} ({(zipFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}

              {/* 模式 B 的窗口：多选图片文件 */}
              {uploadMode === 'images' && (
                <div className="bg-zinc-50 rounded-xl p-5 border border-dashed border-zinc-200">
                  <span className="block text-zinc-500 mb-2 font-mono">
                    选择多张页面图片 (按住 Ctrl / Cmd 键批量全选 1~66 页)：
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                    className="w-full text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-mono file:bg-zinc-200 file:text-zinc-700 hover:file:bg-zinc-300"
                  />
                  {imageFiles.length > 0 && (
                    <p className="mt-2 text-[11px] font-mono text-[#a5c9ca]">
                      已选中 {imageFiles.length} 张图片页面，提交时将在浏览器端自动压缩打包为 ZIP。
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 提交按钮 & 状态显示 */}
            <div className="pt-6">
              {submitting && (
                <div className="mb-4 text-center font-mono text-xs text-[#a5c9ca] animate-pulse">
                  {statusText || '正在处理中...'}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-[#a5c9ca] hover:bg-[#94b8b9] text-white font-mono rounded-xl shadow-md disabled:opacity-50 transition"
              >
                {submitting ? '提交并处理中...' : '确认发布刊物'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </Layout>
  );
}