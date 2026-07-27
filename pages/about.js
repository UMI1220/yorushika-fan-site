import React, { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

export default function About() {
  // 弹窗状态：null | 'feedback' | 'apply' | 'login'
  const [activeModal, setActiveModal] = useState(null);

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

  // 1. 提交反馈
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackContent.trim()) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from('feedback').insert([
        {
          type: feedbackType,
          content: feedbackContent.trim(),
          contact: feedbackContact.trim() || '匿名',
        },
      ]);
      if (error) throw error;

      setMsg({ type: 'success', text: '反馈已成功提交！感谢您对小站环境的维护。' });
      setFeedbackContent('');
      setFeedbackContact('');
      setTimeout(() => {
        setActiveModal(null);
        setMsg({ type: '', text: '' });
      }, 2000);
    } catch (err) {
      setMsg({ type: 'error', text: '提交失败，请稍后再试' });
    } finally {
      setSubmitting(false);
    }
  };

  // 2. 提交加入管理员申请
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyNickname.trim() || !applyEmail.trim() || !applyReason.trim()) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from('admin_applications').insert([
        {
          nickname: applyNickname.trim(),
          email: applyEmail.trim(),
          reason: applyReason.trim(),
        },
      ]);
      if (error) throw error;

      setMsg({
        type: 'success',
        text: '申请已提交！超级管理员审核通过后，初始密码与管理群号将通过电邮发送至您的邮箱。',
      });
      setApplyNickname('');
      setApplyEmail('');
      setApplyReason('');
      setTimeout(() => {
        setActiveModal(null);
        setMsg({ type: '', text: '' });
      }, 3000);
    } catch (err) {
      setMsg({ type: 'error', text: '提交申请失败，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  };

  // 3. 管理员后台登录跳转
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!loginPass.trim()) return;

    try {
      setSubmitting(true);
      // 验证超级管理员或普通管理员密码
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('password', loginPass.trim())
        .single();

      if (error || !data) {
        setMsg({ type: 'error', text: '密码错误，无法进入后台' });
        return;
      }

      // 登录凭证写入 sessionStorage 储存
      sessionStorage.setItem('admin_session', JSON.stringify(data));
      window.location.href = '/admin';
    } catch (err) {
      setMsg({ type: 'error', text: '校验失败，请检查密码' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12 sm:py-20">
        
        {/* 头部标题区域 */}
        <div className="text-center mb-16">
          <h1 className="text-2xl sm:text-3xl font-light text-zinc-900 tracking-[0.25em] font-serif mb-3">
            关于本站与构想
          </h1>
          <p className="text-xs text-zinc-400 tracking-[0.3em] uppercase font-mono">
            ABOUT YORUSHIKA FAN COLLECTION
          </p>
          <div className="w-12 h-[1px] bg-[#a5c9ca] mx-auto mt-6"></div>
        </div>

        {/* 板块 1：建站目的 */}
        <section className="bg-white rounded-2xl p-8 sm:p-12 border border-zinc-100 shadow-sm mb-10 transition hover:shadow-md">
          <div className="flex items-center space-x-3 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#a5c9ca]"></span>
            <h2 className="text-sm font-semibold tracking-widest text-zinc-800 uppercase font-mono">
              01. 建站目的 (PURPOSE)
            </h2>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed font-light mb-4">
            这里是属于 <span className="text-zinc-900 font-medium">Yorushika（ヨルシカ）</span> 乐迷的私密而纯粹的角落。
            n-buna 笔下构建的文学世界、suis 穿透人心的歌声，以及那些藏在夏草、雨滴、航海与盗作故事里的感动，需要有一个地方被安放。
          </p>
          <p className="text-sm text-zinc-600 leading-relaxed font-light">
            我们希望搭建一个没有繁杂商业喧嚣、回归音乐与文字本身的聚集地——在这里可以翻阅电子刊物、欣赏同人插画、沉浸于云端音符，让同好们能够静静地分享对乐队的喜爱。
          </p>
        </section>

        {/* 板块 2：技术框架 */}
        <section className="bg-white rounded-2xl p-8 sm:p-12 border border-zinc-100 shadow-sm mb-10 transition hover:shadow-md">
          <div className="flex items-center space-x-3 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#a5c9ca]"></span>
            <h2 className="text-sm font-semibold tracking-widest text-zinc-800 uppercase font-mono">
              02. 技术框架 (TECHNOLOGY)
            </h2>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed font-light mb-6">
            本站采用现代化的前端与轻量化后端架构，追求极致的加载速度与优雅的日系视觉体验：
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-[#fafafa] p-4 rounded-xl border border-zinc-100">
              <span className="text-[#a5c9ca] font-bold block mb-1">Frontend Framework</span>
              <span className="text-zinc-700">Next.js (Pages Router) + React</span>
            </div>
            <div className="bg-[#fafafa] p-4 rounded-xl border border-zinc-100">
              <span className="text-[#a5c9ca] font-bold block mb-1">Styling & Design</span>
              <span className="text-zinc-700">Tailwind CSS (Custom Literary UI)</span>
            </div>
            <div className="bg-[#fafafa] p-4 rounded-xl border border-zinc-100">
              <span className="text-[#a5c9ca] font-bold block mb-1">Database & API</span>
              <span className="text-zinc-700">Supabase Cloud PostgreSQL</span>
            </div>
            <div className="bg-[#fafafa] p-4 rounded-xl border border-zinc-100">
              <span className="text-[#a5c9ca] font-bold block mb-1">Hosting & Storage</span>
              <span className="text-zinc-700">Vercel / Cloudflare Pages + Buckets</span>
            </div>
          </div>
        </section>

        {/* 板块 3：赞助与维护 */}
        <section className="bg-white rounded-2xl p-8 sm:p-12 border border-zinc-100 shadow-sm mb-10 transition hover:shadow-md">
          <div className="flex items-center space-x-3 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#a5c9ca]"></span>
            <h2 className="text-sm font-semibold tracking-widest text-zinc-800 uppercase font-mono">
              03. 赞助与维护 (SPONSORSHIP)
            </h2>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed font-light mb-6">
            为了让国内同好能够稳定、快速地访问本站，我们需要长期支付国内优化域名及相关云服务的续费费用。如果您喜欢这个站点，并愿意为它的日常维护和域名开销提供一点支持，可以通过下方方式进行赞助。
          </p>
          
          <div className="bg-[#fafafa] p-6 rounded-xl border border-zinc-100 text-center flex flex-col items-center justify-center">
            <p className="text-xs text-zinc-500 font-mono mb-4">
              ☕ 每一份支持，都是这个夏日故事继续延续的动力。
            </p>
            <div className="w-40 h-40 bg-white p-2 rounded-lg border border-zinc-200 shadow-sm flex items-center justify-center mb-3 overflow-hidden">
              <img 
                src="/alipay-qr.png" 
                alt="Sponsor QR Code" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">感谢您的每一份心意</span>
          </div>
        </section>

        {/* 新增板块 4：社区互动与管理 (COMMUNITY & ADMIN) */}
        <section className="bg-white rounded-2xl p-8 sm:p-12 border border-zinc-100 shadow-sm transition hover:shadow-md space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#88abac]"></span>
            <h2 className="text-sm font-semibold tracking-widest text-zinc-800 uppercase font-mono">
              04. 社区互动与管理 (COMMUNITY & ADMIN)
            </h2>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed font-light">
            我们致力于维护一个干净、温馨的夜鹿粉丝讨论环境。如果你遇到了不良信息、有建设性意见，或者想成为团队一员共同守护小站，欢迎随时参与。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* 1. 意见/举报入口 */}
            <button
              onClick={() => { setActiveModal('feedback'); setMsg({ type: '', text: '' }); }}
              className="p-5 rounded-xl border border-zinc-100 bg-[#fafafa] hover:bg-sky-50/50 hover:border-[#88abac]/40 transition text-left space-y-1.5 group"
            >
              <div className="text-lg">📢</div>
              <div className="text-xs font-serif text-zinc-800 font-medium group-hover:text-[#88abac]">
                反馈与举报不良信息
              </div>
              <div className="text-[11px] text-zinc-400 font-light">
                提交违规内容处理与建议
              </div>
            </button>

            {/* 2. 申请加入管理员团队 */}
            <button
              onClick={() => { setActiveModal('apply'); setMsg({ type: '', text: '' }); }}
              className="p-5 rounded-xl border border-zinc-100 bg-[#fafafa] hover:bg-sky-50/50 hover:border-[#88abac]/40 transition text-left space-y-1.5 group"
            >
              <div className="text-lg">✉️</div>
              <div className="text-xs font-serif text-zinc-800 font-medium group-hover:text-[#88abac]">
                申请加入管理团队
              </div>
              <div className="text-[11px] text-zinc-400 font-light">
                填写入站申请书并接收随机口令
              </div>
            </button>

            {/* 3. 后台管理入口 */}
            <button
              onClick={() => { setActiveModal('login'); setMsg({ type: '', text: '' }); }}
              className="p-5 rounded-xl border border-zinc-100 bg-[#fafafa] hover:bg-sky-50/50 hover:border-[#88abac]/40 transition text-left space-y-1.5 group"
            >
              <div className="text-lg">🔐</div>
              <div className="text-xs font-serif text-zinc-800 font-medium group-hover:text-[#88abac]">
                后台管理入口
              </div>
              <div className="text-[11px] text-zinc-400 font-light">
                管理员口令验证登录
              </div>
            </button>
          </div>
        </section>

        {/* 返回首页 */}
        <div className="text-center mt-12">
          <Link 
            href="/" 
            className="inline-block px-8 py-3 bg-[#a5c9ca] hover:bg-[#94b8b9] text-white text-xs font-mono tracking-widest rounded-full transition shadow-sm"
          >
            ← 返回首页 INDEX
          </Link>
        </div>

      </div>

      {/* 弹窗区域 */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-xl relative border border-zinc-100">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 text-sm"
            >
              ✕
            </button>

            {/* 提示信息 */}
            {msg.text && (
              <div className={`p-3 rounded-xl mb-4 text-xs ${
                msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}>
                {msg.text}
              </div>
            )}

            {/* Modal 1: 反馈/举报 */}
            {activeModal === 'feedback' && (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <h3 className="text-lg font-serif text-zinc-800 tracking-wider">📢 反馈与举报不良信息</h3>
                <div>
                  <label className="block text-xs font-serif text-zinc-600 mb-1">反馈类型</label>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none"
                  >
                    <option value="report">🚨 举报不良/违规内容</option>
                    <option value="suggestion">💡 小站建言与改进意见</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-serif text-zinc-600 mb-1">内容描述 *</label>
                  <textarea
                    rows={4}
                    placeholder="请详细说明您遇到的违规内容或建议..."
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif text-zinc-600 mb-1">联系方式 (选填)</label>
                  <input
                    type="text"
                    placeholder="邮箱或 QQ，方便管理员与您回复"
                    value={feedbackContact}
                    onChange={(e) => setFeedbackContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#88abac] text-white text-xs rounded-xl tracking-widest hover:bg-[#789b9c] transition"
                >
                  {submitting ? '提交中...' : '提交反馈 / SUBMIT'}
                </button>
              </form>
            )}

            {/* Modal 2: 申请加入管理团队 */}
            {activeModal === 'apply' && (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                <h3 className="text-lg font-serif text-zinc-800 tracking-wider">✉️ 申请加入管理员团队</h3>
                <p className="text-[11px] text-zinc-400">
                  审核通过后，初始管理口令及管理群号（1090225142）将自动发送至您的邮箱。
                </p>

                <div>
                  <label className="block text-xs font-serif text-zinc-600 mb-1">鹿友昵称 *</label>
                  <input
                    type="text"
                    placeholder="如：n-buna粉丝"
                    value={applyNickname}
                    onChange={(e) => setApplyNickname(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif text-zinc-600 mb-1">E-mail 邮箱 *</label>
                  <input
                    type="email"
                    placeholder="用于接收口令与群号通知"
                    value={applyEmail}
                    onChange={(e) => setApplyEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-serif text-zinc-600 mb-1">申请书 / 入站动机 *</label>
                  <textarea
                    rows={4}
                    placeholder="请分享您的管理意愿、平时对夜鹿的了解或管理经验..."
                    value={applyReason}
                    onChange={(e) => setApplyReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#88abac] text-white text-xs rounded-xl tracking-widest hover:bg-[#789b9c] transition"
                >
                  {submitting ? '提交申请中...' : '提交申请书 / APPLY'}
                </button>
              </form>
            )}

            {/* Modal 3: 管理员登录 */}
            {activeModal === 'login' && (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <h3 className="text-lg font-serif text-zinc-800 tracking-wider">🔐 后台管理登录</h3>
                <p className="text-[11px] text-zinc-400">
                  请输入超级管理员密码或发放的 6 位临时管理口令。
                </p>

                <div>
                  <label className="block text-xs font-serif text-zinc-600 mb-1">管理口令 / Password *</label>
                  <input
                    type="password"
                    placeholder="请输入管理密码..."
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-[#88abac] text-white text-xs rounded-xl tracking-widest hover:bg-[#789b9c] transition"
                >
                  {submitting ? '验证中...' : '登录后台 / ENTER ADMIN'}
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </Layout>
  );
}