import React, { useState, useEffect } from 'react';
import { useAudio } from '../components/Layout';

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

export default function AdminPage() {
  const { theme, themeColor } = useAudio();

  // 1. 管理员鉴权状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState(null);

  // 2. 后台 Tab 分页: 'audit' | 'music' | 'comments' | 'system'
  const [activeTab, setActiveTab] = useState('audit');

  // 3. 数据集状态
  const [auditQueue, setAuditQueue] = useState([]);
  const [commentsList, setCommentsList] = useState([]);
  const [systemStatus, setSystemStatus] = useState({ d1: 'ONLINE', cdn: 'ONLINE', storage: 'NORMAL' });

  // 4. 单元素在线预览状态
  const [previewAudioUrl, setPreviewAudioUrl] = useState(null);
  const [previewCoverUrl, setPreviewCoverUrl] = useState(null);

  // 5. 评论强删弹窗或状态
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // ------------------- 1. 鉴权逻辑 -------------------
  useEffect(() => {
    const savedToken = sessionStorage.getItem('admin_token');
    if (savedToken) {
      setIsAuthenticated(true);
      fetchInitialAdminData();
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // 匹配管理员密码 UMI1220
    if (passkeyInput === 'UMI1220') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_token', 'TOKEN_UMI1220_AUTHENTICATED');
      setAuthError(null);
      fetchInitialAdminData();
    } else {
      setAuthError('「 PASSKEY INVALID / 密钥错误，拒绝访问 」');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  };

  // ------------------- 2. 拉取后台数据 -------------------
  const fetchInitialAdminData = async () => {
    try {
      // 拉取待审核提交列表
      const auditRes = await fetch('/api/admin/audit');
      const auditJson = await auditRes.json();
      if (auditJson.success) setAuditQueue(auditJson.data || []);

      // 拉取全站评论列表 (用于管理员强删)
      const commentsRes = await fetch('/api/admin/comments');
      const commentsJson = await commentsRes.json();
      if (commentsJson.success) setCommentsList(commentsJson.data || []);
    } catch (err) {
      console.error('Fetch Admin Data Error:', err);
    }
  };

  // ------------------- 3. 单元素批准 / 驳回处理 -------------------
  const handleSingleElementAction = async (submissionId, elementType, action) => {
    try {
      const res = await fetch('/api/admin/audit/element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          element_type: elementType, // 'audio' | 'cover' | 'lyric' | 'mv'
          action, // 'approve' | 'reject'
        }),
      });

      const json = await res.json();
      if (json.success) {
        // 更新本地队列 UI 状态
        setAuditQueue((prev) =>
          prev.map((item) => {
            if (item.id === submissionId) {
              const updatedStatus = { ...item.element_status, [elementType]: action };
              return { ...item, element_status: updatedStatus };
            }
            return item;
          })
        );
      }
    } catch (err) {
      console.error('Single Element Action Error:', err);
    }
  };

  // ------------------- 4. 管理员强删评论 (无需密码) -------------------
  const handleForceDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`/api/admin/comments?id=${commentId}&force=true`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setCommentsList((prev) => prev.filter((c) => c.id !== commentId));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Force Delete Comment Error:', err);
    }
  };

  const dynamicShadow = getDynamicShadowStyle(theme);

  // ------------------- A. 未登录鉴权界面 -------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 font-serif text-current select-none">
        <form
          onSubmit={handleLogin}
          style={dynamicShadow}
          className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-current/10 p-8 max-w-sm w-full space-y-6 rounded-none transition-all duration-300"
        >
          <div className="border-b border-current/10 pb-3 font-mono text-xs">
            <p className="font-bold tracking-widest">[ ADMIN AUTHENTICATION ]</p>
            <p className="text-[10px] opacity-60 mt-1">ヨルシカ 档案馆管理员控制台身份验证</p>
          </div>

          {authError && (
            <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-mono">
              {authError}
            </div>
          )}

          <div className="space-y-2 font-mono text-xs">
            <label className="block text-[10px] opacity-60">PASSKEY / 管理员密钥</label>
            <input
              type="password"
              required
              placeholder="请输入管理员密码..."
              value={passkeyInput}
              onChange={(e) => setPasskeyInput(e.target.value)}
              className="w-full bg-transparent border border-current/20 p-2 focus:outline-none focus:border-current"
            />
          </div>

          <button
            type="submit"
            style={{ backgroundColor: themeColor }}
            className="w-full py-2.5 text-zinc-950 font-mono font-bold text-xs hover:opacity-90 transition-opacity"
          >
            [ LOGIN / 解锁控制台 ]
          </button>
        </form>
      </div>
    );
  }

  // ------------------- B. 已登录后台管理主界面 -------------------
  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-4 py-8 max-w-6xl mx-auto font-serif text-current select-none space-y-8">
      
      {/* 顶部控制台 Bar */}
      <div className="border-b border-current/10 pb-4 flex flex-col sm:flex-row justify-between sm:items-end font-mono text-xs gap-4">
        <div>
          <h1 className="text-base font-bold tracking-widest">[ CONTROL CENTER / 管理员控制台 ]</h1>
          <p className="text-[10px] opacity-60 mt-0.5">YORUSHIKA ARCHIVE ADMIN PANEL</p>
        </div>

        <div className="flex items-center space-x-6">
          <div className="space-x-4">
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`hover:underline ${activeTab === 'audit' ? 'font-bold' : 'opacity-60'}`}
              style={{ color: activeTab === 'audit' ? themeColor : undefined }}
            >
              [ 01. AUDIT ]
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`hover:underline ${activeTab === 'comments' ? 'font-bold' : 'opacity-60'}`}
              style={{ color: activeTab === 'comments' ? themeColor : undefined }}
            >
              [ 02. COMMENTS ]
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('system')}
              className={`hover:underline ${activeTab === 'system' ? 'font-bold' : 'opacity-60'}`}
              style={{ color: activeTab === 'system' ? themeColor : undefined }}
            >
              [ 03. SYSTEM ]
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="opacity-50 hover:opacity-100 hover:underline"
          >
            [ EXIT ]
          </button>
        </div>
      </div>

      {/* 音频与图片在线预览 Drawer / Float Container */}
      {(previewAudioUrl || previewCoverUrl) && (
        <div
          style={dynamicShadow}
          className="p-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-current/10 font-mono text-xs space-y-3 animate-in fade-in duration-200"
        >
          <div className="flex justify-between items-center border-b border-current/10 pb-2">
            <span className="font-bold">[ LIVE PREVIEW / 在线单元素预览 ]</span>
            <button
              type="button"
              onClick={() => { setPreviewAudioUrl(null); setPreviewCoverUrl(null); }}
              className="hover:underline font-bold"
            >
              [ CLOSE PREVIEW ]
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {previewCoverUrl && (
              <div className="w-28 h-28 border border-current/20 relative group overflow-hidden">
                <img src={previewCoverUrl} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white">
                  1:1 TILE
                </div>
              </div>
            )}

            {previewAudioUrl && (
              <div className="flex-1 w-full space-y-1">
                <span className="text-[10px] opacity-60">PREVIEWING AUDIO STREAM:</span>
                <audio controls src={previewAudioUrl} className="w-full h-8" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------- Tab 01. 待审核队列 (包含单元素批准逻辑) ------------------- */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="font-mono text-xs font-bold tracking-wider border-b border-current/10 pb-2 flex justify-between">
            <span>[ PENDING SUBMISSIONS / 待审核提交队列 ]</span>
            <span>{auditQueue.length} ITEMS</span>
          </div>

          {auditQueue.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs opacity-40 border border-current/10">
              [ NO PENDING SUBMISSIONS / 暂无待审核内容 ]
            </div>
          ) : (
            <div className="space-y-4">
              {auditQueue.map((item) => {
                const elementStatus = item.element_status || {};

                return (
                  <div
                    key={item.id}
                    style={dynamicShadow}
                    className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-current/10 p-6 space-y-4 font-mono text-xs rounded-none transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-current/10 pb-3 gap-2">
                      <div>
                        <span className="font-bold text-sm">
                          {item.type === 'album' ? `[ 新专辑: ${item.new_album?.title} ]` : `[ 曲目补充/修改: ${item.song_title || 'ID ' + item.song_id} ]`}
                        </span>
                        <span className="ml-3 text-[10px] opacity-60">
                          SUBMITTED BY: {item.contributor} &lt;{item.email}&gt;
                        </span>
                      </div>
                      <span className="text-[10px] opacity-40">{item.created_at}</span>
                    </div>

                    {/* 细化单元素展示与在线预览 & 单批准逻辑 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-serif text-xs">
                      
                      {/* 音频元素 */}
                      {item.audio_url && (
                        <div className="p-3 bg-current/5 border border-current/10 space-y-2 font-mono text-xs">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold">AUDIO STREAM (.MP3)</span>
                            <button
                              type="button"
                              onClick={() => setPreviewAudioUrl(item.audio_url)}
                              style={{ color: themeColor }}
                              className="hover:underline font-bold"
                            >
                              [ LISTEN PREVIEW / 在线试听 ]
                            </button>
                          </div>
                          <p className="text-[11px] truncate opacity-70">{item.audio_url}</p>
                          <div className="flex space-x-3 pt-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleSingleElementAction(item.id, 'audio', 'approve')}
                              className={`hover:underline font-bold ${elementStatus.audio === 'approve' ? 'underline opacity-100' : 'opacity-60'}`}
                              style={{ color: elementStatus.audio === 'approve' ? themeColor : undefined }}
                            >
                              [ APPROVE AUDIO ]
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSingleElementAction(item.id, 'audio', 'reject')}
                              className={`hover:underline font-bold ${elementStatus.audio === 'reject' ? 'text-red-500' : 'opacity-60'}`}
                            >
                              [ REJECT AUDIO ]
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 封面图片元素 */}
                      {item.cover_url && (
                        <div className="p-3 bg-current/5 border border-current/10 space-y-2 font-mono text-xs">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold">COVER IMAGE</span>
                            <button
                              type="button"
                              onClick={() => setPreviewCoverUrl(item.cover_url)}
                              style={{ color: themeColor }}
                              className="hover:underline font-bold"
                            >
                              [ VIEW TILE / 磁贴预览 ]
                            </button>
                          </div>
                          <p className="text-[11px] truncate opacity-70">{item.cover_url}</p>
                          <div className="flex space-x-3 pt-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleSingleElementAction(item.id, 'cover', 'approve')}
                              className={`hover:underline font-bold ${elementStatus.cover === 'approve' ? 'underline opacity-100' : 'opacity-60'}`}
                              style={{ color: elementStatus.cover === 'approve' ? themeColor : undefined }}
                            >
                              [ APPROVE COVER ]
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSingleElementAction(item.id, 'cover', 'reject')}
                              className={`hover:underline font-bold ${elementStatus.cover === 'reject' ? 'text-red-500' : 'opacity-60'}`}
                            >
                              [ REJECT COVER ]
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 歌词文本元素 */}
                      {item.lyric_content && (
                        <div className="col-span-1 md:col-span-2 p-3 bg-current/5 border border-current/10 space-y-2 font-mono text-xs">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold">LRC LYRICS CONTENT</span>
                            <span className="opacity-60">TEXT LENGTH: {item.lyric_content.length} CHARS</span>
                          </div>
                          <pre className="font-serif text-[11px] max-h-24 overflow-y-auto whitespace-pre-wrap opacity-80 border-t border-current/10 pt-2">
                            {item.lyric_content}
                          </pre>
                          <div className="flex space-x-3 pt-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleSingleElementAction(item.id, 'lyric', 'approve')}
                              className={`hover:underline font-bold ${elementStatus.lyric === 'approve' ? 'underline opacity-100' : 'opacity-60'}`}
                              style={{ color: elementStatus.lyric === 'approve' ? themeColor : undefined }}
                            >
                              [ APPROVE LYRICS ]
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSingleElementAction(item.id, 'lyric', 'reject')}
                              className={`hover:underline font-bold ${elementStatus.lyric === 'reject' ? 'text-red-500' : 'opacity-60'}`}
                            >
                              [ REJECT LYRICS ]
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------- Tab 02. 评论强删管理 ------------------- */}
      {activeTab === 'comments' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="font-bold tracking-wider border-b border-current/10 pb-2 flex justify-between">
            <span>[ ALL COMMENTS & REPLIES / 全站评论强删管理 ]</span>
            <span>{commentsList.length} TOTAL THREADS</span>
          </div>

          <div className="space-y-3">
            {commentsList.map((c) => (
              <div
                key={c.id}
                style={dynamicShadow}
                className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-4 border border-current/10 flex justify-between items-start gap-4 rounded-none transition-all duration-300"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-3 text-[10px] opacity-70">
                    <span className="font-bold">{c.nickname}</span>
                    <span>ID: {c.id}</span>
                    <span>SONG_ID: {c.song_id}</span>
                    <span>{c.created_at}</span>
                  </div>
                  <p className="font-serif text-xs opacity-90">{c.content}</p>
                </div>

                <div className="flex items-center space-x-2">
                  {deleteConfirmId === c.id ? (
                    <div className="flex items-center space-x-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleForceDeleteComment(c.id)}
                        className="text-red-500 font-bold hover:underline"
                      >
                        [ CONFIRM FORCE DELETE ]
                      </button>
                      <button
                        type="button"
          