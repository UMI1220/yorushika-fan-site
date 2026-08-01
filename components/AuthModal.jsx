import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false); // true: 注册, false: 登录
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        // 注册用户，并将 nickname 写入 user_metadata，触发器会自动创建 profile
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname: nickname.trim() || '新鹿友',
            },
          },
        });
        if (error) throw error;
        alert('注册成功！欢迎加入鹿友社区。');
        closeAuthModal();
      } else {
        // 登录
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        closeAuthModal();
      }
    } catch (err) {
      setErrorMsg(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-zinc-100 relative">
        {/* 关闭按钮 */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition p-1"
        >
          ✕
        </button>

        {/* 标题 */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-serif tracking-widest text-zinc-800">
            {isSignUp ? '加入鹿友社区' : '欢迎回来'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-serif tracking-wide">
            晴天，走在月光下。
          </p>
        </div>

        {/* 错误信息提示 */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 text-center">
            {errorMsg}
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isSignUp && (
            <div>
              <label className="block text-zinc-600 mb-1 font-medium">鹿友昵称</label>
              <input
                type="text"
                required
                placeholder="例如：エルマ"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#88abac] transition"
              />
            </div>
          )}

          <div>
            <label className="block text-zinc-600 mb-1 font-medium">电子邮箱</label>
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#88abac] transition"
            />
          </div>

          <div>
            <label className="block text-zinc-600 mb-1 font-medium">密码</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#88abac] transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-lg font-medium transition tracking-wider shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? '处理中...' : isSignUp ? '立即注册' : '登录'}
          </button>
        </form>

        {/* 切换 登录 / 注册 */}
        <div className="mt-6 text-center text-xs text-zinc-400">
          {isSignUp ? (
            <span>
              已有账号？{' '}
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg('');
                }}
                className="text-[#88abac] underline hover:text-[#789b9c]"
              >
                直接登录
              </button>
            </span>
          ) : (
            <span>
              还没有账号？{' '}
              <button
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg('');
                }}
                className="text-[#88abac] underline hover:text-[#789b9c]"
              >
                立即注册
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}