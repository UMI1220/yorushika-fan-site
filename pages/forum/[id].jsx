import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function ForumDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 评论表单
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // 防重复盖章
  const [postStamped, setPostStamped] = useState(false);
  const [stampedCommentIds, setStampedCommentIds] = useState({});

  useEffect(() => {
    if (id) {
      fetchPostAndComments(id);
    }
  }, [id]);

  // 拉取帖子详情与对应 forum_comments 数据
  const fetchPostAndComments = async (postId) => {
    try {
      setLoading(true);

      // 1. 获取帖子主数据
      const { data: postData, error: postErr } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (postErr) throw postErr;
      setPost(postData);

      // 自增浏览量
      await supabase
        .from('forum_posts')
        .update({ views: (postData.views || 0) + 1 })
        .eq('id', postId);

      // 2. 核心修正：指定拉取 forum_comments 评论表！
      const { data: commentsData, error: commentErr } = await supabase
        .from('forum_comments') // 👈 数据库表名为 forum_comments
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (!commentErr) {
        setComments(commentsData || []);
      }
    } catch (err) {
      console.error('获取帖子详情及评论失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 帖子盖章
  const handleStampPost = async () => {
    if (!post || postStamped) return;

    try {
      const newLikes = (post.likes || 0) + 1;
      setPostStamped(true);
      setPost((prev) => ({ ...prev, likes: newLikes }));

      await supabase.from('forum_posts').update({ likes: newLikes }).eq('id', post.id);
    } catch (err) {
      console.error('帖子盖章失败:', err);
    }
  };

  // 发表新评论（写入 forum_comments）
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const { data, error } = await supabase
        .from('forum_comments') // 👈 写入 forum_comments
        .insert([
          {
            post_id: id,
            content: commentText.trim(),
            author: commentAuthor.trim() || '匿名鹿友',
            likes: 0,
          },
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setComments((prev) => [...prev, data[0]]);
        setCommentText('');
        setCommentAuthor('');
      }
    } catch (err) {
      console.error('评论发表失败:', err);
      alert('评论发表失败');
    } finally {
      setSubmittingComment(false);
    }
  };

  // 🗑️ 删除评论（接口指定 table=forum_comments）
  const handleDeleteComment = async (commentId) => {
    const inputPassword = prompt('请输入管理员密码确认删除该评论：');
    if (!inputPassword) return;

    try {
      // 👈 请求 query 明确带上 forum_comments
      const res = await fetch(`/api/delete?table=forum_comments&id=${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': inputPassword,
        },
      });
      const result = await res.json();

      if (result.success) {
        alert('评论已删除');
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        alert(`删除失败: ${result.error || '密码错误'}`);
      }
    } catch (err) {
      console.error('删除评论失败:', err);
      alert('请求异常，请稍后重试');
    }
  };

  // 评论点赞盖章（写入 forum_comments）
  const handleStampComment = async (comment) => {
    if (stampedCommentIds[comment.id]) return;

    try {
      const newLikes = (comment.likes || 0) + 1;
      setStampedCommentIds((prev) => ({ ...prev, [comment.id]: true }));

      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, likes: newLikes } : c))
      );

      await supabase
        .from('forum_comments') // 👈 写入 forum_comments
        .update({ likes: newLikes })
        .eq('id', comment.id);
    } catch (err) {
      console.error('评论盖章失败:', err);
    }
  };

  return (
    <Layout>
      <Head>
        <title>{post ? `${post.title} - 鹿友论坛` : '帖子加载中...'} | ヨルシカ FanSite</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <Link href="/forum" className="text-xs text-[#88abac] font-serif hover:underline inline-block">
            ← 返回论坛列表
          </Link>

          {loading ? (
            <div className="py-20 text-center text-xs font-mono text-zinc-400">
              加载论题中...
            </div>
          ) : !post ? (
            <div className="py-20 text-center text-xs text-zinc-400 font-serif">
              该论题已被下架或不存在
            </div>
          ) : (
            <>
              {/* 主帖子卡片 */}
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-zinc-100 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-mono bg-[#88abac]/10 text-[#88abac] px-2.5 py-0.5 rounded-full border border-[#88abac]/20">
                      {post.category || 'CHAT'}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-serif text-zinc-800 tracking-wide mb-4">
                    {post.title}
                  </h1>

                  <div className="text-xs text-zinc-400 font-mono flex items-center gap-4 border-b border-zinc-100 pb-4">
                    <span>👤 发布者：{post.author || '匿名鹿友'}</span>
                    <span>👁️ {post.views || 0} 浏览</span>
                  </div>
                </div>

                {/* 正文 */}
                <div className="text-sm font-sans text-zinc-700 leading-relaxed whitespace-pre-wrap py-2">
                  {post.content}
                </div>

                {/* 盖章点赞区 */}
                <div className="pt-4 border-t border-zinc-100 flex justify-end">
                  <button
                    onClick={handleStampPost}
                    disabled={postStamped}
                    className={`px-4 py-2 rounded-xl text-xs font-mono transition ${
                      postStamped
                        ? 'bg-rose-50 text-rose-500 border border-rose-200 cursor-default'
                        : 'bg-[#88abac] hover:bg-[#789b9c] text-white shadow-sm'
                    }`}
                  >
                    {postStamped ? '💖 已盖章' : `💙 印章支持 (${post.likes || 0})`}
                  </button>
                </div>
              </div>

              {/* 💬 评论区 (forum_comments) */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-100 shadow-sm space-y-6">
                <h3 className="text-base font-serif text-zinc-800 font-medium border-b border-zinc-100 pb-4">
                  💬 鹿友讨论 ({comments.length})
                </h3>

                {/* 发表评论表单 */}
                <form onSubmit={handleAddComment} className="space-y-4">
                  <textarea
                    rows={3}
                    placeholder="参与讨论，留下你的看法..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] resize-none"
                  />

                  <div className="flex items-center justify-between gap-4">
                    <input
                      type="text"
                      placeholder="你的昵称 (默认: 匿名鹿友)"
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      className="px-4 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] w-48"
                    />

                    <button
                      type="submit"
                      disabled={submittingComment}
                      className="px-5 py-2 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-xl text-xs font-mono shadow-sm transition"
                    >
                      {submittingComment ? '发送中...' : '发送评论'}
                    </button>
                  </div>
                </form>

                {/* 评论列表 */}
                <div className="space-y-4 pt-4 border-t border-zinc-100">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-xs font-mono text-zinc-400">
                      还没有评论，来抢沙发吧~
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 bg-zinc-50/60 rounded-2xl border border-zinc-100/80 space-y-2"
                      >
                        <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
                          <span>👤 {c.author || '匿名鹿友'}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStampComment(c)}
                              disabled={stampedCommentIds[c.id]}
                              className="hover:text-[#88abac] transition"
                            >
                              💙 {c.likes || 0}
                            </button>
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-zinc-300 hover:text-rose-500 p-0.5 transition"
                              title="删除评论"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <p className="text-xs font-sans text-zinc-700 leading-relaxed whitespace-pre-wrap">
                          {c.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </>
          )}

        </div>
      </div>
    </Layout>
  );
}