import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminRole, setAdminRole] = useState(''); // 'SUPER_ADMIN' | 'TEMP_ADMIN'
  const [activeTab, setActiveTab] = useState('submissions'); // 'submissions' | 'comments' | 'feedback' | 'codes'

  // 数据列表
  const [submissions, setSubmissions] = useState([]);
  const [comments, setComments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('yorushika_admin_token');
    const role = localStorage.getItem('yorushika_admin_role');
    if (token) {
      setIsAuthenticated(true);
      setAdminRole(role || 'TEMP_ADMIN');
      loadData('submissions');
    }
  }, []);

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('yorushika_admin_token');
    localStorage.removeItem('yorushika_admin_role');
    setIsAuthenticated(false);
    window.location.href = '/about';
  };

  // 加载后台模块数据
  const loadData = async (tab) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('yorushika_admin_token');
      const res = await fetch(`/api/admin/manage?action=list_${tab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (tab === 'submissions') setSubmissions(data.list || []);
      if (tab === 'comments') setComments(data.list || []);
      if (tab === 'feedback') setFeedbacks(data.list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 审核贡献操作 (批准/拒绝)
  const handleAuditSubmission = async (id, status) => {
    try {
      const token = localStorage.getItem('yorushika_admin_token');
      await fetch('/api/admin/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'audit_submission', id, status }),
      });
      loadData('submissions');
    } catch (err) {
      alert('操作失败');
    }
  };

  // 删除违规评论
  const handleDeleteComment = async (commentId) => {
    if (!confirm('确定删除此条评论及其附属回复吗？')) return;
    try {
      const token = localStorage.getItem('yorushika_admin_token');
      await fetch('/api/admin/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'delete_comment', commentId }),
      });
      loadData('comments');
    } catch (err) {
      alert('删除失败');
    }
  };

  // 生成 6 位临时管理口令 (仅限超级管理员 UMI1220)
  const handleGenerateCode = async () => {
    try {
      const token = localStorage.getItem('yorushika_admin_token');
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'generate_code' }),
      });
      const data = await res.json();
      if (data.code) {
        setGeneratedCode(data.code);
      }
    } catch (err) {
      alert('生成口令失败');
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-md mx-auto my-20 p-8 bg-zinc-900 border border-zinc-800 text-center font-serif space-y-4">
          <h2 className="text-lg text-white">🔒 权限受限</h2>
          <p className="text-xs text-zinc-400">你尚未登录或管理暗号已失效，请先前往关于页面登录。</p>
          <a
            href="/about"
            className="inline-block px-4 py-2 bg-[#88abac] text-zinc-950 font-bold text-xs uppercase tracking-wider"
          >
            前往登录页面
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>ADMIN / 后台控制台 · ヨルシカ Fan Site</title>
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-8 font-serif space-y-8 text-zinc-200">
        {/* 顶部身份标识与退出栏 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-800 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#88abac]/20 text-[#a5c9ca] border border-[#88abac]/40 uppercase">
                {adminRole === 'SUPER_ADMIN' ? '超级管理员 (UMI1220)' : '临时管理员'}
              </span>
              <span className="text-xs text-zinc-400 font-mono">yhb1220@outlook.com</span>
            </div>
            <h1 className="text-xl font-medium text-white mt-1">站内内容与贡献管理控制台</h1>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 border border-rose-900/50 text-rose-400 hover:bg-rose-950/30 text-xs font-mono transition"
          >
            LOGOUT / 退出登录
          </button>
        </div>

        {/* 标签页切换 */}
        <div className="flex border-b border-zinc-800 text-xs font-mono">
          <button
            onClick={() => { setActiveTab('submissions'); loadData('submissions'); }}
            className={`px-4 py-2.5 border-b-2 ${
              activeTab === 'submissions'
                ? 'border-[#88abac] text-[#a5c9ca] font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📥 贡献审核 ({submissions.length})
          </button>

          <button
            onClick={() => { setActiveTab('comments'); loadData('comments'); }}
            className={`px-4 py-2.5 border-b-2 ${
              activeTab === 'comments'
                ? 'border-[#88abac] text-[#a5c9ca] font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            💬 评论管控 ({comments.length})
          </button>

          <button
            onClick={() => { setActiveTab('feedback'); loadData('feedback'); }}
            className={`px-4 py-2.5 border-b-2 ${
              activeTab === 'feedback'
                ? 'border-[#88abac] text-[#a5c9ca] font-bold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ✉️ 反馈与申诉 ({feedbacks.length})
          </button>

          {adminRole === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActiveTab('codes')}
              className={`px-4 py-2.5 border-b-2 ${
                activeTab === 'codes'
                  ? 'border-[#88abac] text-[#a5c9ca] font-bold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              🔑 口令发放
            </button>
          )}
        </div>

        {/* 列表内容区域 */}
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-zinc-500">数据加载中...</div>
        ) : (
          <div>
            {/* 1. 贡献审核模块 */}
            {activeTab === 'submissions' && (
              <div className="space-y-4">
                {submissions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500 border border-zinc-800">
                    暂无待审核的歌曲/歌词贡献记录。
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-5 bg-zinc-900/80 border border-zinc-800 text-xs space-y-3"
                    >
                      <div className="flex justify-between items-center border-b border-zinc-800/60 pb-2">
                        <span className="font-mono text-[#a5c9ca] font-bold">
                          [{sub.mode === 'supplement' ? '补充新曲' : '修正已知'}] {sub.track_title}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          贡献者: {sub.contributor_email} · {sub.created_at}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300">
                        <div><strong className="text-zinc-500">音频:</strong> {sub.audio_url || '无'}</div>
                        <div><strong className="text-zinc-500">MV:</strong> {sub.mv_url || '无'}</div>
                        <div className="col-span-2"><strong className="text-zinc-500">日文歌词:</strong> {sub.lrc_ja ? '已提交' : '无'}</div>
                        <div className="col-span-2"><strong className="text-zinc-500">中文歌词:</strong> {sub.lrc_zh ? '已提交' : '无'}</div>
                        <div className="col-span-2 italic text-zinc-400"><strong className="text-zinc-500">备注:</strong> {sub.notes || '无'}</div>
                      </div>

                      {sub.status === 'pending' && (
                        <div className="flex gap-2 pt-2 border-t border-zinc-800/60">
                          <button
                            onClick={() => handleAuditSubmission(sub.id, 'approved')}
                            className="px-3 py-1 bg-[#88abac] text-zinc-950 font-bold text-[11px] tracking-wider"
                          >
                            ✓ 批准并上线
                          </button>
                          <button
                            onClick={() => handleAuditSubmission(sub.id, 'rejected')}
                            className="px-3 py-1 bg-zinc-800 hover:bg-rose-950/60 text-rose-300 border border-zinc-700 text-[11px]"
                          >
                            ✕ 拒绝
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. 评论管控模块 */}
            {activeTab === 'comments' && (
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500 border border-zinc-800">
                    暂无待处理的评论。
                  </div>
                ) : (
                  comments.map((cm) => (
                    <div key={cm.id} className="p-4 bg-zinc-900 border border-zinc-800 text-xs flex justify-between items-start">
                      <div className="space-y-1 pr-4">
                        <div className="font-mono text-[11px] text-zinc-400">
                          <strong className="text-[#a5c9ca]">{cm.nickname}</strong> · 目标: {cm.target_id} · {cm.created_at}
                        </div>
                        <p className="text-zinc-200 leading-relaxed">{cm.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(cm.id)}
                        className="px-2 py-1 bg-rose-950/50 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] font-mono whitespace-nowrap"
                      >
                        删除评论
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. 反馈与申诉模块 */}
            {activeTab === 'feedback' && (
              <div className="space-y-3">
                {feedbacks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500 border border-zinc-800">
                    暂无反馈留言。
                  </div>
                ) : (
                  feedbacks.map((fb) => (
                    <div key={fb.id} className="p-4 bg-zinc-900 border border-zinc-800 text-xs space-y-2">
                      <div className="flex justify-between font-mono text-[11px] text-zinc-400">
                        <span className="text-[#a5c9ca] font-bold">[{fb.type.toUpperCase()}]</span>
                        <span>联系人: {fb.contact} · {fb.created_at}</span>
                      </div>
                      <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">{fb.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. 6位临时口令生成模块 */}
            {activeTab === 'codes' && adminRole === 'SUPER_ADMIN' && (
              <div className="p-8 bg-zinc-900 border border-zinc-800 max-w-lg space-y-6 text-xs">
                <div>
                  <h3 className="text-sm text-white font-medium mb-1">🔑 临时管理口令生成器</h3>
                  <p className="text-zinc-400">
                    点击下方按钮可生成一个 6 位随机口令，有效期为 24 小时，可发放给普通贡献者登录管理后台。
                  </p>
                </div>

                <button
                  onClick={handleGenerateCode}
                  className="px-4 py-2.5 bg-[#88abac] text-zinc-950 font-bold text-xs uppercase tracking-widest hover:bg-[#789b9c] transition"
                >
                  生成 24 小时临时口令
                </button>

                {generatedCode && (
                  <div className="p-4 bg-zinc-950 border border-[#88abac]/40 space-y-1">
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">NEW ACCESS CODE</span>
                    <div className="text-2xl font-mono text-[#a5c9ca] font-bold tracking-widest">{generatedCode}</div>
                    <span className="text-[10px] text-zinc-400 block">把此口令通过邮件发给申请人即可。</span>
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
