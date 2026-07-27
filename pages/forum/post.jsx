import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function PostCreatePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('ABSTRACT'); // 默认给到抽象二创
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState(''); // 🆕 视频链接状态
  
  // 图片相关状态
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 选择图片处理
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('请选择有效的图片文件 (JPG / PNG / WEBP)');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setErrorMsg('请填写帖子标题与主要内容');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      let imageUrl = null;

      // 如果选了图片，先上传到 Supabase storage (gallery 或 forum 存储桶)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `forum-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('gallery')
          .upload(fileName, imageFile);

        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = supabase.storage
          .from('gallery')
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      // 写入数据库
      const { data, error } = await supabase.from('forum_posts').insert([
        {
          title,
          author: author.trim() || '匿名鹿友',
          category,
          content,
          image_url: imageUrl,
          video_url: videoUrl.trim() || null, // 🆕 保存视频链接
        },
      ]).select();

      if (error) throw error;

      router.push('/forum');
    } catch (err) {
      console.error('发帖失败:', err);
      setErrorMsg(err.message || '发布失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>发起讨论 | Yorushika FanSite</title>
      </Head>

      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* 返回按钮 */}
        <Link href="/forum" className="text-xs font-mono text-zinc-400 hover:text-zinc-700 transition">
          ← 返回讨论区
        </Link>

        <div className="bg-white rounded-2xl border border-zinc-100 p-6 sm:p-8 shadow-sm mt-4">
          <h1 className="text-xl font-serif text-zinc-900 mb-6">发起讨论话题</h1>

          {errorMsg && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-mono">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 标题 */}
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">话题标题 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：如何看待《花に亡霊》MV里的隐喻？ / 搞点抽象二创..."
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac]"
              />
            </div>

            {/* 昵称与分类 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1">你的昵称</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="默认：匿名鹿友"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1">选择分类</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] bg-white"
                >
                  <option value="ABSTRACT">🤪 抽象/二创</option>
                  <option value="ANALYSIS">📖 歌词/剧情考察</option>
                  <option value="MUSIC">🎵 音乐/编曲讨论</option>
                  <option value="PILGRIMAGE">🗺️ 巡礼/圣地交流</option>
                  <option value="CHAT">☕ 闲聊茶室</option>
                </select>
              </div>
            </div>

            {/* 🆕 视频分享链接 */}
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">
                🎬 分享视频链接 (可选，支持 B站 / YouTube / MP4 直链)
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.bilibili.com/video/BV... 或 https://youtu.be/..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-mono focus:outline-none focus:border-[#88abac]"
              />
              <p className="text-[10px] text-zinc-400 mt-1 font-mono">粘贴 Bilibili 视频链接即可直接在帖子内内嵌播放器</p>
            </div>

            {/* 正文 */}
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">讨论正文 *</label>
              <textarea
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享你的见解、想法或二创梗..."
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] resize-none"
              />
            </div>

            {/* 上传图片 */}
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">附加配图 (可选)</label>
              {imagePreview ? (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-zinc-200">
                  <img src={imagePreview} alt="预览" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(''); }}
                    className="absolute top-1 right-1 bg-zinc-900/80 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-mono file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer"
                />
              )}
            </div>

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#88abac] hover:bg-[#789b9c] text-white text-xs font-mono rounded-xl shadow-sm disabled:opacity-50 transition"
            >
              {submitting ? '发布中...' : '发布话题 🚀'}
            </button>
          </form>
        </div>

      </div>
    </Layout>
  );
}