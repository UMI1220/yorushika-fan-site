import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

const MODE_LOGIN = 'login';
const MODE_REGISTER = 'register';

export default function PersonPage() {
  const router = useRouter();
  const [mode, setMode] = useState(MODE_LOGIN);

  // 当前登录会话
  const [session, setSession] = useState(null);

  // 注册字段
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  // 登录字段
  const [loginNickname, setLoginNickname] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 验证码倒计时
  const [countdown, setCountdown] = useState(0);

  // 状态提示
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 已注册用户列表
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // 修改昵称
  const [editNickname, setEditNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  // 头像上传
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = React.useRef(null);

  // 已注册用户列表折叠状态
  const [usersOpen, setUsersOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('person_session');
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('person_session');
      }
    }
  }, []);

  useEffect(() => {
    fetch('/api/person/users')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setUsers(data.users);
      })
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const switchMode = (m) => {
    setMode(m);
    setMsg('');
    setErrorMsg('');
  };

  const handleSendCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('请先填写正确的邮箱地址');
      return;
    }
    if (countdown > 0) return;

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/person/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || '发送失败');
      }
      setMsg(`验证码已发送至 ${email}${result.devCode ? `（开发模式：${result.devCode}）` : ''}`);
      setCountdown(60);
    } catch (err) {
      setErrorMsg(err.message || '验证码发送失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!/^\d{8}$/.test(password)) {
      setErrorMsg('密码必须为 8 位数字');
      return;
    }
    if (!/^\d{4}$/.test(code)) {
      setErrorMsg('请输入 4 位验证码');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/person/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, email, password, code }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || '注册失败');
      }

      const token = result.token;
      const user = result.user;
      const sessionData = { token, id: user.id, nickname: user.nickname, email: user.email };
      localStorage.setItem('person_session', JSON.stringify(sessionData));
      setSession(sessionData);
      setMsg(`注册成功！您的账户 ID 为 ${user.id}，昵称 ${user.nickname}`);
      setMode(MODE_LOGIN);
    } catch (err) {
      setErrorMsg(err.message || '注册失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/person/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: loginNickname, password: loginPassword }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || '登录失败');
      }

      const sessionData = { token: result.token, id: result.user.id, nickname: result.user.nickname, email: result.user.email };
      localStorage.setItem('person_session', JSON.stringify(sessionData));
      setSession(sessionData);
      setMsg(`登录成功！欢迎回来，${result.user.nickname}（ID: ${result.user.id}）`);
    } catch (err) {
      setErrorMsg(err.message || '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('person_session');
    setSession(null);
    setMsg('已退出登录');
  };

  const handleUpdateNickname = async (e) => {
    e.preventDefault();
    const name = newNickname.trim();
    if (!name) {
      setErrorMsg('请填写昵称');
      return;
    }
    if (name.length > 20) {
      setErrorMsg('昵称不能超过 20 个字符');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/person/update-nickname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ nickname: name }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || '修改失败');
      }

      const updated = { ...session, nickname: result.user.nickname };
      localStorage.setItem('person_session', JSON.stringify(updated));
      setSession(updated);
      setEditNickname(false);
      setNewNickname('');
      setMsg(`昵称已修改为 ${result.user.nickname}`);
    } catch (err) {
      setErrorMsg(err.message || '修改昵称失败');
    } finally {
      setSubmitting(false);
    }
  };

  const goPost = () => {
    router.push('/forum/post');
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('请选择图片文件');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('头像大小不能超过 2MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      setErrorMsg('');

      const fd = new FormData();
      fd.append('avatar', file);

      const res = await fetch('/api/person/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: fd,
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || '头像上传失败');
      }

      const updated = { ...session, avatar: result.avatarUrl };
      localStorage.setItem('person_session', JSON.stringify(updated));
      setSession(updated);
      setMsg('头像已更新');

      // 刷新用户列表
      const usersRes = await fetch('/api/person/users');
      const usersData = await usersRes.json();
      if (usersData.success) setUsers(usersData.users);
    } catch (err) {
      setErrorMsg(err.message || '头像上传失败');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const inputCls =
    'w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs focus:outline-none focus:border-[#88abac]';
  const labelCls = 'block text-xs font-mono text-zinc-500 mb-1';

  return (
    <Layout>
      <Head>
        <title>个人主页（beta） | Yorushika FanSite</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-xl mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <Link href="/" className="text-xs font-mono text-zinc-400 hover:text-zinc-700">
              ← 返回首页
            </Link>
            <h1 className="text-xl font-serif text-zinc-800">个人主页（beta）</h1>
          </div>

          {/* 已登录状态 */}
          {session && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
              <div className="flex items-start gap-4">
                {/* 头像 64x64 */}
                <div className="relative shrink-0">
                  {session.avatar ? (
                    <img
                      src={session.avatar}
                      alt="头像"
                      className="w-16 h-16 rounded-2xl object-cover border border-zinc-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 text-2xl">
                      {session.nickname ? session.nickname[0] : '?'}
                    </div>
                  )}
                  <label className="absolute -bottom-2 left-1/2 -translate-x-1/2 cursor-pointer bg-[#88abac] hover:bg-[#789b9c] text-white text-[10px] font-mono rounded-full px-2 py-0.5 shadow-sm whitespace-nowrap">
                    {uploadingAvatar ? '上传中' : '换头像'}
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
                <div className="space-y-1 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-serif text-zinc-800">{session.nickname}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditNickname((v) => !v);
                        setNewNickname(session.nickname);
                        setErrorMsg('');
                      }}
                      className="text-[10px] font-mono text-[#88abac] hover:text-teal-600 underline underline-offset-2"
                    >
                      修改昵称
                    </button>
                  </div>
                  <div className="text-xs font-mono text-zinc-400">账户 ID：{session.id}</div>
                  <div className="text-xs font-mono text-zinc-400">注册邮箱：{session.email}</div>
                </div>
              </div>

              {/* 修改昵称表单 */}
              {editNickname && (
                <form onSubmit={handleUpdateNickname} className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 mb-1">新昵称（20 字以内）</label>
                    <input
                      type="text"
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      maxLength={20}
                      className={inputCls}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-white text-xs font-mono rounded-xl shadow-sm disabled:opacity-50 transition"
                    >
                      {submitting ? '保存中...' : '保存昵称'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditNickname(false)}
                      className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-mono rounded-xl transition"
                    >
                      取消
                    </button>
                  </div>
                  {errorMsg && <div className="text-xs text-rose-500 font-mono">{errorMsg}</div>}
                </form>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={goPost}
                  className="flex-1 py-3 bg-[#88abac] hover:bg-[#789b9c] text-white text-xs font-mono rounded-xl shadow-sm transition"
                >
                  前往论坛发帖
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-mono rounded-xl shadow-sm transition"
                >
                  退出登录
                </button>
              </div>
              {msg && <div className="text-xs text-teal-600 font-mono">{msg}</div>}
            </div>
          )}

          {/* 未登录状态 */}
          {!session && (
            <>
              {/* 模式切换 */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-100 rounded-2xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => switchMode(MODE_LOGIN)}
                  className={`py-2.5 rounded-xl transition ${
                    mode === MODE_LOGIN ? 'bg-white text-zinc-800 shadow-sm font-bold' : 'text-zinc-500'
                  }`}
                >
                  登录
                </button>
                <button
                  type="button"
                  onClick={() => switchMode(MODE_REGISTER)}
                  className={`py-2.5 rounded-xl transition ${
                    mode === MODE_REGISTER ? 'bg-white text-zinc-800 shadow-sm font-bold' : 'text-zinc-500'
                  }`}
                >
                  注册
                </button>
              </div>

              {/* 登录表单 */}
              {mode === MODE_LOGIN && (
                <form onSubmit={handleLogin} className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-5">
                  <div>
                    <label className={labelCls}>昵称</label>
                    <input
                      type="text"
                      required
                      value={loginNickname}
                      onChange={(e) => setLoginNickname(e.target.value)}
                      className={inputCls}
                      placeholder="请输入注册时的昵称"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>密码</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={inputCls}
                      placeholder="请输入 8 位数字密码"
                    />
                  </div>
                  {errorMsg && <div className="text-xs text-rose-500 font-mono">{errorMsg}</div>}
                  {msg && <div className="text-xs text-teal-600 font-mono">{msg}</div>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#88abac] hover:bg-[#789b9c] text-white text-xs font-mono rounded-xl shadow-sm disabled:opacity-50 transition"
                  >
                    {submitting ? '登录中...' : '登录'}
                  </button>
                </form>
              )}

              {/* 注册表单 */}
              {mode === MODE_REGISTER && (
                <form onSubmit={handleRegister} className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-5">
                  <div>
                    <label className={labelCls}>昵称</label>
                    <input
                      type="text"
                      required
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className={inputCls}
                      placeholder="填写昵称（20 字以内）"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>注册邮箱</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                      placeholder="用于接收验证码"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>密码</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputCls}
                      placeholder="必须为 8 位数字"
                      maxLength={8}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>邮箱验证码</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className={inputCls}
                        placeholder="4 位验证码"
                        maxLength={4}
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={submitting || countdown > 0}
                        className="shrink-0 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-mono rounded-xl transition disabled:opacity-50"
                      >
                        {countdown > 0 ? `${countdown}s` : '发送验证码'}
                      </button>
                    </div>
                  </div>
                  {errorMsg && <div className="text-xs text-rose-500 font-mono">{errorMsg}</div>}
                  {msg && <div className="text-xs text-teal-600 font-mono">{msg}</div>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#88abac] hover:bg-[#789b9c] text-white text-xs font-mono rounded-xl shadow-sm disabled:opacity-50 transition"
                  >
                    {submitting ? '注册中...' : '注册'}
                  </button>
                </form>
              )}
            </>
          )}

          {/* 已注册用户列表（默认折叠，点击展开） */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-100 shadow-sm">
            <button
              type="button"
              onClick={() => setUsersOpen((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <h2 className="text-sm font-serif text-zinc-800">已注册鹿友</h2>
              <span className="text-[10px] font-mono text-zinc-400">
                {usersOpen ? '点击收起 ▲' : '共 ' + users.length + ' 人 · 点击展开 ▼'}
              </span>
            </button>

            {usersOpen && (
              <div className="mt-4">
                {usersLoading ? (
                  <div className="text-xs font-mono text-zinc-400">加载中...</div>
                ) : users.length === 0 ? (
                  <div className="text-xs font-mono text-zinc-400">暂无注册用户</div>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {users.map((u) => (
                      <li key={u.id} className="flex items-center justify-between py-2.5">
                        <span className="flex items-center gap-3">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt="头像"
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shrink-0"
                            />
                          ) : (
                            <span className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 text-sm shrink-0">
                              {u.nickname ? u.nickname[0] : '?'}
                            </span>
                          )}
                          <span className="text-xs text-zinc-700">{u.nickname}</span>
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">ID: {u.id}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
