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

      if (!commentErr) {
        setComments(commentData || []);
      }
    } catch (err) {
      console.error('获取详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 点赞盖章
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
      console.error('盖章点赞失败:', err);
    }
  };

  // 提交回复
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

      setCommentContent('');
      setComments([...comments, data[0]]);
    } catch (err) {
      console.error('回复失败:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // 🎥 智能视频嵌入渲染器
  const renderVideoPlayer = (url) => {
    if (!url) return null;

    // 1. Bilibili (匹配 BV号 或 bilibili.com)
    const bvidMatch = url.match(/BV[a-zA-Z0-9]+/i);
    if (bvidMatch) {
      const bvid = bvidMatch[0];
      return (
        <div className="my-6 aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-zinc-200">
          <iframe
            src={`//player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0`}
            scrolling="no"
            border="0"
            frameBorder="no"
            framespacing="0"
            allowFullScreen={true}
            className="w-full h-full"
          ></iframe>
        </div>
      );
    }

    // 2. YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return (
        <div className="my-6 aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-zinc-200">
          <iframe
            src={`https://www.youtube.com/embed/${ytMatch[1]}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      );
    }

    // 3. 通用 MP4 直链
    return (
      <div className="my-6 rounded-2xl overflow-hidden shadow-lg bg-black">
        <video controls className="w-full max-h-[500px]">
          <source src={url} />
          您的浏览器不支持 Video 播放器。
        </video>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="py-24 text-center font-mono text-xs text-zinc-400 animate-pulse">
          Loading post details...
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="py-24 text-center">
          <p className="text-xs font-mono text-zinc-400 mb-4">该话题不存在或已被删除</p>
          <Link href="/forum" className="text-xs font-mono text-[#88abac] underline">
            ← 返回讨论区
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{post.title} | 鹿友论坛</title>
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/forum" className="text-xs font-mono text-zinc-400 hover:text-zinc-700 transition">
          ← 返回讨论区
        </Link>

        {/* 帖子正文卡片 */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 sm:p-8 shadow-sm my-4">
          <h1 className="text-xl sm:text-2xl font-serif text-zinc-900 mb-4 leading-snug">{post.title}</h1>

          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mb-6 border-b border-zinc-100 pb-4">
            <span className="text-zinc-700">👤 {post.author || '匿名鹿友'}</span>
            <span>•</span>
            <span>{new Date(post.created_at).toLocaleString()}</span>
          </div>

          {/* 正文 */}
          <div className="text-sm text-zinc-700 leading-relaxed font-sans whitespace-pre-wrap mb-6">
            {post.content}
          </div>

          {/* 🎬 视频播放组件 */}
          {post.video_url && renderVideoPlayer(post.video_url)}

          {/* 配图 */}
          {post.image_url && (
            <div className="my-6 rounded-2xl overflow-hidden border border-zinc-100 shadow-sm">
              <img src={post.image_url} alt="帖子配图" className="w-full h-auto block" />
            </div>
          )}

          {/* 点赞印章按钮 */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleLike}
              disabled={liked}
              className={`px-6 py-2.5 rounded-full font-mono text-xs flex items-center gap-2 border transition-all ${
                liked
                  ? 'bg-rose-50 text-rose-500 border-rose-200 cursor-default'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 shadow-sm'
              }`}
            >
              <span>{liked ? '💖 已盖章印记' : '🌸 留下盖章'}</span>
              <span className="font-bold">({post.likes || 0})</span>
            </button>
          </div>
        </div>

        {/* 评论回复区 */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-6 sm:p-8 shadow-sm">
          <h2 className="text-sm font-serif text-zinc-800 mb-6 font-medium">
            💬 讨论回复 ({comments.length})
          </h2>

          {comments.length === 0 ? (
            <p className="text-xs font-mono text-zinc-400 text-center py-6">暂无回复，快来发表你的见解～</p>
          ) : (
            <div className="space-y-4 mb-8">
              {comments.map((c, idx) => (
                <div key={c.id || idx} className="p-4 bg-zinc-50/60 rounded-xl border border-zinc-100">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
                    <span className="text-zinc-700 font-medium">👤 {c.author}</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-zinc-700 leading-relaxed">{c.content}</p>
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
              className="px-6 py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-xl text-xs font-mono shadow-sm disabled:opacity-50 transition"
            >
              {submittingComment ? '发表中...' : '发表回复'}
            </button>
          </form>
        </div>

      </div>
    </Layout>
  );
}