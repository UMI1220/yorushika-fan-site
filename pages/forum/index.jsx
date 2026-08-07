import { toCDNUrl } from '../../lib/cdn';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import ForumAuthor from '../../components/ForumAuthor';

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  
  // 排序状态
  const [sortBy, setSortBy] = useState('latest'); 

  // 🎯 用户自选列数状态（默认先设为 2，避免服务端与客户端不一致导致的 Hydration 报错）
  const [gridCols, setGridCols] = useState(2);

  // 控制列数选择下拉菜单
  const [showColDropdown, setShowColDropdown] = useState(false);

  // 已注册用户映射：nickname -> { id, avatar }
  const [userMap, setUserMap] = useState({});

  /* ================= 搜索状态与防抖定时器 ================= */
  const [searchTerm, setSearchTerm] = useState('');          // 输入框实时内容
  const [debouncedSearch, setDebouncedSearch] = useState('');  // 防抖后的实际搜索词

  // 防抖定时器：用户停止输入 300ms 后才触发实际搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer); // 清除上一次未执行的定时器
  }, [searchTerm]);

  /* ================= 读取本地存储的列数设置 ================= */
  useEffect(() => {
    const savedCols = localStorage.getItem('forum_grid_cols');
    if (savedCols) {
      setGridCols(Number(savedCols));
    }
  }, []);

  /* ================= 加载已注册用户映射 ================= */
  useEffect(() => {
    fetch('/api/person/users')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const map = {};
          data.users.forEach((u) => {
            map[u.nickname] = { id: u.id, avatar: u.avatar || null };
          });
          setUserMap(map);
        }
      })
      .catch(() => {});
  }, []);

  /* ================= 更新监听与 fetchPosts 搜索逻辑 ================= */
  useEffect(() => {
    fetchPosts();
  }, [sortBy, activeCategory, debouncedSearch]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const categoryParam = activeCategory !== 'ALL' ? `&category=${activeCategory}` : '';
      const searchParam = debouncedSearch.trim() 
        ? `&search=${encodeURIComponent(debouncedSearch.trim())}` 
        : '';

      const res = await fetch(`/api/forum/list?sortBy=${sortBy}${categoryParam}${searchParam}`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('获取帖子失败:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= 恢复滚动位置 ================= */
  useEffect(() => {
    if (!loading && posts.length > 0) {
      const savedScrollPos = sessionStorage.getItem('forum_scroll_pos');
      if (savedScrollPos) {
        setTimeout(() => {
          window.scrollTo({
            top: parseInt(savedScrollPos, 10),
            behavior: 'instant'
          });
          // 用完立刻销毁，防止后续在首页操作时再次触发滚动
          sessionStorage.removeItem('forum_scroll_pos');
        }, 50);
      }
    }
  }, [loading, posts]);

  const handleDeletePost = async (e, postId) => {
    e.preventDefault();
    e.stopPropagation();

    const pwd = prompt('请输入删除密码 (发帖自设口令 或 管理员口令):');
    if (!pwd) return;

    try {
      const res = await fetch('/api/forum/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, type: 'post', password: pwd }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '密码错误，删除失败');
        return;
      }

      alert('删除成功');
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('删除出错:', err);
      alert('网络开小差了，请重试');
    }
  };

  /* ================= handlePinPost 置顶处理函数 ================= */
  const handlePinPost = async (e, postId, isCurrentlyPinned) => {
    e.preventDefault();
    e.stopPropagation();

    const actionText = isCurrentlyPinned ? '取消置顶' : '置顶';
    const password = prompt(`请输入管理员密码以 ${actionText} 该帖子：`);
    if (!password) return;

    try {
      const res = await fetch('/api/forum/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert(data.message);
        fetchPosts();
      } else {
        alert(data.error || '操作失败');
      }
    } catch (err) {
      console.error('置顶请求失败:', err);
      alert('网络请求失败，请稍后重试');
    }
  };

  // 计算印章总数
  const getTotalStamps = (post) => {
    if (!post) return 0;
    let detail = post.stamps_detail;
    if (typeof detail === 'string') {
      try {
        detail = JSON.parse(detail);
      } catch (e) {
        detail = null;
      }
    }
    if (detail && typeof detail === 'object') {
      const sum = Object.values(detail).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
      if (sum > 0) return sum;
    }
    return post.likes || 0;
  };

  const categories = [
    { key: 'ALL', label: '全部话题', icon: '🌐' },
    { key: 'ANNOUNCEMENT', label: ' 官方公告' , icon: '📢' },
    { key: 'COVER', label: '翻唱/演奏', icon: '🎤' },
    { key: 'ABSTRACT', label: '抽象/二创', icon: '🤪' },
    { key: 'ANALYSIS', label: '歌词/剧情考察', icon: '📖' },
    { key: 'MUSIC', label: '音乐/编曲讨论', icon: '🎵' },
    { key: 'PILGRIMAGE', label: '巡礼/圣地交流', icon: '🗺️' },
    { key: 'CHAT', label: '闲聊茶室', icon: '☕' },
  ];

  return (
    <Layout>
      <Head>
        <title>鹿友交流论坛 | ヨルシカ FanSite</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-20 sm:pt-24 pb-20 px-3 sm:px-8 overflow-x-hidden">
        <div className="w-full max-w-none mx-auto space-y-6 sm:space-y-8">
          
          {/* 页头 */}
          <div className="flex flex-row justify-between items-center border-b border-zinc-100 pb-4 sm:pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif text-zinc-800 tracking-wider mb-0.5 sm:mb-1">
                鹿友交流论坛
              </h1>
              <p className="text-[10px] sm:text-xs font-serif text-zinc-400 italic">
                讨论、考察与二次创作社区
              </p>
            </div>

            <Link
              href="/forum/post"
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-full text-xs font-medium tracking-widest shadow-sm transition flex items-center gap-1.5 shrink-0"
              onClick={() => {
                if (typeof window !== 'undefined') sessionStorage.removeItem('forum_scroll_pos');
              }}
            >
              <span>✏️</span>
              <span>发帖</span>
            </Link>
          </div>

          {/* 实时搜索框 UI */}
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="🔍 搜索标题、正文、作者..."
              value={searchTerm}
              onChange={(e) => {
                if (typeof window !== 'undefined') sessionStorage.removeItem('forum_scroll_pos');
                setSearchTerm(e.target.value);
              }}
              className="w-full px-4 py-2 sm:py-2.5 pl-9 bg-white border border-zinc-200/80 rounded-2xl text-xs focus:outline-none focus:border-[#88abac] shadow-sm transition placeholder:text-zinc-400"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') sessionStorage.removeItem('forum_scroll_pos');
                  setSearchTerm('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 transition"
              >
                ✕
              </button>
            )}
          </div>

          {/* 筛选与排序工具栏 */}
          <div className="flex flex-col gap-3">
            {/* 分类 Tags */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    if (typeof window !== 'undefined') sessionStorage.removeItem('forum_scroll_pos');
                    setActiveCategory(cat.key);
                  }}
                  className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium transition shrink-0 ${
                    activeCategory === cat.key
                      ? 'bg-[#88abac] text-white shadow-sm'
                      : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200/60'
                  }`}
                >
                  {cat.icon && <span className="mr-1">{cat.icon}</span>}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* 右侧/下侧工具组：排序 + 列数选择 */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {/* 5 维排序按钮 */}
              <div className="flex flex-wrap rounded-xl bg-zinc-100 p-1 text-[11px] sm:text-xs font-mono max-w-full">
                {['latest', 'oldest', 'most_likes', 'most_views', 'hottest'].map((type) => {
                  const labels = {
                    latest: '⏱️ 最新',
                    oldest: '⌛ 倒序',
                    most_likes: '💙 印章',
                    most_views: '👁️ 浏览',
                    hottest: '🔥 最热',
                  };
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        if (typeof window !== 'undefined') sessionStorage.removeItem('forum_scroll_pos');
                        setSortBy(type);
                      }}
                      className={`px-2 sm:px-3 py-1 rounded-lg transition ${
                        sortBy === type ? 'bg-white text-zinc-800 shadow-sm font-bold' : 'text-zinc-500'
                      }`}
                    >
                      {labels[type]}
                    </button>
                  );
                })}
              </div>

              {/* 列数自选下拉菜单 */}
              <div className="relative">
                <button
                  onClick={() => setShowColDropdown(!showColDropdown)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200/80 hover:border-zinc-300 text-zinc-700 text-[11px] sm:text-xs font-mono flex items-center gap-1.5 shadow-sm transition"
                >
                  <span>🖼️ {gridCols} 列</span>
                  <span className="text-[9px] text-zinc-400">
                    {showColDropdown ? '▲' : '▼'}
                  </span>
                </button>

                {showColDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setShowColDropdown(false)} 
                    />

                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-28 sm:w-32 bg-white border border-zinc-100 rounded-2xl shadow-xl z-30 py-1 font-mono text-xs overflow-hidden">
                      {[1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          onClick={() => {
                            setGridCols(num);
                            if (typeof window !== 'undefined') {
                               localStorage.setItem('forum_grid_cols', num);
                            }
                            setShowColDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between transition ${
                            gridCols === num
                              ? 'bg-zinc-50 text-[#88abac] font-bold'
                              : 'text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          <span>{num} 列</span>
                          {gridCols === num && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>

          {/* 帖子网格 */}
          {loading ? (
            <div className="text-center py-24 text-xs font-mono text-zinc-400">
              加载交流帖中...
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-zinc-100 text-xs text-zinc-400 font-serif">
              暂无讨论话题，快去发起一个吧~
            </div>
          ) : (
            <div 
              className="grid gap-4 sm:gap-6 transition-all duration-300 w-full"
              style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
            >
              {posts.map((post) => {
                const coverImage = post.image_url ? toCDNUrl(post.image_url.split(',')[0]) : null;
                const hasVideo = Boolean(post.video_url && post.video_url.trim());

                return (
                  <div
                    key={post.id}
                    className="bg-white rounded-3xl border border-zinc-100 hover:border-zinc-300 transition-all shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between group h-full"
                  >
                    <Link 
                      href={`/forum/${post.id}`} 
                      className="block flex-1"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem('forum_scroll_pos', window.scrollY);
                        }
                      }}
                    >
                      
                      {/* 4:3 比例容器 */}
                      <div 
                        className="relative w-full bg-gradient-to-br from-zinc-50 to-zinc-100 overflow-hidden flex flex-col justify-between p-3 sm:p-4"
                        style={{ aspectRatio: '4 / 3' }}
                      >
                        {coverImage && (
                          <img
                            src={coverImage}
                            alt={post.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
                          />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/50 to-black/30 pointer-events-none" />

                        {/* 顶部标签 */}
                        <div className="relative z-10 flex items-center justify-between gap-1">
                          <span className="text-[9px] sm:text-[10px] font-mono bg-black/40 backdrop-blur-md text-white border border-white/20 px-2 py-0.5 rounded-full">
                            {categories.find((c) => c.key === post.category)?.label || post.category || '讨论'}
                          </span>
                          
                          {hasVideo && (
                            <span className="text-[9px] sm:text-[10px] font-mono bg-sky-500/90 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-0.5">
                              🎬 视频
                            </span>
                          )}
                        </div>

                        {/* 底部文本 */}
                        <div className="relative z-10 space-y-0.5 sm:space-y-1">
                          <h2 className="text-xs sm:text-sm font-serif font-bold text-zinc-800 leading-snug drop-shadow-sm group-hover:text-[#88abac] transition-colors line-clamp-2">
                            {post.title}
                          </h2>
                          <p className="text-[10px] sm:text-[11px] text-zinc-500/90 line-clamp-1 leading-relaxed font-sans">
                            {post.content}
                          </p>
                        </div>

                      </div>
                    </Link>

                    {/* 卡片底栏 */}
                    <div className="px-3 sm:px-4 py-2 sm:py-3 bg-white border-t border-zinc-50 text-[11px] sm:text-xs text-zinc-400 font-mono space-y-1.5 sm:space-y-2">
                      <div className="flex items-center justify-between">
                        <ForumAuthor author={post.author} userMap={userMap} />

                        {/* 按钮组 */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handlePinPost(e, post.id, post.is_pinned)}
                            className={`p-0.5 transition hover:scale-110 ${
                              post.is_pinned ? 'text-[#88abac]' : 'text-zinc-300 hover:text-[#88abac]'
                            }`}
                            title={post.is_pinned ? '取消置顶' : '置顶帖子'}
                          >
                            📌
                          </button>

                          <button
                            onClick={(e) => handleDeletePost(e, post.id)}
                            className="text-zinc-300 hover:text-rose-500 p-0.5 transition"
                            title="删除帖子"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-50/80">
                        <span>👁️ {post.views || 0}</span>
                        <span className="px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] bg-zinc-50 text-zinc-500 font-sans border border-zinc-100">
                          💙 {getTotalStamps(post)} 印章
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}