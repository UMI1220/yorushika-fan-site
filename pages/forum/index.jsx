import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('latest'); // 'latest' | 'hot'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [sortBy]);

  // 从 Supabase 获取帖子列表
  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase.from('forum_posts').select('*');

      // 📊 排序逻辑
      if (sortBy === 'hot') {
        query = query.order('likes', { ascending: false }).order('views', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('获取帖子失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ 带有管理员密码验证的删帖函数
  const handleDeletePost = async (e, postId) => {
    e.preventDefault();
    e.stopPropagation();

    // 🔑 验证密码机制
    const inputPassword = prompt('请输入管理员删除密码：');
    if (!inputPassword) return; // 取消或未输入

    try {
      const res = await fetch(`/api/delete?table=forum_posts&id=${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': inputPassword, // 传递密码头部
        },
      });
      const result = await res.json();

      if (result.success) {
        alert('帖子已成功删除');
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        alert(`删除失败: ${result.error || '密码错误或无权限'}`);
      }
    } catch (err) {
      console.error('删除请求异常:', err);
      alert('请求失败，请稍后重试');
    }
  };

  // 根据分类过滤帖子
  const filteredPosts =
    category === 'ALL' ? posts : posts.filter((p) => p.category === category);

  const categories = [
    { key: 'ALL', name: '全部话题' },
    { key: 'ABSTRACT', name: '🤪 抽象/二创' },
    { key: 'ANALYSIS', name: '📖 歌词/考察' },
    { key: 'MUSIC', name: '🎵 音乐讨论' },
    { key: 'PILGRIMAGE', name: '🗺️ 巡礼交流' },
    { key: 'CHAT', name: '☕ 闲聊茶室' },
  ];

  const getCategoryBadge = (catKey) => {
    switch (catKey) {
      case 'ABSTRACT':
        return <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-full font-mono">🤪 抽象二创</span>;
      case 'ANALYSIS':
        return <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200/60 px-2 py-0.5 rounded-full font-mono">📖 歌词考察</span>;
      case 'MUSIC':
        return <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200/60 px-2 py-0.5 rounded-full font-mono">🎵 音乐讨论</span>;
      case 'PILGRIMAGE':
        return <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full font-mono">🗺️ 巡礼交流</span>;
      default:
        return <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-mono">☕ 闲聊</span>;
    }
  };

  return (
    <Layout>
      <Head>
        <title>鹿友论坛 - Yorushika FanSite</title>
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 顶部标题与发帖按钮 */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
          <div>
            <h1 className="text-xl font-serif text-zinc-800 font-medium">鹿友交流论坛</h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">讨论、考察与二次创作社区</p>
          </div>
          <Link
            href="/forum/post"
            className="px-4 py-2 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-xl text-xs font-mono transition shadow-sm"
          >
            ✏️ 发布新帖
          </Link>
        </div>

        {/* 🎨 分类选择与 📊 排序切换 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all shadow-sm ${
                  category === cat.key
                    ? 'bg-[#88abac] text-white font-medium shadow-[#88abac]/20 shadow-md'
                    : 'bg-zinc-100/80 text-zinc-500 hover:bg-zinc-200/70'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl self-start sm:self-auto text-xs font-mono">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-3 py-1 rounded-lg transition ${
                sortBy === 'latest' ? 'bg-white text-zinc-800 font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              🕒 最新
            </button>
            <button
              onClick={() => setSortBy('hot')}
              className={`px-3 py-1 rounded-lg transition ${
                sortBy === 'hot' ? 'bg-white text-rose-600 font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              🔥 最热
            </button>
          </div>
        </div>

        {/* 📱 帖子卡片双列/瀑布流布局 */}
        {loading ? (
          <div className="text-center py-20 text-xs font-mono text-zinc-400">加载论坛话题中...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-xs font-mono text-zinc-400">暂无相关话题</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/forum/${post.id}`}
                className="flex flex-col justify-between bg-white border border-zinc-100 hover:border-zinc-300 rounded-2xl overflow-hidden transition shadow-sm hover:shadow-md group relative"
              >
                <div>
                  {/* 图片直观大图预览 */}
                  {post.image_url && (
                    <div className="w-full h-44 overflow-hidden bg-zinc-100 border-b border-zinc-50 relative">
                      <img
                        src={post.image_url}
                        alt="预览图"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="text-sm font-serif font-medium text-zinc-800 group-hover:text-[#88abac] transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h2>
                      {getCategoryBadge(post.category)}
                    </div>

                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed font-sans mb-3">
                      {post.content}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 border-t border-zinc-50 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-zinc-600 truncate max-w-[90px]">👤 {post.author || '匿名鹿友'}</span>
                    {post.video_url && (
                      <span className="text-rose-500 bg-rose-50 px-1 py-0.2 rounded text-[9px] font-sans">
                        🎬 视频
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span>👁️ {post.views || 0}</span>
                    <span className="text-teal-600/90 font-medium">💙 {post.likes || 0}</span>

                    <button
                      onClick={(e) => handleDeletePost(e, post.id)}
                      className="text-zinc-300 hover:text-rose-500 hover:bg-rose-50 p-0.5 rounded transition text-xs ml-1"
                      title="管理员删除此帖"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}