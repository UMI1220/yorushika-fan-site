import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function PostCreatePage() {
  const router = useRouter();

  // 板块类型：'text_image' (图文) | 'video' (视频)
  const [postType, setPostType] = useState('text_image');

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('ABSTRACT');
  const [location, setLocation] = useState(''); // 🎯 新增：巡礼地点状态
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  // 🎯 1. 更改为多图/多封面选择状态
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 🎯 2. 处理多张图片选择与预览
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length < files.length) {
      setErrorMsg('部分非图片格式的文件已被自动忽略');
    } else {
      setErrorMsg('');
    }

    setImageFiles(validFiles);
    setImagePreviews(validFiles.map((file) => URL.createObjectURL(file)));
  };

  // 移除单张选中的图片
  const handleRemoveImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('帖子标题和正文内容不能为空');
      return;
    }

    if (postType === 'video' && !videoUrl.trim()) {
      setErrorMsg('请填写有效的视频播放链接');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      let uploadedImageUrls = [];

      // 🎯 3. 循环上传多张图片至 Supabase 'forum' 存储桶
      if (imageFiles.length > 0) {
        const { supabase } = await import('../../lib/supabase');

        const uploadPromises = imageFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const filePath = `forum/${fileName}`;

          const { error: uploadErr } = await supabase.storage
            .from('forum')
            .upload(filePath, file);

          if (uploadErr) {
            throw new Error('图片上传失败：' + uploadErr.message);
          }

          const { data: publicUrlData } = supabase.storage
            .from('forum')
            .getPublicUrl(filePath);

          return publicUrlData?.publicUrl || '';
        });

        uploadedImageUrls = await Promise.all(uploadPromises);
      }

      // 提交到后端 API（将多图用逗号分割）
      const res = await fetch('/api/forum/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          category,
          location_name: category === 'PILGRIMAGE' ? location.trim() : '',
          content,
          image_url: uploadedImageUrls.filter(Boolean).join(','),
          video_url: postType === 'video' ? videoUrl.trim() : '',
          delete_password: deletePassword,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || '发布失败');
      }

      router.push('/forum');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || '网络问题，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>发布新话题 | 鹿友交流论坛</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          <div className="flex items-center justify-between">
            <Link href="/forum" className="text-xs font-mono text-zinc-400 hover:text-zinc-700">
              ← 返回社区论坛
            </Link>
            <h1 className="text-xl font-serif text-zinc-800">发布新话题</h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
            
            {/* 1. 板块模式切换开关 */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-zinc-500">发布类型</label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-100 rounded-2xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setPostType('text_image')}
                  className={`py-2.5 rounded-xl transition ${
                    postType === 'text_image' ? 'bg-white text-zinc-800 shadow-sm font-bold' : 'text-zinc-500'
                  }`}
                >
                  📝 图文帖子
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('video')}
                  className={`py-2.5 rounded-xl transition ${
                    postType === 'video' ? 'bg-white text-zinc-800 shadow-sm font-bold' : 'text-zinc-500'
                  }`}
                >
                  🎬 视频分享
                </button>
              </div>
            </div>

            {/* 2. 基础信息：昵称 + 分类 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1">昵称 (选填)</label>
                <input
                  type="text"
                  placeholder="匿名鹿友"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs focus:outline-none focus:border-[#88abac]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1">话题分类</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs focus:outline-none focus:border-[#88abac]"
                >
                  <option value="COVER">🎤 翻唱/演奏</option>
                  <option value="ANNOUNCEMENT">📢 官方公告</option>
                  <option value="ABSTRACT">🤪 抽象/二创</option>
                  <option value="ANALYSIS">📖 歌词/剧情考察</option>
                  <option value="MUSIC">🎵 音乐/编曲讨论</option>
                  <option value="PILGRIMAGE">🗺️ 巡礼/圣地交流</option>
                  <option value="CHAT">☕ 闲聊茶室</option>
                </select>
              </div>
            </div>

            {/* 3. 动态展示巡礼地点输入框（仅分类选巡礼时出现） */}
            {category === 'PILGRIMAGE' && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-mono text-zinc-500 mb-1">
                  巡礼地点 / 圣地名称 (选填)
                </label>
                <input
                  type="text"
                  placeholder="例如：高知县桂滨 / 六本木 Hills..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs focus:outline-none focus:border-[#88abac]"
                />
              </div>
            )}

            {/* 4. 标题 */}
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">标题 *</label>
              <input
                type="text"
                required
                placeholder="请输入有吸引力的标题..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs focus:outline-none focus:border-[#88abac]"
              />
            </div>

            {/* 5. 视频链接输入框（仅视频模式显示） */}
            {postType === 'video' && (
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1">视频播放/嵌入链接 *</label>
                <input
                  type="url"
                  required={postType === 'video'}
                  placeholder="https://..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs focus:outline-none focus:border-[#88abac]"
                />
              </div>
            )}

            {/* 6. 图片上传 / 视频自定义封面上传（支持多图） */}
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">
                {postType === 'video' ? '视频封面图 (选填，不传则在首页显示“内含视频”标签)' : '帖子附图 (可多选)'}
              </label>

              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {imagePreviews.map((url, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-zinc-200">
                      <img src={url} alt={`预览 ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-black/70 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 🎯 加上 multiple 允许一次选择多图 */}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="block w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer"
              />
            </div>

            {/* 7. 正文 */}
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">正文内容 *</label>
              <textarea
                rows={6}
                required
                placeholder="分享你的想法..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl text-xs leading-relaxed focus:outline-none focus:border-[#88abac]"
              />
            </div>

            {/* 8. 管理/删除密码 */}
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1">删除密码 (用于日后修改或删除帖子)</label>
              <input
                type="password"
                placeholder="设置 4-8 位密码"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs focus:outline-none focus:border-[#88abac]"
              />
            </div>

            {errorMsg && <div className="text-xs text-rose-500 font-mono">{errorMsg}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#88abac] hover:bg-[#789b9c] text-white text-xs font-mono rounded-xl shadow-sm disabled:opacity-50 transition"
            >
              {submitting ? '发布中...' : '确认发布'}
            </button>
          </form>

        </div>
      </div>
    </Layout>
  );
}