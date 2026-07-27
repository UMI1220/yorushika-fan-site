import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function GallerySubmitPage() {
  const router = useRouter();
  
  // 表单状态
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [category, setCategory] = useState('FANART');
  const [quote, setQuote] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 处理图片选择与本地预览
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

  // 提交画作
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !imageFile) {
      setErrorMsg('请填写作品标题并选择要上传的画作');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      // 1. 上传图片至 Supabase Storage ('magazines' 存储桶或 'gallery' 存储桶)
      const ext = imageFile.name.split('.').pop();
      const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('gallery') // 复用公用存储桶
        .upload(fileName, imageFile, { upsert: true });

      if (uploadErr) throw new Error(`图片上传失败: ${uploadErr.message}`);

      // 2. 获取图片公开链接
      const { data: publicData } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName);

      const imageUrl = publicData.publicUrl;

      // 3. 将元数据写入 public.gallery 数据表
      const { error: dbErr } = await supabase
        .from('gallery')
        .insert([
          {
            title: title.trim(),
            artist: artist.trim() || '匿名画师',
            category,
            image_url: imageUrl,
            quote: quote.trim() || null,
          },
        ]);

      if (dbErr) throw new Error(`保存失败: ${dbErr.message}`);

      // 提交成功，跳转回画廊首页
      router.push('/gallery');

    } catch (err) {
      console.error('投稿提交异常:', err);
      setErrorMsg(err.message || '投稿失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>画作投稿 | GALLERY | ヨルシカ FanSite</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-2xl mx-auto">
          
          {/* 返回按钮与标题 */}
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/gallery"
              className="text-xs tracking-widest text-[#88abac] hover:underline flex items-center gap-1"
            >
              ← 返回画廊
            </Link>
            <span className="text-xs text-zinc-400 font-serif">GALLERY SUBMIT</span>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-zinc-100">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-serif text-zinc-800 tracking-widest mb-2">
                画作投稿 / SUBMIT
              </h1>
              <p className="text-xs font-serif italic text-zinc-400 tracking-wider">
                「夏の色を、心に残る一瞬を、ここに留めて」
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs tracking-wide">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 作品标题 */}
              <div>
                <label className="block text-xs font-serif tracking-widest text-zinc-700 mb-2">
                  作品标题 *
                </label>
                <input
                  type="text"
                  placeholder="如：花に風 / 月光"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac] transition-colors"
                  required
                />
              </div>

              {/* 创作者 / 画师 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif tracking-widest text-zinc-700 mb-2">
                    创作者 / 画师
                  </label>
                  <input
                    type="text"
                    placeholder="默认：匿名画师"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac] transition-colors"
                  />
                </div>

                {/* 分类 */}
                <div>
                  <label className="block text-xs font-serif tracking-widest text-zinc-700 mb-2">
                    作品分类
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac] transition-colors bg-white"
                  >
                    <option value="FANART">同人同好 / FANART</option>
                    <option value="OFFICIAL">官方插画 / OFFICIAL</option>
                    <option value="ALBUM">专辑视觉 / ALBUM</option>
                  </select>
                </div>
              </div>

              {/* 搭配台词 / 诗句 */}
              <div>
                <label className="block text-xs font-serif tracking-widest text-zinc-700 mb-2">
                  搭配台词 / 诗句 (选填)
                </label>
                <textarea
                  rows={3}
                  placeholder="如：「花降る夜に君を想う。」"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac] transition-colors resize-none font-serif"
                />
              </div>

              {/* 图片上传区域 */}
              <div>
                <label className="block text-xs font-serif tracking-widest text-zinc-700 mb-2">
                  选择画作图片 * (JPG / PNG / WEBP)
                </label>
                
                <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-6 text-center hover:border-[#88abac] transition-colors">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="预览"
                        className="max-h-64 mx-auto rounded-xl object-contain shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                        }}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        重新选择图片
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="gallery-file-input"
                      />
                      <label
                        htmlFor="gallery-file-input"
                        className="cursor-pointer inline-block px-6 py-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-xl text-xs tracking-widest border border-zinc-200 transition-colors"
                      >
                        📁 点击选择作品图片
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3.5 rounded-xl text-white text-xs tracking-widest transition-all font-medium ${
                  submitting
                    ? 'bg-zinc-300 cursor-not-allowed'
                    : 'bg-[#88abac] hover:bg-[#789b9c] shadow-sm hover:shadow-md'
                }`}
              >
                {submitting ? '画作提交中...' : '提交画作 / SUBMIT'}
              </button>

            </form>
          </div>

        </div>
      </div>
    </Layout>
  );
}