import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('获取帖子失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 分类筛选
  const filteredPosts = category === 'ALL'
    ? posts
    : posts.filter(p => p.category === category);

  const categories = [
    { key: 'ALL', name: '全部话题' },
    { key: 'ABSTRACT', name: '🤪 抽象/二创' }, // 🆕 国内鹿友热衷的抽象二创分类
    { key: 'ANALYSIS', name: '📖 歌词/剧情考察' },
    { key: 'MUSIC', name: '🎵 音乐/编曲讨论' },
    { key: 'PILGRIMAGE', name: '巡礼/圣地交流' },
    { key: 'CHAT', name: '☕ 闲聊茶室' },
  ];

  const getCategoryBadge = (catKey) => {
    const catMap = {
      ABSTRACT: { label: '🤪 抽象/二创', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
      ANALYSIS: { label: '📖 考察', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      MUSIC: { label: '🎵 音乐', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
      PILGRIMAGE: { label: '🗺️ 圣地', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
      CHAT: { label: '☕ 闲聊', bg: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
    };
    const target = catMap[catKey] || { label: '💬 讨论', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${target.bg}`}>
        {target.label}
      </span>
    );
  };

  return (
    <Layout>
      <Head>
        <title>鹿友论坛 | Yorushika FanSite</title>
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* 页头 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-zinc-100 pb-6">
          <div>
            <h1 className="text-2xl font-serif text-zinc-900 tracking-wide">鹿友讨论区</h1>
            <p className="text-xs font-mono text-zinc-400 mt-1">分享音乐考察、圣地巡礼、二创梗图与即兴交流</p>
          </div>
          <Link
            href="/forum/post"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-xl text-xs font-mono shadow-sm transition-all"
          >
            ✏️ 发布新话题
          </Link>
        </div>

        {/* 分类 Filter 栏 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition-all border ${
                category === cat.key
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 帖子列表 */}
        {loading ? (
          <div className="py-20 text-center font-mono text-xs text-zinc-400 animate-pulse">
            Loading posts...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-xs font-mono text-zinc-400">该分类下暂无帖子，快来抢沙发吧～</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/forum/${post.id}`}
                className="block bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="text-base font-serif text-zinc-800 group-hover:text-[#88abac] transition-colors line-clamp-1">
                    {post.title}
                  </h2>
                  {getCategoryBadge(post.category)}
                </div>

                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-4 font-sans">
                  {post.content}
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-zinc-50 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600">👤 {post.author || '匿名鹿友'}</span>
                    <span>•</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    {/* 🎥 视频标识标记 */}
                    {post.video_url && (
                      <span className="ml-2 text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
                        🎬 包含视频
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span>💙 {post.likes || 0} 印章</span>
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