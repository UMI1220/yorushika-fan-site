import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('latest'); // 'latest' | 'hottest'
  const [stampedIds, setStampedIds] = useState({});

  useEffect(() => {
    fetchPosts();
  }, [sortBy]);

  // 获取帖子列表
  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase.from('forum_posts').select('*');

      if (sortBy === 'hottest') {
        query = query.order('likes', { ascending: false });
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

  // 💙 盖章支持（只加不减）
  const handleStamp = async (e, post) => {
    e.preventDefault();
    e.stopPropagation();

    if (stampedIds[post.id]) return;

    try {
      const newLikes = (post.likes || 0) + 1;
      setStampedIds((prev) => ({ ...prev, [post.id]: true }));
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, likes: newLikes } : p))
      );

      await supabase.from('forum_posts').update({ likes: newLikes }).eq('id', post.id);
    } catch (err) {
      console.error('盖章失败:', err);
    }
  };

  // 🗑️ 管理员密码删除
  const handleDeletePost = async (e, postId) => {
    e.preventDefault();
    e.stopPropagation();

    const inputPassword = prompt('请输入管理员密码确认删除该帖子：');
    if (!inputPassword) return;

    try {
      const res = await fetch(`/api/delete?table=forum_posts&id=${postId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': inputPassword,
        },
      });
      const result = await res.json();

      if (result.success) {
        alert('帖子已删除');
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        alert(`删除失败: ${result.error || '密码错误'}`);
      }
    } catch (err) {
      console.error('删除帖子失败:', err);
    }
  };

  // 丰富分类列表 (复原图 5)
  const categories = [
    { key: 'ALL', label: '全部话题', icon: '' },
    { key: 'MEMBER', label: '抽象/二创', icon: '🤪' },
    { key: 'ANALYSIS', label: '歌词/剧情考察', icon: '📖' },
    { key: 'MUSIC', label: '音乐/编曲讨论', icon: '🎵' },
    { key: 'PILGRIMAGE', label: '巡礼/圣地交流', icon: '🗺️' },
    { key: 'CHAT', label: '闲聊茶室', icon: '☕' },
  ];

  const filteredPosts = activeCategory === 'ALL'
    ? posts
    : posts.filter((p) => p.category === activeCategory);

  return (
    <Layout>
      <Head>
        <title>鹿友交流论坛 | ヨルシカ FanSite</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* 页头区 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-6">
            <div>
              <h1 className="text-3xl font-serif text-zinc-800 tracking-wider mb-1">
                鹿友交流论坛
              </h1>
              <p className="text-xs font-serif text-zinc-400 italic">
                讨论、考察与二次创作社区
              </p>
            </div>

            {/* 恢复跳转独立发帖页 /forum/post */}
            <Link
              href="/forum/post"
              className="px-6 py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-full text-xs font-medium tracking-widest shadow-sm transition flex items-center gap-2"
            >
              <span>✏️</span>
              <span>发布新帖</span>
            </Link>
          </div>

          {/* 筛选与排序 Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            {/* 分类 Tags */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                    activeCategory === cat.key
                      ? 'bg-[#88abac] text-white shadow-sm'
                      : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200/60'
                  }`}
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* 最新 / 最热 切换 (对应图 5 右侧) */}
            <div className="flex rounded-xl bg-zinc-100 p-1 text-xs font-mono shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setSortBy('latest')}
                className={`px-3 py-1 rounded-lg transition ${
                  sortBy === 'latest' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-500'
                }`}
              >
                ⏱️ 最新
              </button>
              <button
                onClick={() => setSortBy('hottest')}
                className={`px-3 py-1 rounded-lg transition ${
                  sortBy === 'hottest' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-500'
                }`}
              >
                🔥 最热
              </button>
            </div>
          </div>

          {/* 帖子瀑布流 / 双列网格卡片 (恢复图 5 的优雅卡片) */}
          {loading ? (
            <div className="text-center py-24 text-xs font-mono text-zinc-400">
              加载交流帖中...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-zinc-100 text-xs text-zinc-400 font-serif">
              暂无讨论话题，快去发起一个吧~
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-3xl border border-zinc-100 hover:border-zinc-300 transition-all shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between group"
                >
                  <Link href={`/forum/${post.id}`} className="block p-6 space-y-4">
                    {/* 帖子封面图（若有图片） */}
                    {post.image_url && (
                      <div className="w-full h-48 rounded-2xl overflow-hidden bg-zinc-100 mb-2">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <h2 className="text-base font-serif font-medium text-zinc-800 group-hover:text-[#88abac] transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        <span className="text-[10px] font-mono bg-[#88abac]/10 text-[#88abac] px-2.5 py-0.5 rounded-full shrink-0">
                          {categories.find((c) => c.key === post.category)?.label || post.category || '讨论'}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed font-sans">
                        {post.content}
                      </p>
                    </div>
                  </Link>

                  {/* 底部信息栏 */}
                  <div className="px-6 pb-5 pt-3 border-t border-zinc-50 flex items-center justify-between text-xs text-zinc-400 font-mono">
                    <div className="flex items-center gap-3">
                      <span>👤 {post.author || '匿名鹿友'}</span>
                      <span>👁️ {post.views || 0}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleStamp(e, post)}
                        disabled={stampedIds[post.id]}
                        className={`px-3 py-1 rounded-xl text-xs transition ${
                          stampedIds[post.id]
                            ? 'bg-rose-50 text-rose-500'
                            : 'bg-zinc-100 hover:bg-[#88abac] hover:text-white text-zinc-600'
                        }`}
                      >
                        {stampedIds[post.id] ? '💖 已盖章' : `💙 印章 (${post.likes || 0})`}
                      </button>

                      <button
                        onClick={(e) => handleDeletePost(e, post.id)}
                        className="text-zinc-300 hover:text-rose-500 p-1 transition"
                        title="删除帖子"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}