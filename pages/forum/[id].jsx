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

  // 评论表单状态
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPostAndComments();
    }
  }, [id]);

  const fetchPostAndComments = async () => {
    try {
      setLoading(true);

      // 1. 获取帖子详情
      const { data: postData, error: postErr } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (postErr) throw postErr;
      setPost(postData);

      // 2. 获取回复评论
      const { data: commentData, error: commentErr } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      if (commentErr) throw commentErr;
      setComments(commentData || []);

    } catch (err) {
      console.error('读取帖子详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 盖印章/点赞
  const handleLike = async () => {
    if (!post || liked) return;
    try {
      const newLikes = (post.likes || 0) + 1;
      const { error } = await supabase
        .from('forum_posts')
        .update({ likes: newLikes })
        .eq('id', post.id);

      if (!error) {
        setPost({ ...post, likes: newLikes });
        setLiked(true);
      }
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };

  // 提交评论
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      setSubmittingComment(true);

      const { data, error } = await supabase
        .from('forum_comments')
        .insert([
          {
            post_id: id,
            author: commentAuthor.trim() || '匿名鹿友',
            content: commentContent.trim(),
          },
        ])
        .select();

      if (error) throw error;

      setComments([...comments, data[0]]);
      setCommentContent('');
    } catch (err) {
      console.error('评论提交失败:', err);
      alert('评论发表失败，请稍后重试');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#fafbfc] pt-32 text-center text-zinc-400 font-serif tracking-widest">
          加载帖子中...
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#fafbfc] pt-32 text-center text-zinc-500 font-serif space-y-4">
          <p>未找到相关讨论帖子</p>
          <Link href="/forum" className="text-xs text-[#88abac] underline">
            ← 返回社区列表
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{post.title} | FORUM | ヨルシカ FanSite</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="flex items-center justify-between">
            <Link
              href="/forum"
              className="text-xs tracking-widest text-[#88abac] hover:underline flex items-center gap-1"
            >
              ← 返回社区列表
            </Link>
            <span className="text-xs text-zinc-400 font-serif">DISCUSSION</span>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-zinc-100 space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <span className="inline-block text-[11px] text-[#88abac] border border-[#88abac]/30 px-2.5 py-0.5 rounded mb-3">
                {post.category}
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif text-zinc-800 tracking-wide leading-snug">
                {post.title}
              </h1>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-4">
                <span className="font-serif text-zinc-600">👤 {post.author}</span>
                <span>•</span>
                <span>{new Date(post.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* 帖子正文 */}
            <div className="text-sm sm:text-base text-zinc-700 leading-relaxed font-sans whitespace-pre-wrap py-2">
              {post.content}
            </div>

            {/* 帖子配图 (如果有) */}
            {post.image_url && (
              <div className="my-6 rounded-2xl overflow-hidden border border-zinc-100 bg-zinc-50/50 p-2 flex items-center justify-center">
                <img
                  src={post.image_url}
                  alt="帖子配图"
                  className="max-h-[500px] w-auto object-contain rounded-xl shadow-sm"
                />
              </div>
            )}

            {/* 点赞/盖印章按钮 */}
            <div className="pt-4 border-t border-zinc-50 flex justify-center">
              <button
                onClick={handleLike}
                disabled={liked}
                className={`px-6 py-2.5 rounded-full text-xs tracking-widest transition-all flex items-center gap-2 ${
                  liked
                    ? 'bg-rose-50 text-rose-500 border border-rose-200'
                    : 'bg-zinc-50 hover:bg-rose-50 text-zinc-600 hover:text-rose-500 border border-zinc-200'
                }`}
              >
                <span>{liked ? '💙 已盖印章' : '💙 盖印章'}</span>
                <span className="font-mono">({post.likes || 0})</span>
              </button>
            </div>
          </div>

          {/* 回复评论区 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-100 space-y-6">
            <h3 className="font-serif text-zinc-800 text-lg tracking-widest border-b border-zinc-100 pb-3">
              同好回复 ({comments.length})
            </h3>

            {comments.length === 0 ? (
              <p className="text-xs text-zinc-400 font-serif italic py-4 text-center">
                暂无回复，快来留下你的第一条感悟吧~
              </p>
            ) : (
              <div className="space-y-4 divide-y divide-zinc-50">
                {comments.map((comment, index) => (
                  <div key={comment.id} className="pt-4 first:pt-0 space-y-1.5">
                    <div className="flex justify-between items-center text-xs text-zinc-400">
                      <span className="font-serif text-zinc-700">
                        #{index + 1} 楼 • {comment.author}
                      </span>
                      <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed pl-2 border-l-2 border-[#88abac]/30">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 发表回复 */}
            <form onSubmit={handleCommentSubmit} className="pt-6 border-t border-zinc-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="昵称 (可选，默认：匿名鹿友)"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac]"
                />
              </div>
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
                className="px-6 py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-xl text-xs tracking-widest transition-all"
              >
                {submittingComment ? '发表中...' : '发表回复'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </Layout>
  );
}