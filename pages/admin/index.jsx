import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [adminSession, setAdminSession] = useState(null);
  const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' | 'applications' | 'content'
  const [loading, setLoading] = useState(true);

  // 数据列表
  const [feedbacks, setFeedbacks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [musicTracks, setMusicTracks] = useState([]);

  useEffect(() => {
    // 从 sessionStorage 读取登录凭证
    const saved = sessionStorage.getItem('admin_session');
    if (saved) {
      setAdminSession(JSON.parse(saved));
      loadAllAdminData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      // 1. 获取反馈
      const { data: fb } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
      setFeedbacks(fb || []);

      // 2. 获取申请
      const { data: apps } = await supabase.from('admin_applications').select('*').order('created_at', { ascending: false });
      setApplications(apps || []);

      // 3. 获取社区帖子
      const { data: posts } = await supabase.from('forum_posts').select('*').order('created_at', { ascending: false });
      setForumPosts(posts || []);

      // 4. 获取音乐
      const { data: music } = await supabase.from('music').select('*').order('created_at', { ascending: false });
      setMusicTracks(music || []);
    } catch (err) {
      console.error('加载后台数据异常:', err);
    } finally {
      setLoading(false);
    }
  };

  // 审核通过申请：自动生成 6 位随机密码，写入 admin_users 并发送/弹窗提示电邮信息
  const handleApproveApplication = async (app) => {
    const randomPassword = Math.floor(100000 + Math.random() * 900000).toString(); // 6位数字密码

    try {
      // 1. 写入 admin_users 表
      const { error: userErr } = await supabase.from('admin_users').insert([
        {
          nickname: app.nickname,
          email: app.email,
          password: randomPassword,
          role: 'admin',
        },
      ]);
      if (userErr) throw userErr;

      // 2. 更新申请表状态
      await supabase
        .from('admin_applications')
        .update({ status: 'approved', generated_pass: randomPassword })
        .eq('id', app.id);

      // 3. 调用后台 API 自动电邮至申请者
      try {
        await fetch('/api/send-admin-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: app.email,
            nickname: app.nickname,
            password: randomPassword,
            groupNo: '1090225142',
          }),
        });
      } catch (mailErr) {
        console.warn('邮件发送接口可配置选填:', mailErr);
      }

      alert(`✅ 已成功批准 ${app.nickname} 的申请！\n生成的6位管理密码为：${randomPassword}\n相关通知及管理群号(1090225142)已记录并触发电邮。`);
      loadAllAdminData();
    } catch (err) {
      alert(`批准失败: ${err.message}`);
    }
  };

  // 删除社区帖子
  const handleDeletePost = async (id) => {
    if (!confirm('确定要删除该违规帖子吗？')) return;
    await supabase.from('forum_posts').delete().eq('id', id);
    loadAllAdminData();
  };

  // 删除音乐
  const handleDeleteMusic = async (id) => {
    if (!confirm('确定要删除该音乐曲目吗？')) return;
    await supabase.from('music').delete().eq('id', id);
    loadAllAdminData();
  };

  // 辞职功能
  const handleResign = async () => {
    if (adminSession?.role === 'superadmin') {
      alert('超级管理员 UMI1220 无法辞职！');
      return;
    }
    if (confirm('确认要辞去管理员职务吗？辞职后你的管理口令将被销毁。')) {
      await supabase.from('admin_users').delete().eq('email', adminSession.email);
      sessionStorage.removeItem('admin_session');
      alert('已成功辞去管理员职务。');
      window.location.href = '/about';
    }
  };

  if (!adminSession) {
    return (
      <Layout>
        <div className="min-h-screen pt-32 text-center space-y-4">
          <p className="text-sm font-serif text-zinc-600">⚠️ 未登录或管理口令无效</p>
          <Link href="/about" className="text-xs text-[#88abac] underline">
            ← 返回 About 页面登录
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>ADMIN DASHBOARD | ヨルシカ FanSite</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* 页头 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
            <div>
              <h1 className="text-2xl font-serif text-zinc-800 tracking-widest flex items-center gap-2">
                <span>⚙️ 后台管理中心</span>
                {adminSession.role === 'superadmin' && (
                  <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded">
                    超级管理员
                  </span>
                )}
              </h1>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                当前身份: {adminSession.nickname} ({adminSession.email})
              </p>
            </div>

            <div className="flex items-center gap-3">
              {adminSession.role !== 'superadmin' && (
                <button
                  onClick={handleResign}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-serif transition"
                >
                  🚪 辞去职务
                </button>
              )}
              <button
                onClick={() => {
                  sessionStorage.removeItem('admin_session');
                  window.location.href = '/about';
                }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-serif transition"
              >
                退出后台
              </button>
            </div>
          </div>

          {/* Tab 导航 */}
          <div className="flex border-b border-zinc-200 gap-6 text-xs font-serif">
            <button
              onClick={() => setActiveTab('feedback')}
              className={`pb-3 font-medium transition-all ${
                activeTab === 'feedback'
                  ? 'border-b-2 border-[#88abac] text-[#88abac]'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              📢 反馈与举报 ({feedbacks.length})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`pb-3 font-medium transition-all ${
                activeTab === 'applications'
                  ? 'border-b-2 border-[#88abac] text-[#88abac]'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              ✉️ 加入申请 ({applications.filter((a) => a.status === 'pending').length} 待审核)
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`pb-3 font-medium transition-all ${
                activeTab === 'content'
                  ? 'border-b-2 border-[#88abac] text-[#88abac]'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              🗑️ 站内内容清理
            </button>
          </div>

          {/* 列表面板 */}
          {loading ? (
            <div className="text-center py-12 text-zinc-400 text-xs">数据加载中...</div>
          ) : (
            <div className="space-y-4">
              
              {/* Tab 1: 反馈与举报 */}
              {activeTab === 'feedback' && (
                <div className="space-y-3">
                  {feedbacks.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl text-center text-xs text-zinc-400">
                      暂无反馈记录
                    </div>
                  ) : (
                    feedbacks.map((fb) => (
                      <div key={fb.id} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            fb.type === 'report' ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'
                          }`}>
                            {fb.type === 'report' ? '🚨 违规举报' : '💡 建言建议'}
                          </span>
                          <span className="text-zinc-400 font-mono text-[11px]">
                            {new Date(fb.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-700 leading-relaxed font-sans">{fb.content}</p>
                        <p className="text-[11px] text-zinc-400 font-mono">联系人: {fb.contact}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: 管理申请审核 */}
              {activeTab === 'applications' && (
                <div className="space-y-3">
                  {applications.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl text-center text-xs text-zinc-400">
                      暂无申请记录
                    </div>
                  ) : (
                    applications.map((app) => (
                      <div key={app.id} className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-serif font-medium text-zinc-800 text-sm">{app.nickname}</span>
                            <span className="ml-2 text-zinc-400 font-mono">({app.email})</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded ${
                            app.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {app.status === 'approved' ? '✅ 已批准' : '⏳ 待审核'}
                          </span>
                        </div>

                        <div className="p-3 bg-zinc-50 rounded-xl text-xs text-zinc-600 italic font-serif">
                          “{app.reason}”
                        </div>

                        {app.status === 'pending' && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleApproveApplication(app)}
                              className="px-4 py-1.5 bg-[#88abac] hover:bg-[#789b9c] text-white text-xs rounded-xl shadow-sm transition"
                            >
                              通过申请并生成6位密码发电邮
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: 内容清理 */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  {/* 社区帖子列表 */}
                  <div className="bg-white p-6 rounded-2xl border border-zinc-100 space-y-4">
                    <h3 className="text-sm font-serif text-zinc-800">社区帖子列表 ({forumPosts.length})</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {forumPosts.map((post) => (
                        <div key={post.id} className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl text-xs">
                          <div className="truncate max-w-lg">
                            <span className="font-serif font-medium">{post.title}</span>
                            <span className="text-zinc-400 ml-2">by {post.author}</span>
                          </div>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-rose-500 hover:underline text-[11px]"
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 试听曲目列表 */}
                  <div className="bg-white p-6 rounded-2xl border border-zinc-100 space-y-4">
                    <h3 className="text-sm font-serif text-zinc-800">音乐曲目列表 ({musicTracks.length})</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {musicTracks.map((m) => (
                        <div key={m.id} className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl text-xs">
                          <div className="truncate max-w-lg">
                            <span className="font-serif font-medium">{m.title}</span>
                            <span className="text-zinc-400 ml-2">贡献者: {m.contributor}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteMusic(m.id)}
                            className="text-rose-500 hover:underline text-[11px]"
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}