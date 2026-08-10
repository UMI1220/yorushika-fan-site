import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAudio } from '../components/Layout';

export default function AdminPage() {
  const { themeColor, theme } = useAudio();

  // 1. 登录鉴权状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // 2. 数据状态
  const [activeTab, setActiveTab] = useState('tracks'); // 'tracks' | 'comments'
  const [tracks, setTracks] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  // 检查 localStorage 登录持久化
  useEffect(() => {
    const savedAuth = localStorage.getItem('yorushika_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      fetchAdminData();
    }
  }, []);

  // 登录验证 (密码: UMI1220)
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'UMI1220') {
      setIsAuthenticated(true);
      setAuthError(false);
      localStorage.setItem('yorushika_admin_auth', 'true');
      fetchAdminData();
    } else {
      setAuthError(true);
    }
  };

  // 退出登录
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('yorushika_admin_auth');
  };

  // 获取后台数据
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. 获取全量音源列表
      const resAlbums = await fetch('/api/albums');
      const dataAlbums = await resAlbums.json();
      if (dataAlbums.success && dataAlbums.albums) {
        // 简单聚合前几个专辑的曲目
        const trackRes = await fetch('/api/tracks?albumId=1');
        const trackData = await trackRes.json();
        if (trackData.tracks) setTracks(trackData.tracks);
      }

      // 2. 获取评论列表
      const resComments = await fetch('/api/comments?targetId=global');
      const dataComments = await resComments.json();
      if (dataComments.comments) setComments(dataComments.comments);
    } catch (err) {
      console.error('获取管理后台数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 未登录状态：密码输入界面
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 font-mono text-xs">
        <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-current/10 p-8 max-w-sm w-full space-y-6 shadow-2xl">
          <div className="space-y-1 border-b border-current/10 pb-4">
            <p className="font-bold text-sm tracking-widest">[ ADMIN AUTHENTICATION ]</p>
            <p className="text-[10px] opacity-60">ADMINISTRATOR ACCESS REQUIRED</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] opacity-60">[ PASSWORD / 密码 ]</label>
              <input
                type="password"
                placeholder="ENTER ADMIN PASSWORD"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-transparent border-b border-current/30 p-2 outline-none text-xs font-mono"
                required
              />
            </div>

            {authError && (
              <p className="text-red-500 text-[10px] font-bold">[ ERROR: INVALID PASSWORD ]</p>
            )}

            <button
              type="submit"
              style={{ backgroundColor: themeColor }}
              className="w-full py-2.5 text-zinc-950 font-bold tracking-widest shadow-sm"
            >
              [ LOGIN / 登录 ]
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link href="/" className="opacity-50 hover:opacity-100 text-[10px]">
              [ &lt; RETURN TO INDEX ]
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 已登录状态：管理后台界面
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-8 px-4 max-w-5xl mx-auto font-mono text-xs">
      
      {/* 顶部控制栏 */}
      <div className="flex justify-between items-center border-b border-current/10 pb-4 mb-6">
        <div>
          <h1 className="font-bold text-sm tracking-widest">[ ADMIN DASHBOARD ]</h1>
          <p className="text-[10px] opacity-60">SYSTEM STATUS: AUTHORIZED (UMI1220)</p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={fetchAdminData}
            className="opacity-70 hover:opacity-100"
          >
            [ REFRESH ]
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="text-red-500 font-bold hover:underline"
          >
            [ LOGOUT ]
          </button>
        </div>
      </div>

      {/* 板块选项卡切换 */}
      <div className="flex space-x-6 border-b border-current/10 pb-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('tracks')}
          className={activeTab === 'tracks' ? 'font-bold underline' : 'opacity-60'}
        >
          01. RESOURCE AUDIT ({tracks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('comments')}
          className={activeTab === 'comments' ? 'font-bold underline' : 'opacity-60'}
        >
          02. COMMENTS MANAGEMENT ({comments.length})
        </button>
      </div>

      {/* 主数据列表 */}
      {loading ? (
        <p className="opacity-50 text-center py-12">[ LOADING DATABASE... ]</p>
      ) : (
        <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-current/10 p-6 shadow-xl">
          
          {/* 1. 资源/音源审核管理 */}
          {activeTab === 'tracks' && (
            <div className="space-y-4">
              <p className="font-bold opacity-60 border-b border-current/10 pb-2">
                [ TRACK & RESOURCE LIST ]
              </p>
              {tracks.length === 0 ? (
                <p className="opacity-50 py-6 text-center">NO SUBMISSIONS TO AUDIT.</p>
              ) : (
                <div className="space-y-2">
                  {tracks.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex justify-between items-center p-3 border border-current/10 hover:bg-current/5"
                    >
                      <div className="space-y-1">
                        <p className="font-bold">{item.title || item.name}</p>
                        <p className="text-[10px] opacity-60">
                          CONTRIBUTOR: {item.contributor_email || 'ADMIN'} • STATUS: {item.status || 'APPROVED'}
                        </p>
                      </div>

                      <div className="flex space-x-3 text-[10px]">
                        <button type="button" style={{ color: themeColor }} className="font-bold hover:underline">
                          [ APPROVE ]
                        </button>
                        <button type="button" className="text-red-500 font-bold hover:underline">
                          [ DELETE ]
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. 评论审查管理 */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <p className="font-bold opacity-60 border-b border-current/10 pb-2">
                [ USER COMMENTS LIST ]
              </p>
              {comments.length === 0 ? (
                <p className="opacity-50 py-6 text-center">NO COMMENTS FOUND.</p>
              ) : (
                <div className="space-y-2">
                  {comments.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex justify-between items-start p-3 border border-current/10 hover:bg-current/5"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex space-x-2 text-[10px] opacity-60">
                          <span className="font-bold text-current">{item.nickname || 'ANONYMOUS'}</span>
                          <span>({item.email || 'NO EMAIL'})</span>
                          <span>• {item.created_at || 'RECENT'}</span>
                        </div>
                        <p className="font-serif text-xs opacity-90">{item.content}</p>
                      </div>

                      <button type="button" className="text-red-500 font-bold text-[10px] hover:underline">
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
  );
}
