import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

// 夜鹿特色印章选项
const STAMPS = [
  { id: 'flower', icon: '🌸', name: '花束' },
  { id: 'moon', icon: '🌙', name: '月光' },
  { id: 'ghost', icon: '👻', name: '亡灵' },
  { id: 'coffee', icon: '☕', name: '咖啡' },
  { id: 'blue', icon: '💙', name: '青蓝' },
];

export default function ForumDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  // 🎯 1. 增加评论框引用，用于自动滚动和聚焦
  const commentInputRef = useRef(null);

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 评论表单状态
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentPwd, setCommentPwd] = useState('');
  const [replyParent, setReplyParent] = useState(null); // 楼中楼回复对象
  const [commentImgFile, setCommentImgFile] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // 印章弹窗与防重复盖章
  const [postStamped, setPostStamped] = useState(false);
  const [stampedCommentIds, setStampedCommentIds] = useState({});
  const [showStampModal, setShowStampModal] = useState(false);

  // 图片画廊预览与手势监听
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    if (id) {
      fetchPostAndComments(id);
    }
  }, [id]);

  const images = post?.image_url ? post.image_url.split(',').filter(Boolean) : [];

  // 🎯 电脑端键盘按键监听 (← / → / Esc)
  useEffect(() => {
    if (galleryIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setGalleryIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight') {
        setGalleryIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'Escape') {
        setGalleryIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryIndex, images.length]);

  // 拉取帖子详情与评论
  const fetchPostAndComments = async (postId) => {
    try {
      setLoading(true);

      const resPost = await fetch(`/api/forum/list?id=${postId}`);
      const postsData = await resPost.json();
      const currentPost = Array.isArray(postsData)
        ? postsData.find((p) => String(p.id) === String(postId))
        : postsData;

      if (currentPost) {
        setPost(currentPost);
      }

      const resComm = await fetch(`/api/forum/comment?post_id=${postId}`);
      const commData = await resComm.json();
      setComments(Array.isArray(commData) ? commData : []);
    } catch (err) {
      console.error('拉取帖子详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 解析并计算每种印章的具体数量（数量为 0 的不显示）
  const getStampCounts = () => {
    if (!post || !post.stamps_detail) return [];
    let detail = post.stamps_detail;
    if (typeof detail === 'string') {
      try {
        detail = JSON.parse(detail);
      } catch (e) {
        detail = {};
      }
    }
    return STAMPS.map((s) => ({
      ...s,
      count: detail[s.id] || 0,
    })).filter((s) => s.count > 0);
  };

  // 主帖盖章/点赞
  const handleSelectStamp = async (stampType) => {
    if (!post || postStamped) return;

    try {
      const res = await fetch('/api/forum/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, type: 'post', stampType }),
      });
      const data = await res.json();
      if (res.ok) {
        setPostStamped(true);
        setPost((prev) => ({
          ...prev,
          likes: data.likes || prev.likes + 1,
          stamps_detail: data.stamps_detail || prev.stamps_detail,
        }));
        setShowStampModal(false);
      }
    } catch (err) {
      console.error('盖章失败:', err);
    }
  };

  // 评论点赞
  const handleStampComment = async (comment) => {
    if (stampedCommentIds[comment.id]) return;

    try {
      const res = await fetch('/api/forum/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: comment.id, type: 'comment' }),
      });
      const data = await res.json();
      if (res.ok) {
        setStampedCommentIds((prev) => ({ ...prev, [comment.id]: true }));
        setComments((prev) =>
          prev.map((c) => (c.id === comment.id ? { ...c, likes: data.likes || c.likes + 1 } : c))
        );
      }
    } catch (err) {
      console.error('评论点赞失败:', err);
    }
  };

  // 提交评论
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() && !commentImgFile) return;

    setSubmittingComment(true);

    try {
      let uploadedImgUrl = '';
      if (commentImgFile) {
        const fd = new FormData();
        fd.append('file', commentImgFile);
        fd.append('bucket', 'magazines');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const resData = await res.json();
        if (resData.url) uploadedImgUrl = resData.url;
      }

      const res = await fetch('/api/forum/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          author: commentAuthor.trim() || '匿名鹿友',
          content: replyParent ? `[@${replyParent.author}]: ${commentText.trim()}` : commentText.trim(),
          parent_id: replyParent ? replyParent.id : null,
          image_url: uploadedImgUrl,
          delete_password: commentPwd.trim(),
        }),
      });

      if (res.ok) {
        setCommentText('');
        setReplyParent(null);
        setCommentImgFile(null);
        setCommentPwd('');
        fetchPostAndComments(post.id);
      } else {
        const errData = await res.json();
        alert(errData.error || '评论提交失败');
      }
    } catch (err) {
      console.error('发送评论出错:', err);
      alert('网络开小差了，请重试');
    } finally {
      setSubmittingComment(false);
    }
  };

  // 删除主贴
  const handleDeletePost = async () => {
    const pwd = prompt('请输入删除密码 (发帖自设口令 或 管理员口令):');
    if (!pwd) return;

    try {
      const res = await fetch('/api/forum/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, type: 'post', password: pwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '密码错误，删除失败');
        return;
      }
      alert('删除成功');
      router.push('/forum');
    } catch (err) {
      alert('网络开小差了');
    }
  };

  // 删除评论
  const handleDeleteComment = async (commentId) => {
    const pwd = prompt('请输入删除密码 (发评自设口令 或 管理员口令):');
    if (!pwd) return;

    try {
      const res = await fetch('/api/forum/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commentId, type: 'comment', password: pwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '密码错误，删除失败');
        return;
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      alert('网络开小差了');
    }
  };

  // 🎯 手机端触摸滑动逻辑
  const minSwipeDistance = 40;
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && galleryIndex < images.length - 1) {
      setGalleryIndex((prev) => prev + 1);
    } else if (distance < -minSwipeDistance && galleryIndex > 0) {
      setGalleryIndex((prev) => prev - 1);
    }
  };

  // 🎥 兼顾 PC 与移动端的 B 站 / YouTube / MP4 嵌入播放器
  const renderVideoPlayer = (url) => {
    if (!url) return null;
    let embedSrc = null;

    if (url.includes('bilibili.com') || url.includes('b23.tv')) {
      const bvMatch = url.match(/(BV[\w]+)/i);
      if (bvMatch) {
        embedSrc = `https://player.bilibili.com/player.html?bvid=${bvMatch[1]}&page=1&high_quality=1&autoplay=0&isOutside=true`;
      }
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch) {
        embedSrc = `https://www.youtube.com/embed/${ytMatch[1]}`;
      }
    }

    if (embedSrc) {
      return (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden my-4 border border-zinc-200/80 bg-black shadow-sm">
          <iframe
            src={embedSrc}
            className="w-full h-full border-0"
            scrolling="no"
            frameBorder="no"
            framespacing="0"
            allowFullScreen={true}
            referrerPolicy="no-referrer"
            sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
          />
        </div>
      );
    }

    return (
      <video controls className="w-full rounded-2xl my-4 border border-zinc-200/80 bg-black">
        <source src={url} type="video/mp4" />
        您的浏览器不支持原生视频播放。
      </video>
    );
  };

  const stampCounts = getStampCounts();

  return (
    <Layout>
      <Head>
        <title>{post ? `${post.title} - Yorushika FanSite` : '帖子详情'}</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white/85 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm">
          <Link href="/forum" className="text-xs text-zinc-400 hover:text-zinc-600 font-mono mb-4 inline-block transition">
            ← 返回论坛
          </Link>

          {loading || !post ? (
            <div className="py-20 text-center text-xs font-mono text-zinc-400">加载详情中...</div>
          ) : (
            <>
              {/* 帖子标头 */}
              <div className="border-b border-zinc-100 pb-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-[#88abac] text-white text-[10px] font-mono rounded-md">
                    {post.category || 'ABSTRACT'}
                  </span>
                  {post.is_pinned && (
                    <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-mono rounded-md">📌 置顶</span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-800 leading-snug">{post.title}</h1>

                {/* 🗺️ 巡礼地点/坐标卡片 */}
                {post.location_name && (
                  <div className="mt-3 p-3 bg-teal-50/60 border border-teal-100 rounded-xl flex items-center gap-2 text-xs text-teal-800 font-mono">
                    <span>🗺️ 巡礼地点/坐标：</span>
                    <span className="font-bold">{post.location_name}</span>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4 text-xs font-mono text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span>👤 {post.author || '匿名鹿友'}</span>
                    <span>👁️ {post.views || 0} 次浏览</span>
                  </div>
                  <button onClick={handleDeletePost} className="text-zinc-300 hover:text-rose-500 transition">
                    🗑️ 删除帖子
                  </button>
                </div>
              </div>

              {/* 帖子正文内容 */}
              <div className="text-sm font-sans text-zinc-700 leading-relaxed whitespace-pre-wrap mb-6">
                {post.content}
              </div>

              {/* 视频 Player 嵌入 */}
              {post.video_url && renderVideoPlayer(post.video_url)}

              {/* 第一张图完全显示，右下角徽章标识总张数 */}
              {images.length > 0 && (
                <div className="my-6">
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-200/80 bg-zinc-900/5 flex items-center justify-center">
                    <img
                      src={images[0]}
                      alt="帖子配图"
                      className="w-full max-h-[500px] object-contain cursor-pointer transition hover:opacity-95"
                      onClick={() => setGalleryIndex(0)}
                    />
                    <span className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-mono rounded-full border border-white/10 shadow-sm pointer-events-none">
                      📷 1/{images.length} 张图片
                    </span>
                  </div>
                </div>
              )}

              {/* 印章展示区 */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 my-8">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="text-zinc-400 mr-1">印章情况:</span>
                  {stampCounts.length > 0 ? (
                    stampCounts.map((st) => (
                      <span
                        key={st.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-zinc-200/80 rounded-full text-xs font-mono shadow-2xs"
                      >
                        <span>{st.icon}</span>
                        <span className="text-zinc-700 font-bold">{st.count}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-400 italic text-[11px]">暂无印章</span>
                  )}
                </div>

                <button
                  onClick={() => setShowStampModal(true)}
                  disabled={postStamped}
                  className={`px-4 py-2 rounded-xl text-xs font-mono transition shrink-0 ${
                    postStamped
                      ? 'bg-rose-50 text-rose-500 cursor-not-allowed'
                      : 'bg-[#88abac] text-white hover:bg-[#789b9c] shadow-sm'
                  }`}
                >
                  {postStamped ? '💖 已盖章' : '🌸 选择印章盖章'}
                </button>
              </div>

              {/* 评论交流区 */}
              <div className="mt-10 border-t border-zinc-100 pt-6">
                <h3 className="text-sm font-mono font-bold text-zinc-800 mb-4">💬 评论交流 ({comments.length})</h3>

                {/* 发表评论表单 */}
                <form onSubmit={handleCommentSubmit} className="space-y-3 mb-8 bg-zinc-50/80 p-4 rounded-2xl border border-zinc-200/80">
                  {replyParent && (
                    <div className="flex items-center justify-between text-xs font-mono text-[#88abac] bg-teal-50/50 p-2 rounded-lg">
                      <span>正在回复 @{replyParent.author}</span>
                      <button type="button" onClick={() => setReplyParent(null)} className="text-zinc-400 hover:text-rose-500">
                        ✕ 取消回复
                      </button>
                    </div>
                  )}

                  {/* 🎯 2. 绑定 ref 引用 */}
                  <textarea
                    ref={commentInputRef}
                    rows={3}
                    required={!commentImgFile}
                    placeholder={replyParent ? `回复 @${replyParent.author}...` : '写下你的看法...'}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full text-xs font-mono p-3 bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-[#88abac]"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="昵称 (默认: 匿名鹿友)"
                        value={commentAuthor}
                        onChange={(e) => setCommentAuthor(e.target.value)}
                        className="text-xs font-mono px-3 py-1.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-[#88abac] w-36"
                      />
                      <input
                        type="password"
                        placeholder="🔑 自设删除密码"
                        value={commentPwd}
                        onChange={(e) => setCommentPwd(e.target.value)}
                        className="text-xs font-mono px-3 py-1.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-[#88abac] w-32"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCommentImgFile(e.target.files[0])}
                        className="text-[11px] font-mono text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-zinc-200 file:text-zinc-700 hover:file:bg-[#88abac] hover:file:text-white cursor-pointer"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingComment}
                      className="px-4 py-1.5 bg-[#88abac] hover:bg-[#789b9c] text-white text-xs font-mono rounded-xl transition disabled:opacity-50"
                    >
                      {submittingComment ? '发送中...' : '发送评论'}
                    </button>
                  </div>
                </form>

                {/* 评论列表 */}
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-xs font-mono text-zinc-400 text-center py-6">暂无评论，来抢沙发吧 ~</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="p-4 bg-zinc-50/60 rounded-2xl border border-zinc-100/80 space-y-2">
                        <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
                          <span>👤 {c.author || '匿名鹿友'}</span>
                          <div className="flex items-center gap-2.5">
                            {/* 🎯 3. 点击回复自动平滑滚动并聚焦 */}
                            <button
                              onClick={() => {
                                setReplyParent(c);
                                commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                commentInputRef.current?.focus();
                              }}
                              className="text-[#88abac] hover:underline"
                            >
                              回复
                            </button>
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

                        <p className="text-xs font-sans text-zinc-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>

                        {c.image_url && (
                          <img
                            src={c.image_url}
                            alt="评论配图"
                            className="max-w-xs max-h-48 rounded-xl object-cover border border-zinc-200 mt-2"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 印章选择 Modal */}
      {showStampModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full border border-zinc-100 shadow-xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-zinc-700 text-center">选择夜鹿特色印章盖章</h3>
            
            <div className="grid grid-cols-3 gap-2">
              {STAMPS.map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleSelectStamp(st.id)}
                  className="p-2.5 bg-zinc-50 hover:bg-[#88abac]/10 hover:border-[#88abac] border border-zinc-200/80 rounded-2xl flex flex-col items-center gap-0.5 transition group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{st.icon}</span>
                  <span className="text-[10px] font-mono text-zinc-500">{st.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowStampModal(false)}
              className="w-full py-2 bg-zinc-100 text-[11px] font-mono text-zinc-500 rounded-xl hover:bg-zinc-200 transition"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 全屏大图画廊 */}
      {galleryIndex !== null && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none"
          onClick={() => setGalleryIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {galleryIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGalleryIndex((prev) => prev - 1);
              }}
              className="absolute left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center transition"
              title="上一张 (←)"
            >
              ‹
            </button>
          )}

          <img
            src={images[galleryIndex]}
            alt="全屏图"
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {galleryIndex < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setGalleryIndex((prev) => prev + 1);
              }}
              className="absolute right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center transition"
              title="下一张 (→)"
            >
              ›
            </button>
          )}

          <div className="absolute bottom-6 text-white text-xs font-mono bg-black/60 border border-white/10 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg">
            {galleryIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </Layout>
  );
}