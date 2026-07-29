import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function PostDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🐛 防重复盖章：并发锁控制
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  // 评论表单
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPostAndComments();
    }
  }, [id]);

  const fetchPostAndComments = async () => {
    try {
      setLoading(true);

      const { data: postData, error: postErr } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (postErr) throw postErr;
      setPost(postData);

      // 👁️ 浏览量自增
      const currentViews = (postData.views || 0) + 1;
      await supabase.from('forum_posts').update({ views: currentViews }).eq('id', id);
      setPost((prev) => ({ ...prev, views: currentViews }));

      // 获取评论
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      setComments(commentsData || []);
    } catch (err) {
      console.error('获取详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 盖章逻辑 (带有 liking 并发锁)
  const handleToggleLike = async () => {
    if (!post || liking) return;

    try {
      setLiking(true);
      const isLiking = !liked;
      const newLikes = isLiking ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 1) - 1);

      setLiked(isLiking);
      setPost((prev) => ({ ...prev, likes: newLikes }));

      await supabase.from('forum_posts').update({ likes: newLikes }).eq('id', id);
    } catch (err) {
      console.error('盖章失败:', err);
      setLiked(!liked);
    } finally {
      setLiking(false);
    }
  };

  // 🔑 带密码验证的主帖删除
  const handleDeletePost = async () => {
    const inputPassword = prompt('请输入管理员密码确认删除：');
    if (!inputPassword) return;

    try {
      const res = await fetch(`/api/delete?table=forum_posts&id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': inputPassword,
        },
      });
      const result = await res.json();

      if (result.success) {
        alert('帖子已彻底删除');
        router.push('/forum');
      } else {
        alert(`删除失败: ${result.error || '密码不正确'}`);
      }
    } catch (err) {
      console.error('删除异常:', err);
    }
  };

  // 🔑 评论删除：主贴作者可直接删除，或输入管理员密码删除
  const handleDeleteComment = async (commentId) => {
    const inputPassword = prompt('请确认删除该评论（若是管理员请输入密码，普通删除请留空直接确定）：', '');
    
    // 如果点了“取消”
    if (inputPassword === null) return;

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (inputPassword.trim() !== '') {
        headers['x-admin-password'] = inputPassword.trim();
      }

      const res = await fetch(`/api/delete?table=comments&id=${commentId}`, {
        method: 'DELETE',
        headers,
      });
      const result = await res.json();

      if (result.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        alert(`删除失败: ${result.error}`);
      }
    } catch (err) {
      console.error('删除评论异常:', err);
    }
  };

  // 提交评论
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      setSubmittingComment(true);
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: id,
            author: commentAuthor.trim() || '匿名鹿友',
            content: commentContent.trim(),
          },
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setComments((prev) => [...prev, data[0]]);
        setCommentContent('');
      }
    } catch (err) {
      alert(`发表评论失败: ${err.message}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  // 视频播放组件
  const renderVideoPlayer = (url) => {
    if (!url) return null;
    const bvidMatch = url.match(/BV[a-zA-Z0-9]+/i);
    if (bvidMatch) {
      return (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-200 my-4 shadow-sm">
          <iframe
            src={`//player.bilibili.com/player.html?bvid=${bvidMatch[0]}&page=1&high_quality=1&danmaku=0`}
            scrolling="no"
            border="0"
            frameBorder="no"
            allowFullScreen={true}
            className="w-full h-full"
          ></iframe>
        </div>
      );
    }
    return (
      <div className="my-4 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-mono">
        🎬 关联视频：
        <a href={url} target="_blank" rel="noreferrer" className="text-[#88abac] underline break-all ml-1">
          {url}
        </a>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-20 text-xs font-mono text-zinc-400">加载详情中...</div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="text-center py-20 text-xs font-mono text-zinc-400">帖子不存在或已被删除</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{post.title} - 鹿友论坛</title>
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/forum" className="text-xs font-mono text-zinc-400 hover:text-zinc-700 transition">
            ← 返回论坛列表
          </Link>

          <button
            onClick={handleDeletePost}
            className="text-xs text-rose-500 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition font-mono"
          >
            🗑️ 删除此帖
          </button>
        </div>

        {/* 帖子主卡片 */}
        <article className="bg-white border border-zinc-100 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-serif text-zinc-900 mb-4">{post.title}</h1>

          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 pb-6 border-b border-zinc-100 mb-6">
            <span className="text-zinc-700">👤 {post.author || '匿名鹿友'}</span>
            <span>•</span>
            <span>{new Date(post.created_at).toLocaleString()}</span>
            <span>•</span>
            <span>👁️ {post.views || 1} 浏览</span>
          </div>

          <div className="prose prose-zinc max-w-none text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap font-sans mb-6">
            {post.content}
          </div>

          {post.image_url && (
            <div className="my-4 rounded-xl overflow-hidden border border-zinc-100">
              <img src={post.image_url} alt="图片" className="max-h-96 w-auto object-contain" />
            </div>
          )}

          {post.video_url && renderVideoPlayer(post.video_url)}

          {/* 盖章防重触发按钮 */}
          <div className="mt-8 pt-4 border-t border-zinc-100 flex justify-center">
            <button
              onClick={handleToggleLike}
              disabled={liking}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-mono transition ${
                liked
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200'
              } ${liking ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>{liked ? '💖 已盖章' : '💙 盖个章'}</span>
              <span className="font-bold">{post.likes || 0}</span>
            </button>
          </div>
        </article>

        {/* 💬 评论区 */}
        <section className="bg-white border border-zinc-100 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-serif text-zinc-800 mb-6 flex items-center gap-2">
            💬 全部评论 <span className="text-xs font-mono text-zinc-400">({comments.length})</span>
          </h2>

          <div className="space-y-4 mb-8">
            {comments.length === 0 ? (
              <p className="text-xs font-mono text-zinc-400 text-center py-6">暂无评论，快来抢沙发吧~</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="p-4 bg-zinc-50/70 rounded-xl border border-zinc-100 relative group">
                  <div className="flex justify-between items-center mb-1 text-[11px] font-mono text-zinc-400">
                    <span className="text-zinc-700 font-medium">{c.author}</span>
                    <div className="flex items-center gap-2">
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>

                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-zinc-300 hover:text-rose-500 transition ml-1"
                        title="删除评论"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-700 leading-relaxed font-sans">{c.content}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleCommentSubmit} className="pt-6 border-t border-zinc-100 space-y-4">
            <input
              type="text"
              placeholder="昵称 (默认：匿名鹿友)"
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
              className="w-full sm:w-1/2 px-4 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac]"
            />
            <textarea
              rows={3}
              placeholder="写下你的想法或回复..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] resize-none"
              required
            />
            <button
              type="submit"
              disabled={submittingComment}
              className="px-6 py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-xl text-xs font-mono shadow-sm disabled:opacity-50 transition"
            >
              {submittingComment ? '发送中...' : '发送回复'}
            </button>
          </form>
        </section>
      </div>
    </Layout>
  );
}