import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function About() {
  const [activeModal, setActiveModal] = useState(null); // null | 'feedback' | 'apply' | 'login'

  // 表单状态
  const [feedbackType, setFeedbackType] = useState('report');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');

  const [applyNickname, setApplyNickname] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyReason, setApplyReason] = useState('');

  const [loginPass, setLoginPass] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // 1. 提交反馈/申诉
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackContent.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          content: feedbackContent.trim(),
          contact: feedbackContact.trim() || '匿名盗贼',
        }),
      });

      if (!res.ok) throw new Error('提交失败');

      setMsg({ type: 'success', text: '反馈已送达！感谢你对小站环境的维护。' });
      setFeedbackContent('');
      setFeedbackContact('');
      setTimeout(() => {
        setActiveModal(null);
        setMsg({ type: '', text: '' });
      }, 1800);
    } catch (err) {
      setMsg({ type: 'error', text: '提交失败，请稍后重试。' });
    } finally {
      setSubmitting(false);
    }
  };

  // 2. 申请成为贡献者 / 管理员
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyNickname.trim() || !applyEmail.trim() || !applyReason.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'apply_admin',
          content: `【管理员/贡献者申请】\n昵称: ${applyNickname}\n邮箱: ${applyEmail}\n申请理由: ${applyReason}`,
          contact: applyEmail,
        }),
      });

      if (!res.ok) throw new Error('提交失败');

      setMsg({ type: 'success', text: '申请书已寄出，超级管理员审核后将发送口令至你的邮箱。' });
      setApplyNickname('');
      setApplyEmail('');
      setApplyReason('');
      setTimeout(() => {
        setActiveModal(null);
        setMsg({ type: '', text: '' });
      }, 2000);
    } catch (err) {
      setMsg({ type: 'error', text: '提交失败，请稍后重试。' });
    } finally {
      setSubmitting(false);
    }
  };

  // 3. 后台管理登录
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!loginPass.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPass.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '暗号错误');
      }

      // 登录成功保存 Token 并跳转到 /admin
      localStorage.setItem('yorushika_admin_token', data.token);
      localStorage.setItem('yorushika_admin_role', data.role);
      window.location.href = '/admin';
    } catch (err) {
      setMsg({ type: 'error', text: err.message || '登录失败，暗号无效。' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>ABOUT / 关于 · ヨルシカ Fan Site</title>
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-8 text-zinc-200 font-serif leading-relaxed space-y-10">
        {/* 顶部标题区 */}
        <div className="border-b border-[#88abac]/20 pb-4">
          <span className="text-[10px] font-mono text-[#a5c9ca] tracking-widest block uppercase mb-1">
            ABOUT THE FAN SITE & CREDITS
          </span>
          <h1 className="text-2xl font-medium tracking-wide text-white">关于小站 · 音楽泥棒の庭</h1>
        </div>

        {/* 核心文案卡片 (符合 4.51.2 极简毛玻璃卡片风格) */}
        <div className="bg-zinc-900/60 backdrop-blur-md p-6 sm:p-8 rounded-none border border-white/5 space-y-4 text-xs sm:text-sm text-zinc-300">
          <p className="italic text-[#a5c9ca]">
            「僕らはただ、夏の間じゅうずっと、あの人の歌を盗み続けていた。」
          </p>
          <p>
            本站为日系乐团 <strong>ヨルシカ (Yorushika)</strong> 非官方同好粉丝站点，旨在记录 n-buna 与 suis 创作的所有作品、信件、歌词及其背后的故事。
          </p>
          <p>
            站内全量音源及封面资源均由 Cloudflare 全球 Edge 节点提供高速加载，所有歌曲双语歌词与自白书信均由社区粉丝共同补充维护。
          </p>
        </div>

        {/* 快捷操作区：三大按钮 (月光青配色的方块/圆角按钮) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => { setActiveModal('feedback'); setMsg({ type: '', text: '' }); }}
            className="p-4 bg-[#88abac]/10 hover:bg-[#88abac]/20 border border-[#88abac]/30 text-[#a5c9ca] text-xs font-mono tracking-wider transition text-center"
          >
            💬 反馈与违规申诉
          </button>
          <button
            onClick={() => { setActiveModal('apply'); setMsg({ type: '', text: '' }); }}
            className="p-4 bg-[#88abac]/10 hover:bg-[#88abac]/20 border border-[#88abac]/30 text-[#a5c9ca] text-xs font-mono tracking-wider transition text-center"
          >
            ✉️ 成为贡献者 / 申请口令
          </button>
          <button
            onClick={() => { setActiveModal('login'); setMsg({ type: '', text: '' }); }}
            className="p-4 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono tracking-wider transition text-center"
          >
            🔐 管理员登录
          </button>
        </div>

        {/* 弹窗 / Modal 层 */}
        {activeModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-zinc-900 border border-[#88abac]/30 w-full max-w-lg p-6 sm:p-8 text-zinc-200 font-serif relative space-y-5 shadow-2xl">
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white font-mono text-xs"
              >
                ✕ CLOSE
              </button>

              {msg.text && (
                <div className={`p-3 text-xs rounded border font-mono ${
                  msg.type === 'success' 
                    ? 'bg-[#88abac]/20 border-[#88abac] text-[#a5c9ca]' 
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}>
                  {msg.text}
                </div>
              )}

              {/* 弹窗 1: 反馈申诉 */}
              {activeModal === 'feedback' && (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <h3 className="text-base font-medium text-white tracking-wider border-b border-zinc-800 pb-2">
                    💬 站内意见反馈与违规申诉
                  </h3>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">反馈类型</label>
                    <select
                      value={feedbackType}
                      onChange={(e) => setFeedbackType(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-xs px-3 py-2 text-zinc-200 focus:outline-none"
                    >
                      <option value="report">举报不良评论 / 违规内容</option>
                      <option value="bug">播放器/页面 Bug 报告</option>
                      <option value="suggestion">功能优化建议</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">详细描述 *</label>
                    <textarea
                      rows={4}
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      placeholder="请详细说明问题页面或目标评论..."
                      className="w-full bg-zinc-800 border border-zinc-700 text-xs p-3 text-zinc-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">联系方式 (选填)</label>
                    <input
                      type="text"
                      placeholder="邮箱 / 昵称"
                      value={feedbackContact}
                      onChange={(e) => setFeedbackContact(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-xs px-3 py-2 text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-zinc-950 font-bold text-xs tracking-widest transition"
                  >
                    {submitting ? '发送中...' : '提交反馈 / SUBMIT'}
                  </button>
                </form>
              )}

              {/* 弹窗 2: 成为贡献者 */}
              {activeModal === 'apply' && (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <h3 className="text-base font-medium text-white tracking-wider border-b border-zinc-800 pb-2">
                    ✉️ 申请成为贡献者 / 临时管理员
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">你的昵称 *</label>
                      <input
                        type="text"
                        value={applyNickname}
                        onChange={(e) => setApplyNickname(e.target.value)}
                        placeholder="盗贼"
                        className="w-full bg-zinc-800 border border-zinc-700 text-xs px-3 py-2 text-zinc-200 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">你的邮箱 *</label>
                      <input
                        type="email"
                        value={applyEmail}
                        onChange={(e) => setApplyEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-zinc-800 border border-zinc-700 text-xs px-3 py-2 text-zinc-200 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">申请说明 / 能够贡献的内容 *</label>
                    <textarea
                      rows={3}
                      value={applyReason}
                      onChange={(e) => setApplyReason(e.target.value)}
                      placeholder="例：我可以协助整理并校对《盗作》专辑的中日LRC双语歌词..."
                      className="w-full bg-zinc-800 border border-zinc-700 text-xs p-3 text-zinc-200 focus:outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-zinc-950 font-bold text-xs tracking-widest transition"
                  >
                    {submitting ? '提交申请中...' : '寄出申请书 / SEND'}
                  </button>
                </form>
              )}

              {/* 弹窗 3: 管理员登录 */}
              {activeModal === 'login' && (
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <h3 className="text-base font-medium text-white tracking-wider border-b border-zinc-800 pb-2">
                    🔐 后台管理登录
                  </h3>
                  <p className="text-xs text-zinc-400">
                    请输入超级管理员暗号（UMI1220）或发放的 6 位临时管理口令。
                  </p>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">管理口令 / PASSWORD *</label>
                    <input
                      type="password"
                      placeholder="请输入管理暗号/口令..."
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-xs px-3 py-2 text-zinc-200 focus:outline-none font-mono"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-zinc-950 font-bold text-xs tracking-widest transition"
                  >
                    {submitting ? '验证暗号中...' : '验证并进入后台 / ENTER'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
