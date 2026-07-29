import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState('ALL');

  // 防重复盖章状态
  const [stampedIds, setStampedIds] = useState({});

  // 快捷发帖 Modal 状态
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('CHAT');
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  // 拉取论坛帖子
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
      console.error('获取帖子列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 💙 帖子盖章点赞（只加不减）
  const handleStamp = async (e, post) => {
    e.preventDefault();
    e.stopPropagation();

    if (stampedIds[post.id]) return;

    try {
      const newLikes = (post.likes || 0) + 1;

      // 标记本地已盖章
      setStampedIds((prev) => ({ ...prev, [post.id]: true }));

      // 更新本地 state
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, likes: newLikes } : p))
      );

      // 同步数据库
      await supabase.from('forum_posts').update({ likes: newLikes }).eq('id', post.id);
    } catch (err) {
      console.error('盖章失败:', err);
    }
  };

  // 🗑️ 管理员删除帖子
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
        alert('帖子已成功删除');
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        alert(`删除失败: ${result.error || '密码错误'}`);
      }
    } catch (err) {
      console.error('删除帖子失败:', err);
      alert('网络请求失败');
    }
  };

  // 提交发帖
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('请填写标题与内容');
      return;
    }

    try {
      setSubmitting(true);
      const { data, error } = await supabase
        .from('forum_posts')
        .insert([
          {
            title: newTitle.trim(),
            content: newContent.trim(),
            author: newAuthor.trim() || '匿名鹿友',
            category: newCategory,
            likes: 0,
            views: 0,
          },
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setPosts((prev) => [data[0], ...prev]);
        setShowModal(false);
        setNewTitle('');
        setNewContent('');
        setNewAuthor('');
      }
    } catch (err) {
      console.error('发帖失败:', err);
      alert('发帖失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { key: 'ALL', name: '全部交流 / ALL' },
    { key: 'CHAT', name: '日常闲聊 / CHAT' },
    { key: 'ANALYSIS', name: '曲解考察 / ANALYSIS' },
    { key: 'EVENT', name: '线下巡演 / EVENT' },
  ];

  const filteredPosts = filterTag === 'ALL'
    ? posts
    : posts.filter((p) => p.category === filterTag);

  return (
    <Layout>
      <Head>
        <title>鹿友论坛 | ヨルシカ FanSite</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          
          {/* 页头 */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-serif text-zinc-800 tracking-widest mb-2">
                鹿友广场 / FORUM
              </h1>
              <p className="text-xs font-serif italic text-[#88abac] tracking-wider">
                「月光下的讨论与共鸣」
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-full text-xs tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 font-medium"
            >
              <span>✍️</span>
              <span>发布新帖</span>
            </button>
          </div>

          {/* 分类筛选 */}
          <div className="flex flex-wrap gap-2.5 mb-8">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setFilterTag(cat.key)}
                className={`px-4 py-2 rounded-full text-xs tracking-wider transition-all ${
                  filterTag === cat.key
                    ? 'bg-[#88abac] text-white shadow-sm'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* 帖子列表 */}
          {loading ? (
            <div className="text-center py-20 text-xs font-mono text-zinc-400">
              加载论坛交流中...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-zinc-100 text-xs text-zinc-400 font-serif">
              暂无该分类下的讨论
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-zinc-100 hover:border-zinc-300 transition-all shadow-sm hover:shadow-md relative group"
                >
                  <Link href={`/forum/${post.id}`} className="block">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h2 className="text-base sm:text-lg font-serif font-medium text-zinc-800 group-hover:text-[#88abac] transition-colors line-clamp-1">
                        {post.title}
                      </h2>
                      <span className="text-[10px] font-mono bg-zinc-100 text-zinc-500 px-2.5 py-0.5 rounded-full shrink-0">
                        {post.category || 'CHAT'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-4 font-sans">
                      {post.content}
                    </p>
                  </Link>

                  <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pt-3 border-t border-zinc-50">
                    <div className="flex items-center gap-4">
                      <span>👤 {post.author || '匿名鹿友'}</span>
                      <span>👁️ {post.views || 0}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* 盖章按钮 */}
                      <button
                        onClick={(e) => handleStamp(e, post)}
                        disabled={stampedIds[post.id]}
                        className={`px-2.5 py-1 rounded-lg text-xs transition ${
                          stampedIds[post.id]
                            ? 'bg-rose-50 text-rose-500 cursor-default'
                            : 'bg-zinc-100 hover:bg-[#88abac] hover:text-white text-zinc-600'
                        }`}
                      >
                        {stampedIds[post.id] ? '💖 已盖章' : `💙 印章 (${post.likes || 0})`}
                      </button>

                      {/* 删除按钮 */}
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

      {/* 发帖 Modal 弹窗 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="text-lg font-serif text-zinc-800 font-medium">发布新论题</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-serif text-zinc-700 mb-1.5">标题 *</label>
                <input
                  type="text"
                  placeholder="请输入交流标题..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-serif text-zinc-700 mb-1.5">分类</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] bg-white"
                  >
                    <option value="CHAT">日常闲聊</option>
                    <option value="ANALYSIS">曲解考察</option>
                    <option value="EVENT">线下巡演</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-serif text-zinc-700 mb-1.5">发布者昵称</label>
                  <input
                    type="text"
                    placeholder="默认：匿名鹿友"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif text-zinc-700 mb-1.5">详细讨论内容 *</label>
                <textarea
                  rows={5}
                  placeholder="写下你的想法与解读..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-xl text-xs font-medium tracking-widest shadow-sm transition-all"
              >
                {submitting ? '发布中...' : '确认发布 / POST'}
              </button>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
}