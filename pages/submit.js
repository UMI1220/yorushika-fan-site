import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAudio } from '../components/Layout';

export default function SubmitPage() {
  const router = useRouter();
  const { query } = router;
  const { themeColor, theme } = useAudio();

  // 1. 表单状态
  const [resourceType, setResourceType] = useState('music'); // 'music' | 'covers' | 'lyrics'
  const [contributorEmail, setContributorEmail] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [trackTitle, setTrackTitle] = useState('');
  const [albums, setAlbums] = useState([]);

  // 2. 文件上传状态
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 拖拽控制
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // 初始化从 URL 填充参数，并拉取专辑列表
  useEffect(() => {
    if (query.albumId) setAlbumId(query.albumId);
    if (query.trackTitle) setTrackTitle(decodeURIComponent(query.trackTitle));

    async function loadAlbums() {
      try {
        const res = await fetch('/api/albums');
        const data = await res.json();
        if (data.success && data.albums) {
          setAlbums(data.albums);
        }
      } catch (err) {
        console.error('获取专辑列表失败:', err);
      }
    }
    loadAlbums();
  }, [query]);

  // 处理文件读取与 Base64 转换 (自动推导类型)
  const handleFileSelect = (file) => {
    if (!file) return;

    // 根据扩展名自动切换 folder 目录
    const ext = file.name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      setResourceType('covers');
    } else if (ext === 'lrc') {
      setResourceType('lyrics');
    } else if (['mp3', 'flac', 'wav', 'm4a'].includes(ext)) {
      setResourceType('music');
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileBase64(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // 拖拽放置
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // 提交到 /api/upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedFile || !fileBase64) {
      setErrorMessage('请先选择或拖拽需要上传的文件');
      return;
    }
    if (!contributorEmail.trim()) {
      setErrorMessage('请输入贡献者 Email（用于 GitHub Commit 签名）');
      return;
    }

    setIsUploading(true);

    try {
      const payload = {
        fileName: selectedFile.name,
        fileBase64: fileBase64,
        folder: resourceType, // 'music' | 'covers' | 'lyrics'
        albumId: albumId || 1,
        trackTitle: trackTitle || selectedFile.name.replace(/\.[^/.]+$/, ''),
        contributorEmail: contributorEmail.trim(),
      };

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setUploadSuccess(true);
      } else {
        throw new Error(data.error || '上传失败，请检查网络或配置');
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-10 px-4 max-w-2xl mx-auto font-mono text-xs">
      
      {/* 页头导航 */}
      <div className="flex justify-between items-center mb-8 border-b border-current/10 pb-4">
        <Link href="/music" className="opacity-70 hover:opacity-100 transition-opacity">
          [ &lt; RETURN TO MUSIC ]
        </Link>
        <span className="opacity-50 text-[10px]">[ ARCHIVE CONTRIBUTION ]</span>
      </div>

      {/* 主卡片 */}
      <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-current/10 p-6 sm:p-8 space-y-6 shadow-xl">
        
        {/* 文学标题 */}
        <div>
          <h1 className="font-serif font-bold text-base tracking-widest mb-1">盗作たちの補完計画</h1>
          <p className="font-serif opacity-60 text-[11px]">
            贡献音源 (.mp3/.flac)、专辑封面 (.jpg/.png) 或 LRC 动态滚动歌词 (.lrc)。
          </p>
        </div>

        {uploadSuccess ? (
          /* 上传成功提示 */
          <div
            style={{ backgroundColor: themeColor }}
            className="p-6 text-zinc-950 space-y-4 animate-in fade-in duration-300"
          >
            <p className="font-bold text-sm">[ UPLOAD SUCCESSFUL / 提交成功 ]</p>
            <p className="font-serif text-xs leading-relaxed opacity-90">
              资源已提交至 GitHub 资源仓库，并同步写入 Cloudflare D1 数据库。感谢对夜鹿同人站的补充！
            </p>
            <div className="pt-2 flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  setUploadSuccess(false);
                  setSelectedFile(null);
                  setFileBase64('');
                }}
                className="underline font-bold"
              >
                [ SUBMIT ANOTHER ]
              </button>
              <Link href="/music" className="underline font-bold">
                [ BACK TO PLAYER &gt; ]
              </Link>
            </div>
          </div>
        ) : (
          /* 表单容器 */
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* 1. 资源类型切换按键 */}
            <div className="space-y-1">
              <label className="block opacity-60 text-[10px]">[ RESOURCE TYPE / 资源类型 ]</label>
              <div className="flex space-x-3 pt-1">
                <button
                  type="button"
                  onClick={() => setResourceType('music')}
                  className={`px-3 py-1.5 border transition-all ${
                    resourceType === 'music'
                      ? 'border-current font-bold bg-current/10'
                      : 'border-current/20 opacity-60'
                  }`}
                >
                  MUSIC (.mp3/.flac)
                </button>
                <button
                  type="button"
                  onClick={() => setResourceType('covers')}
                  className={`px-3 py-1.5 border transition-all ${
                    resourceType === 'covers'
                      ? 'border-current font-bold bg-current/10'
                      : 'border-current/20 opacity-60'
                  }`}
                >
                  COVER (.jpg/.png)
                </button>
                <button
                  type="button"
                  onClick={() => setResourceType('lyrics')}
                  className={`px-3 py-1.5 border transition-all ${
                    resourceType === 'lyrics'
                      ? 'border-current font-bold bg-current/10'
                      : 'border-current/20 opacity-60'
                  }`}
                >
                  LYRICS (.lrc)
                </button>
              </div>
            </div>

            {/* 2. 关联专辑与曲目名 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block opacity-60 text-[10px]">[ ALBUM / 关联专辑 ]</label>
                <select
                  value={albumId}
                  onChange={(e) => setAlbumId(e.target.value)}
                  className="w-full bg-transparent border-b border-current/20 py-1.5 outline-none font-mono text-xs"
                >
                  <option value="" className="dark:bg-zinc-900">-- SELECT ALBUM --</option>
                  {albums.map((a) => (
                    <option key={a.id} value={a.id} className="dark:bg-zinc-900">
                      {a.id}. {a.title || a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block opacity-60 text-[10px]">[ TRACK TITLE / 曲目名称 ]</label>
                <input
                  type="text"
                  placeholder="e.g. 言の葉"
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  className="w-full bg-transparent border-b border-current/20 py-1 outline-none text-xs"
                />
              </div>
            </div>

            {/* 3. 贡献者 Email */}
            <div className="space-y-1">
              <label className="block opacity-60 text-[10px]">[ CONTRIBUTOR EMAIL * / 贡献者邮箱 ]</label>
              <input
                type="email"
                placeholder="your-email@domain.com"
                value={contributorEmail}
                onChange={(e) => setContributorEmail(e.target.value)}
                className="w-full bg-transparent border-b border-current/20 py-1 outline-none text-xs"
                required
              />
            </div>

            {/* 4. 文件拖拽/点击选择区域 */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed p-8 text-center cursor-pointer transition-colors ${
                isDragOver ? 'border-current bg-current/10' : 'border-current/30 hover:border-current/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  resourceType === 'covers'
                    ? 'image/*'
                    : resourceType === 'lyrics'
                    ? '.lrc,.txt'
                    : 'audio/*'
                }
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="font-bold underline">{selectedFile.name}</p>
                  <p className="text-[10px] opacity-60">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Folder: [{resourceType}]
                  </p>
                </div>
              ) : (
                <div className="space-y-2 opacity-70">
                  <p>[ DRAG & DROP FILE HERE, OR CLICK TO CHOOSE ]</p>
                  <p className="text-[10px] opacity-50">
                    SUPPORT: .MP3, .FLAC, .JPG, .PNG, .LRC
                  </p>
                </div>
              )}
            </div>

            {/* 错误提示 */}
            {errorMessage && (
              <p className="text-red-500 text-[11px] font-bold">[ ERROR: {errorMessage} ]</p>
            )}

            {/* 提交按键 */}
            <button
              type="submit"
              disabled={isUploading}
              style={{ backgroundColor: themeColor }}
              className="w-full py-3 text-zinc-950 font-bold text-xs tracking-widest shadow-md hover:opacity-90 transition-opacity"
            >
              {isUploading ? '[ UPLOADING TO GITHUB... ]' : '[ SUBMIT TO ARCHIVE ]'}
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
