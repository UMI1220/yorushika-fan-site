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
    { key: 'ANALYSIS', name: '📖 歌词/剧情考察' },
    { key: 'MUSIC', name: '🎵 音乐/编曲讨论' },
    { key: 'PILGRIMAGE', name: '📷 圣地巡礼' },
    { key: 'CHAT', name: '☕ 闲聊交流' },
  ];

  // 分类 Tag 样式映射
  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'ANALYSIS': return <span className="bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded text-[11px]">考察</span>;
      case 'MUSIC': return <span className="bg-sky-50 text-sky-700 border border-sky-200/60 px-2 py-0.5 rounded text-[11px]">音乐</span>;
      case 'PILGRIMAGE': return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded text-[11px]">巡礼</span>;
      default: return <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded text-[11px]">闲聊</span>;
    }
  };

  return (
    <Layout>
      <Head>
        <title>FORUM 社区论坛 | ヨルシカ FanSite</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          
          {/* 页面头部标语与发帖入口 */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-serif text-zinc-800 tracking-widest mb-2">
                社区论坛 / FORUM
              </h1>
              <p className="text-xs font-serif italic text-[#88abac] tracking-wider">
                「言葉の隙間に、あの夏の記憶を」
              </p>
            </div>

            <Link
              href="/forum/post"
              className="px-6 py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-full text-xs tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <span>✍️</span>
              <span>发起讨论</span>
            </Link>
          </div>

          {/* 分类筛选 Tab */}
          <div className="flex flex-wrap gap-2.5 mb-8 border-b border-zinc-200/60 pb-4">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`px-4 py-1.5 rounded-full text-xs tracking-wider transition-all ${
                  category === c.key
                    ? 'bg-[#88abac] text-white shadow-sm font-medium'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* 帖子列表展示 */}
          {loading ? (
            <div className="text-center py-20 text-zinc-400 font-serif tracking-widest">
              读取讨论中...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-zinc-400 font-serif border border-zinc-100 shadow-sm">
              暂无相关讨论话题，来发布第一条吧！
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/forum/${post.id}`}
                  className="block bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h2 className="text-base sm:text-lg font-serif text-zinc-800 group-hover:text-[#88abac] transition-colors line-clamp-1">
                      {post.title}
                    </h2>
                    {getCategoryBadge(post.category)}
                  </div>

                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-4 font-sans">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-50 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-zinc-600">👤 {post.author}</span>
                      <span>•</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
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
      </div>
    </Layout>
  );
}