import React, { useState, useEffect } from 'react';
import Layout, { useAudio } from '../components/Layout';

// -----------------------------------------------------------------------------
// 1. 坚果 OS 动态物理光影计算 (随现实时间演变)
// -----------------------------------------------------------------------------
function getDynamicShadowStyle(theme) {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;

  if (theme === 'gekkou') {
    return {
      boxShadow: '0px 14px 32px rgba(0, 0, 0, 0.85), 0px 4px 12px rgba(0, 0, 0, 0.6)',
    };
  }

  const angle = ((hours - 6) / 12) * Math.PI;
  const offsetX = Math.cos(angle) * 12;
  const offsetY = Math.sin(angle) * 14 + 6;

  return {
    boxShadow: `${offsetX.toFixed(1)}px ${offsetY.toFixed(1)}px 24px rgba(0, 0, 0, 0.12), ${(offsetX * 0.5).toFixed(1)}px ${(offsetY * 0.5).toFixed(1)}px 8px rgba(0, 0, 0, 0.08)`,
  };
}

// -----------------------------------------------------------------------------
// 主页面组件: AdminPage
// -----------------------------------------------------------------------------
export default function AdminPage() {
  const { theme, themeColor } = useAudio();
  const dynamicShadow = getDynamicShadowStyle(theme);

  // 状态管理
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // 选项卡切换: 'overview' (系统概况) | 'pending' (审核暂存表) | 'records' (数据总览) | 'comments' (评论管理)
  const [activeTab, setActiveTab] = useState('overview');

  // 数据列表状态
  const [pendingSongs, setPendingSongs] = useState([]);
  const [albumsList, setAlbumsList] = useState([]);
  const [songsList, setSongsList] = useState([]);
  const [commentsList, setCommentsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ---------------------------------------------------------------------------
  // 鉴权处理
  // ---------------------------------------------------------------------------
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'admin1220' || passwordInput === 'yorushika') {
      setIsAuthenticated(true);
      setAuthError('');
      fetchAllAdminData();
    } else {
      setAuthError('[ ERROR: INVALID ADMIN PASSWORD / 管理员密码错误 ]');
    }
  };

  // ---------------------------------------------------------------------------
  // 数据抓取
  // ---------------------------------------------------------------------------
  const fetchAllAdminData = async () => {
    setLoading(true);
    setMessage('');
    try {
      // 1. 拉取待审核暂存表 (pending_songs)
      const pendingRes = await fetch('/api/admin/staging');
      const pendingData = await pendingRes.json();
      if (pendingData && Array.isArray(pendingData.pending)) {
        setPendingSongs(pendingData.pending);
      }

      // 2. 拉取专辑列表
      const albumsRes = await fetch('/api/albums');
      const albumsData = await albumsRes.json();
      if (albumsData && Array.isArray(albumsData.albums)) {
        setAlbumsList(albumsData.albums);
      }

      // 3. 拉取歌曲列表
      const songsRes = await fetch('/api/songs');
      const songsData = await songsRes.json();
      if (songsData && Array.isArray(songsData.songs)) {
        setSongsList(songsData.songs);
      }

      // 4. 拉取评论列表
      const commentsRes = await fetch('/api/comments');
      const commentsData = await commentsRes.json();
      if (commentsData && Array.isArray(commentsData.comments)) {
        setCommentsList(commentsData.comments);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setMessage('[ ERROR: FAILED TO FETCH SYSTEM DATA / 后台数据加载异常 ]');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 审核暂存操作: 通过审核 (Approve) 或 拒绝/删除 (Reject)
  // ---------------------------------------------------------------------------
  const handleAuditAction = async (id, action) => {
    try {
      const res = await fetch('/api/admin/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const result = await res.json();
      if (res.ok) {
        setMessage(`[ SUCCESS: AUDIT ${action.toUpperCase()} COMPLETED ]`);
        fetchAllAdminData();
      } else {
        setMessage(`[ ERROR: ${result.error || 'OPERATION FAILED'} ]`);
      }
    } catch (e) {
      console.error('Audit action error:', e);
      setMessage('[ ERROR: NETWORK EXCEPTION DURING AUDIT ]');
    }
  };

  // ---------------------------------------------------------------------------
  // 正式数据删除操作
  // ---------------------------------------------------------------------------
  const handleDeleteRecord = async (type, id) => {
    if (!confirm(`[ WARNING: ARE YOU SURE TO DELETE ${type.toUpperCase()} #${id}? ]`)) return;

    try {
      const res = await fetch(`/api/admin/delete?type=${type}&id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessage(`[ SUCCESS: ${type.toUpperCase()} #${id} DELETED SUCCESSFULLY ]`);
        fetchAllAdminData();
      } else {
        setMessage('[ ERROR: FAILED TO DELETE RECORD ]');
      }
    } catch (e) {
      console.error('Delete error:', e);
      setMessage('[ ERROR: DELETE EXCEPTION ]');
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8 min-h-[85vh] font-serif text-current select-none space-y-6">
        
        {/* 顶部标题栏 */}
        <div className="border-b border-current/10 pb-3 flex justify-between items-end font-mono text-xs">
          <div>
            <h1 className="text-base font-bold tracking-widest">[ ADMIN & AUDIT DASHBOARD ]</h1>
            <p className="text-[10px] opacity-60 mt-1">ヨルシカ (YORUSHIKA) ARCHIVE — 后台管理与内容审核系统</p>
          </div>
          <span className="opacity-40 text-[10px]">[ D1 DATABASE: YORUSHIKA-SITE ]</span>
        </div>

        {/* 未登录鉴权态 */}
        {!isAuthenticated ? (
          <div
            style={dynamicShadow}
            className="max-w-md mx-auto mt-16 p-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-current/10 rounded-none space-y-6"
          >
            <div className="space-y-2 text-center font-mono">
              <h2 className="text-sm font-bold tracking-wider">[ RESTRICTED AREA / 管理员验证 ]</h2>
              <p className="text-[10px] opacity-65">请输入后台管理密码以解锁数据库管理与审核权限</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 font-mono">
              <input
                type="password"
                required
                placeholder="输入管理员密码..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full p-3 text-xs bg-current/5 border border-current/20 rounded-none outline-none focus:border-current"
              />
              {authError && (
                <p className="text-[10px] text-red-500 font-bold">{authError}</p>
              )}
              <button
                type="submit"
                style={{ color: themeColor }}
                className="w-full py-3 text-xs font-bold border border-current/40 hover:bg-current/10 cursor-pointer transition-colors"
              >
                [ UNLOCK ADMIN PANEL &gt; ]
              </button>
            </form>
          </div>
        ) : (
          /* 已登录后台主界面 */
          <div className="space-y-6">
            
            {/* 选项卡导航栏 */}
            <div className="flex flex-wrap gap-2 border-b border-current/10 pb-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                style={{ color: activeTab === 'overview' ? themeColor : 'inherit' }}
                className={`px-4 py-2 border border-current/20 cursor-pointer ${activeTab === 'overview' ? 'bg-current/10 font-bold' : 'opacity-60'}`}
              >
                [ 01. OVERVIEW / 系统概况 ]
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                style={{ color: activeTab === 'pending' ? themeColor : 'inherit' }}
                className={`px-4 py-2 border border-current/20 cursor-pointer ${activeTab === 'pending' ? 'bg-current/10 font-bold' : 'opacity-60'}`}
              >
                [ 02. AUDIT PENDING ({pendingSongs.length}) / 审核暂存表 ]
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('records')}
                style={{ color: activeTab === 'records' ? themeColor : 'inherit' }}
                className={`px-4 py-2 border border-current/20 cursor-pointer ${activeTab === 'records' ? 'bg-current/10 font-bold' : 'opacity-60'}`}
              >
                [ 03. RECORDS / 数据总览与删除 ]
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                style={{ color: activeTab === 'comments' ? themeColor : 'inherit' }}
                className={`px-4 py-2 border border-current/20 cursor-pointer ${activeTab === 'comments' ? 'bg-current/10 font-bold' : 'opacity-60'}`}
              >
                [ 04. COMMENTS ({commentsList.length}) / 评论管理 ]
              </button>
            </div>
            {/* 反馈消息 */}
            {message && (
              <div className="p-3 text-xs font-mono border border-current/30 bg-current/5">
                {message}
              </div>
            )}

            {loading && (
              <div className="p-4 text-xs font-mono opacity-60 text-center">
                [ LOADING SYSTEM DATA FROM CLOUDFLARE D1... ]
              </div>
            )}

            {/* ----------------- 选项卡 1：系统概况 ----------------- */}
            {activeTab === 'overview' && (
              <div
                style={dynamicShadow}
                className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-current/10 p-6 space-y-6 rounded-none transition-all duration-300"
              >
                <div className="font-mono text-xs font-bold tracking-wider border-b border-current/10 pb-2">
                  [ SYSTEM STATUS & CACHE MANAGEMENT / 系统运行状态与缓存控制 ]
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                  <div className="p-4 border border-current/10 bg-current/5 space-y-2">
                    <span className="opacity-60 block text-[10px]">DATABASE BINDING (CLOUDFLARE D1)</span>
                    <span className="font-bold text-emerald-400">env.DB (yorushika-site)</span>
                  </div>
                  <div className="p-4 border border-current/10 bg-current/5 space-y-2">
                    <span className="opacity-60 block text-[10px]">FRAMEWORK & RUNTIME</span>
                    <span className="font-bold">Next.js Edge Pages / Worker</span>
                  </div>
                  <div className="p-4 border border-current/10 bg-current/5 space-y-2">
                    <span className="opacity-60 block text-[10px]">TOTAL ALBUMS LOADED</span>
                    <span className="font-bold">{albumsList.length} ALBUMS</span>
                  </div>
                  <div className="p-4 border border-current/10 bg-current/5 space-y-2">
                    <span className="opacity-60 block text-[10px]">TOTAL COMMENTS / THREADS</span>
                    <span className="font-bold">{commentsList.length} THREADS</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-current/10 flex flex-wrap items-center justify-between gap-3 font-mono">
                  <span className="text-[10px] opacity-70">
                    DEFAULT CONTRIBUTOR SIGNATURE: <strong className="font-bold">UMI1220</strong>
                  </span>
                  <button
                    type="button"
                    onClick={fetchAllAdminData}
                    style={{ color: themeColor }}
                    className="px-4 py-2 text-xs font-bold border border-current/40 hover:bg-current/10 cursor-pointer"
                  >
                    [ FORCE REFRESH SYSTEM CACHE / 刷新数据缓存 ]
                  </button>
                </div>
              </div>
            )}

            {/* ----------------- 选项卡 2：审核暂存表 ----------------- */}
            {activeTab === 'pending' && (
              <div
                style={dynamicShadow}
                className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-current/10 p-6 space-y-6 rounded-none transition-all duration-300"
              >
                <div className="font-mono text-xs font-bold tracking-wider border-b border-current/10 pb-2">
                  [ PENDING SONGS AUDIT STAGING / 歌曲与专辑审核暂存表 ]
                </div>

                {pendingSongs.length === 0 ? (
                  <div className="text-xs font-mono opacity-60 py-8 text-center">
                    [ NO PENDING SUBMISSIONS WAITING FOR AUDIT / 暂无待审核内容 ]
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingSongs.map((item) => (
                      <div key={item.id} className="p-4 border border-current/20 bg-current/5 font-mono text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <div className="font-bold text-sm">
                            [{item.title}] <span className="text-[10px] opacity-60">ID: {item.id}</span>
                          </div>
                          <div className="text-[10px] opacity-70 space-x-3">
                            <span>ARTIST: {item.artist}</span>
                            <span>SUBMITTER: {item.submitter_email || item.contributor || 'UNKNOWN'}</span>
                            <span>TIME: {item.created_at}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => handleAuditAction(item.id, 'approve')}
                            className="px-3 py-1.5 text-xs font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30 cursor-pointer"
                          >
                            [ APPROVE / 通过 ]
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAuditAction(item.id, 'reject')}
                            className="px-3 py-1.5 text-xs font-bold bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600/30 cursor-pointer"
                          >
                            [ REJECT / 拒绝 ]
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ----------------- 选项卡 3：数据总览与删除 ----------------- */}
            {activeTab === 'records' && (
              <div
                style={dynamicShadow}
                className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-current/10 p-6 space-y-6 rounded-none transition-all duration-300"
              >
                <div className="font-mono text-xs font-bold tracking-wider border-b border-current/10 pb-2">
                  [ DATABASE RECORDS MANAGEMENT / 正式数据清理与管理 ]
                </div>

                <div className="space-y-4">
                  <h3 className="font-mono text-xs font-bold opacity-80">[ SONGS LIST / 已录入歌曲档案 ]</h3>
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {songsList.map((song) => (
                      <div key={song.id} className="p-3 border border-current/10 bg-current/5 font-mono text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold">[{song.title}]</span>
                          <span className="text-[10px] opacity-60 ml-2">ALBUM ID: {song.album_id}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord('song', song.id)}
                          className="px-2.5 py-1 text-[10px] text-red-400 border border-red-500/30 hover:bg-red-500/10 cursor-pointer"
                        >
                          [ DELETE ]
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- 选项卡 4：评论与回复管理 ----------------- */}
            {activeTab === 'comments' && (
              <div
                style={dynamicShadow}
                className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-current/10 p-6 space-y-6 rounded-none transition-all duration-300"
              >
                <div className="font-mono text-xs font-bold tracking-wider border-b border-current/10 pb-2">
                  [ COMMENTS & THREADS MODERATION / 听众评论管理 ]
                </div>

                {commentsList.length === 0 ? (
                  <div className="text-xs font-mono opacity-60 py-8 text-center">
                    [ NO COMMENTS FOUND IN DATABASE / 暂无评论档案 ]
                  </div>
                ) : (
                  <div className="space-y-3">
                    {commentsList.map((comment) => (
                      <div key={comment.id} className="p-4 border border-current/10 bg-current/5 font-mono text-xs flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="font-bold">
                            {comment.nickname} <span className="text-[10px] opacity-60">({comment.created_at})</span>
                          </div>
                          <p className="text-xs font-serif opacity-90">{comment.content}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord('comment', comment.id)}
                          className="px-2.5 py-1 text-[10px] text-red-400 border border-red-500/30 hover:bg-red-500/10 cursor-pointer shrink-0"
                        >
                          [ DELETE ]
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>
    </Layout>
  );
}
