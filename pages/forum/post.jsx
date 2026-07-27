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
  const [category, setCategory] = useState('CHAT');
  const [content, setContent] = useState('');
  
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
      setErrorMsg('请填写帖子标题与正文内容');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      let imageUrl = null;

      // 1. 如果选择了图片，上传到独立的 'forum' 存储桶
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const fileName = `forum-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from('forum') // 使用独立的 forum 存储桶
          .upload(fileName, imageFile, { upsert: true });

        if (uploadErr) throw new Error(`图片上传失败: ${uploadErr.message}`);

        const { data: publicData } = supabase.storage
          .from('forum')
          .getPublicUrl(fileName);

        imageUrl = publicData.publicUrl;
      }

      // 2. 写入 public.forum_posts 数据表
      const { error } = await supabase
        .from('forum_posts')
        .insert([
          {
            title: title.trim(),
            author: author.trim() || '匿名鹿友',
            category,
            content: content.trim(),
            image_url: imageUrl,
            likes: 0,
          },
        ]);

      if (error) throw error;

      // 跳转回论坛列表
      router.push('/forum');
    } catch (err) {
      console.error('发布失败:', err);
      setErrorMsg(err.message || '发布失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>发起讨论 | FORUM | ヨルシカ FanSite</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-2xl mx-auto">
          
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/forum"
              className="text-xs tracking-widest text-[#88abac] hover:underline flex items-center gap-1"
            >
              ← 返回社区列表
            </Link>
            <span className="text-xs text-zinc-400 font-serif">CREATE POST</span>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-zinc-100">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-serif text-zinc-800 tracking-widest mb-2">
                发起讨论 / NEW POST
              </h1>
              <p className="text-xs font-serif italic text-zinc-400 tracking-wider">
                「言葉の隙間に、あの夏の記憶を」
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs tracking-wide">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 标题 */}
              <div>
                <label className="block text-xs font-serif tracking-widest text-zinc-700 mb-2">
                  讨论主题 / 标题 *
                </label>
                <input
                  type="text"
                  placeholder="如：关于《花に風》MV 中的意象思考"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac] transition-colors"
                  required
                />
              </div>

              {/* 昵称与分类 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif tracking-widest text-zinc-700 mb-2">
                    昵称 / 签名
                  </label>
                  <input
                    type="text"
                    placeholder="默认：匿名鹿友"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif tracking-widest text-zinc-700 mb-2">
                    话题分类
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac] transition-colors bg-white"
                  >
                    <option value="CHAT">☕ 闲聊交流 / CHAT</option>
                    <option value="ANALYSIS">📖 歌词考察 / ANALYSIS</option>
                    <option value="MUSIC">🎵 音乐讨论 / MUSIC</option>
                    <option value="PILGRIMAGE">📷 圣地巡礼 / PILGRIMAGE</option>
                  </select>
                </div>
              </div>

              {/* 正文 */}
              <div>
                <label className="block text-xs font-serif tracking-widest text-zinc-700 mb-2">
                  正文内容 *
                </label>
                <textarea
                  rows={6}
                  placeholder="留下你想表达的感悟、推论或疑问..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac] transition-colors resize-none leading-relaxed"
                  required
                />
              </div>

              {/* 配图上传 (可选) */}
              <div>
                <label className="block text-xs font-serif tracking-widest text-zinc-700 mb-2">
                  插入配图 (可选)
                </label>
                
                <div className="border border-dashed border-zinc-200 rounded-xl p-4 text-center hover:border-[#88abac] transition-colors">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreview}
                        alt="预览"
                        className="max-h-48 mx-auto rounded-lg object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                        }}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        移除配图
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="forum-file-input"
                      />
                      <label
                        htmlFor="forum-file-input"
                        className="cursor-pointer inline-block px-4 py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-lg text-xs tracking-wider border border-zinc-200 transition-colors"
                      >
                        📷 选择上传一张照片
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* 提交 */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3.5 rounded-xl text-white text-xs tracking-widest transition-all font-medium ${
                  submitting
                    ? 'bg-zinc-300 cursor-not-allowed'
                    : 'bg-[#88abac] hover:bg-[#789b9c] shadow-sm hover:shadow-md'
                }`}
              >
                {submitting ? '讨论发布中...' : '发布话题 / SUBMIT'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </Layout>
  );
}