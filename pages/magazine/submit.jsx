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
      alert('请选择需要上传的 ZIP 格式电子刊物');
      return;
    }
    if (uploadMode === 'images' && imageFiles.length === 0) {
      alert('请至少选择一张图片页面');
      return;
    }

    try {
      setSubmitting(true);

      // 1. 上传封面图
      setStatusText('正在上传刊物封面...');
      const coverFormData = new FormData();
      coverFormData.append('file', coverFile);
      coverFormData.append('bucket', 'magazines'); // ✅ 明确传递存储桶为 magazines

      const coverRes = await fetch('/api/upload', {
        method: 'POST',
        body: coverFormData,
      });
      const coverData = await coverRes.json();
      if (!coverRes.ok || !coverData.url) {
        throw new Error(coverData.error || '封面上传失败');
      }
      const coverUrl = coverData.url;

      // 2. 处理并上传 ZIP 文件
      let finalZipFile = zipFile;
      if (uploadMode === 'images') {
        setStatusText('正在将多张图片在本地打为 ZIP 压缩包...');
        const zip = new JSZip();
        imageFiles.forEach((file, index) => {
          const ext = file.name.split('.').pop();
          const paddedIndex = String(index + 1).padStart(3, '0');
          zip.file(`page_${paddedIndex}.${ext}`, file);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        finalZipFile = new File([zipBlob], `${title.trim()}_compressed.zip`, {
          type: 'application/zip',
        });
      }

      setStatusText('正在上传刊物资源 ZIP 包 (这可能需要一些时间)...');
      const zipFormData = new FormData();
      zipFormData.append('file', finalZipFile);
      zipFormData.append('bucket', 'magazines'); // ✅ 明确传递存储桶为 magazines

      const zipRes = await fetch('/api/upload', {
        method: 'POST',
        body: zipFormData,
      });
      const zipData = await zipRes.json();
      if (!zipRes.ok || !zipData.url) {
        throw new Error(zipData.error || 'ZIP 文件上传失败');
      }
      const zipUrl = zipData.url;

      // 3. 将元数据存入数据库
      setStatusText('正在保存刊物数据到数据库...');
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim() || 'Yorushika Fan Club',
          description: description.trim(),
          cover_url: coverUrl,
          zip_url: zipUrl,
          category: 'echo',
          issue_number: 'Vol.1',
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || '刊物元数据保存失败');
      }

      alert('恭喜，刊物成功发布！');
      router.push('/magazine');
    } catch (err) {
      console.error('Submit error:', err);
      alert(`上传失败：${err.message}`);
    } finally {
      setSubmitting(false);
      setStatusText('');
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        
        {/* 顶部页头 */}
        <div className="mb-10 text-center">
          <h1 className="text-xl sm:text-2xl font-serif text-zinc-900 tracking-widest mb-2">
            发布新的电子刊物
          </h1>
          <p className="text-xs font-mono text-zinc-400">
            SUBMIT NEW ECHO / MAGAZINE
          </p>
        </div>

        {/* 提交表单区域 */}
        <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-10 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
          
          {/* 刊物标题 */}
          <div>
            <label className="block text-xs font-mono text-zinc-600 mb-2">
              刊物名称 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：Echo 第一期 - 「夏草が邪魔をする」"
              required
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-[#a5c9ca] transition"
            />
          </div>

          {/* 作者/编辑组 */}
          <div>
            <label className="block text-xs font-mono text-zinc-600 mb-2">
              作者 / 编辑组
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="默认：Yorushika Fan Club"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-[#a5c9ca] transition"
            />
          </div>

          {/* 刊物简介 */}
          <div>
            <label className="block text-xs font-mono text-zinc-600 mb-2">
              刊物简介 / 描述
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要介绍本期同人刊物的内容与主题..."
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-[#a5c9ca] resize-none transition"
            />
          </div>

          {/* 封面上传 */}
          <div>
            <label className="block text-xs font-mono text-zinc-600 mb-2">
              刊物封面图片 *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              required
              className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-mono file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 transition"
            />
          </div>

          {/* 上传模式切换 */}
          <div className="pt-4 border-t border-zinc-100">
            <label className="block text-xs font-mono text-zinc-600 mb-3">
              刊物内容上传形式 *
            </label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                type="button"
                onClick={() => setUploadMode('zip')}
                className={`py-2.5 rounded-xl text-xs font-mono transition border ${
                  uploadMode === 'zip'
                    ? 'bg-[#a5c9ca]/10 border-[#a5c9ca] text-teal-800 font-medium'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                }`}
              >
                直接上传 ZIP 压缩包
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('images')}
                className={`py-2.5 rounded-xl text-xs font-mono transition border ${
                  uploadMode === 'images'
                    ? 'bg-[#a5c9ca]/10 border-[#a5c9ca] text-teal-800 font-medium'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                }`}
              >
                上传多张图片 (自动打包)
              </button>
            </div>

            {/* 根据模式展示不同的文件输入 */}
            {uploadMode === 'zip' ? (
              <div className="bg-zinc-50 p-4 rounded-xl border border-dashed border-zinc-200">
                <span className="text-[11px] font-mono text-zinc-400 block mb-2">
                  选择打包好包含全部页面图片的 .zip 文件
                </span>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-mono file:bg-zinc-200 file:text-zinc-700 hover:file:bg-zinc-300 transition"
                />
              </div>
            ) : (
              <div className="bg-zinc-50 p-4 rounded-xl border border-dashed border-zinc-200">
                <span className="text-[11px] font-mono text-zinc-400 block mb-2">
                  按阅读顺序批量选中并上传所有单张图片
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                  className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-mono file:bg-zinc-200 file:text-zinc-700 hover:file:bg-zinc-300 transition"
                />
                {imageFiles.length > 0 && (
                  <p className="mt-2 text-[11px] font-mono text-[#a5c9ca]">
                    已选中 {imageFiles.length} 张图片页面，提交时将在浏览器端自动压缩打包为 ZIP。
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 提交按钮 & 状态提示 */}
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
              {submitting ? '正在发布中...' : '确认发布刊物'}
            </button>
          </div>

        </form>

      </div>
    </Layout>
  );
}