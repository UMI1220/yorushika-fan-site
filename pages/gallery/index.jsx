import { toCDNUrl } from '../../lib/cdn';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(null);

  // 记录已被当前用户盖章的图片 ID（防重复盖章，只加不减）
  const [stampedIds, setStampedIds] = useState({});

  // 获取 Supabase 中的画廊数据
  useEffect(() => {
    fetchGalleryData();
  }, []);

  const fetchGalleryData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('获取画廊数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 👁️ 打开 Modal 并自动自增浏览量
  const handleOpenModal = async (item) => {
    setSelectedImg(item);

    try {
      const newViews = (item.views || 0) + 1;
      
      // 更新本地状态
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, views: newViews } : i))
      );
      setSelectedImg((prev) => (prev && prev.id === item.id ? { ...prev, views: newViews } : prev));

      // 数据库更新
      await supabase.from('gallery').update({ views: newViews }).eq('id', item.id);
    } catch (err) {
      console.error('更新浏览量失败:', err);
    }
  };

  // 💙 盖章点赞（严格只加不减，点击后判定已盖章并拦截）
  const handleStamp = async (e, item) => {
    e.stopPropagation();

    if (stampedIds[item.id]) return; // 已盖章则绝对不减少

    try {
      const newLikes = (Number(item.likes) || 0) + 1;

      // 1. 标记当前 item 已盖章
      setStampedIds((prev) => ({ ...prev, [item.id]: true }));

      // 2. 本地状态 +1
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, likes: newLikes } : i))
      );
      if (selectedImg && selectedImg.id === item.id) {
        setSelectedImg((prev) => ({ ...prev, likes: newLikes }));
      }

      // 3. 写入 Supabase 数据库并检查返回结果
      const { data, error } = await supabase
        .from('gallery')
        .update({ likes: newLikes })
        .eq('id', item.id)
        .select();

      if (error) {
        console.error('Supabase 点赞更新失败:', error.message);
      } else {
        console.log('点赞成功落盘:', data);
      }
    } catch (err) {
      console.error('盖章过程出错:', err);
    }
  };

  // 🗑️ 带密码验证的管理员删除功能
  const handleDelete = async (e, itemId) => {
    e.preventDefault();
    e.stopPropagation();

    const inputPassword = prompt('请输入删除密码 (发帖自设口令 或 管理员口令)确认删除该画作：');
    if (!inputPassword) return;

    try {
      const res = await fetch(`/api/delete?table=gallery&id=${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': inputPassword,
        },
      });
      const result = await res.json();

      if (result.success) {
        alert('删除成功');
        setItems((prev) => prev.filter((item) => item.id !== itemId));
        if (selectedImg && selectedImg.id === itemId) {
          setSelectedImg(null);
        }
      } else {
        alert(`删除失败: ${result.error || '密码错误'}`);
      }
    } catch (err) {
      console.error('删除请求失败:', err);
      alert('请求失败，请稍后重试');
    }
  };

  // 分类筛选逻辑
  const filteredItems = filter === 'ALL' 
    ? items 
    : items.filter(item => item.category === filter);

  const categories = [
    { key: 'ALL', name: '全部 / ALL' },
    { key: 'OFFICIAL', name: '官方插画 / OFFICIAL' },
    { key: 'ALBUM', name: '专辑视觉 / ALBUM' },
    { key: 'FANART', name: '同人同好 / FANART' },
  ];

  return (
    <Layout>
      <Head>
        <title>GALLERY | ヨルシカ FanSite</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* 页面标语与标题 + 投稿按钮 */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-serif text-zinc-800 tracking-widest mb-2">
                画廊 / GALLERY
              </h1>
              <p className="text-xs font-serif italic text-[#88abac] tracking-wider">
                「絵画の中に残された、あの夏の色彩」
              </p>
            </div>

            <Link
              href="/gallery/submit"
              className="px-6 py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-full text-xs tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <span>✏️</span>
              <span>投稿画作</span>
            </Link>
          </div>

          {/* 分类 Filter 标签栏 */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-10">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setFilter(cat.key)}
                className={`px-5 py-2 rounded-full text-xs tracking-widest transition-all duration-300 font-medium ${
                  filter === cat.key
                    ? 'bg-[#88abac] text-white shadow-sm scale-105'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 图片瀑布流展示区 */}
          {loading ? (
            <div className="text-center py-20 text-zinc-400 font-serif tracking-widest">
              色彩加载中...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 text-zinc-400 font-serif tracking-widest">
              暂无该分类下的作品
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenModal(item)}
                  className="break-inside-avoid bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group border border-zinc-100"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={toCDNUrl(item.image_url)}
                      alt={item.title}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-white text-xs tracking-widest px-4 py-2 border border-white/60 rounded-full backdrop-blur-sm">
                        点击放大 🔍
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-white">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-serif text-zinc-800 text-base font-medium tracking-wide">
                        {item.title}
                      </h3>

                      {/* 管理员删除按钮 */}
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        className="text-zinc-300 hover:text-rose-500 hover:bg-rose-50 p-1 rounded transition text-xs shrink-0"
                        title="管理员删除"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-2 text-xs text-zinc-400">
                      <div className="flex items-center gap-3">
                        <span>{item.artist}</span>
                        <span className="text-[10px] font-mono">👁️ {item.views || 0} 💙 {item.likes || 0}</span>
                      </div>
                      <span className="text-[#88abac] border border-[#88abac]/30 px-2 py-0.5 rounded text-[10px]">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* 大图 Lightbox 沉浸式弹窗 */}
      {selectedImg && (
        <div
          onClick={() => setSelectedImg(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setSelectedImg(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              ✕
            </button>

            {/* 图片展示区 */}
            <div className="md:w-2/3 bg-zinc-950 flex items-center justify-center p-2">
              <img
                src={toCDNUrl(selectedImg.image_url)}
                alt={selectedImg.title}
                className="max-h-[70vh] md:max-h-[85vh] w-auto object-contain"
              />
            </div>

            {/* 右侧作品详情信息 */}
            <div className="md:w-1/3 p-6 sm:p-8 flex flex-col justify-between bg-white overflow-y-auto">
              <div>
                <span className="inline-block text-xs text-[#88abac] border border-[#88abac]/40 px-2.5 py-1 rounded-full mb-4">
                  {selectedImg.category}
                </span>
                <h2 className="text-2xl font-serif text-zinc-800 tracking-wider mb-2">
                  {selectedImg.title}
                </h2>
                <p className="text-xs text-zinc-400 mb-6">
                  ARTIST / {selectedImg.artist}
                </p>

                {selectedImg.quote && (
                  <div className="border-l-2 border-[#88abac] pl-4 py-1 my-4">
                    <p className="font-serif italic text-sm text-zinc-600 tracking-wider leading-relaxed">
                      「{selectedImg.quote}」
                    </p>
                  </div>
                )}
              </div>

              {/* 底部数据与交互区域 */}
              <div className="pt-6 border-t border-zinc-100 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>👁️ {selectedImg.views || 0} 浏览 · 💙 {selectedImg.likes || 0} 印章</span>

                  {/* 盖章按钮（只加不减，点击后禁用） */}
                  <button
                    onClick={(e) => handleStamp(e, selectedImg)}
                    disabled={stampedIds[selectedImg.id]}
                    className={`px-3 py-1 rounded-full text-xs font-mono transition ${
                      stampedIds[selectedImg.id]
                        ? 'bg-rose-50 text-rose-500 border border-rose-200 cursor-default'
                        : 'bg-[#88abac] hover:bg-[#789b9c] text-white shadow-sm'
                    }`}
                  >
                    {stampedIds[selectedImg.id] ? '💖 已盖章' : '💙 盖章 (+1)'}
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <span>Yorushika Fan Gallery</span>
                  <a
                    href={selectedImg.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#88abac] hover:underline"
                  >
                    查看原图 ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}