import { useState } from 'react';
import Link from 'next/link';

export default function SubmitPage() {
  const [activeTab, setActiveTab] = useState('submit');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    file: null,
    feedbackContent: '',
    contact: ''
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (activeTab === 'submit') {
        if (!formData.file) {
          throw new Error('请选择要上传的 PDF 文件/作品');
        }

        const body = new FormData();
        body.append('file', formData.file);
        body.append('title', formData.title || formData.file.name);
        body.append('author', formData.author || '匿名'); // 兜底处理
        body.append('description', formData.description);

        const res = await fetch('/api/submit', {
          method: 'POST',
          body: body
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '上传失败');

        setMessage({ type: 'success', text: '🎉 投稿成功！稿件已送达，感谢你的分享。' });
      } else {
        setMessage({ type: 'success', text: '✉️ 感谢你的反馈！我们会认真阅读。' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#4a5568] flex flex-col justify-between font-sans">
      <div>
        <header className="w-full bg-white border-b border-gray-100 py-4 px-8 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center">
              <div className="w-1 h-5 bg-black rounded-full"></div>
            </div>
            <Link href="/" className="font-serif text-xl tracking-widest text-gray-800">ヨルシカ</Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-widest text-gray-500">
            <Link href="/" className="hover:text-black transition">INDEX</Link>
            <Link href="/magazine" className="hover:text-black transition">MAGAZINE</Link>
            <Link href="/about" className="hover:text-black transition">ABOUT</Link>
          </nav>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-serif text-gray-800 tracking-wide mb-2">
              投递月光与文字的口袋
            </h1>
            <p className="text-xs text-gray-400 font-mono">SUBMISSION & FEEDBACK</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
            <div className="flex border-b border-gray-100 bg-[#f7f9fa]">
              <button
                onClick={() => setActiveTab('submit')}
                className={`flex-1 py-3.5 text-sm font-medium transition flex items-center justify-center gap-2 ${
                  activeTab === 'submit'
                    ? 'bg-white text-gray-800 border-b-2 border-[#88abac]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>📂</span> 作品 · 刊物投稿 (Submission)
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={`flex-1 py-3.5 text-sm font-medium transition flex items-center justify-center gap-2 ${
                  activeTab === 'feedback'
                    ? 'bg-white text-gray-800 border-b-2 border-[#88abac]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>💬</span> ご意見 · フィードバック
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {message && (
                <div className={`p-4 rounded-xl text-xs font-medium ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {message.text}
                </div>
              )}

              {activeTab === 'submit' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">刊物 / 稿件名称 *</label>
                    <input
                      type="text"
                      required
                      placeholder="例如：ECHO Issue 02 / 月光下的白日梦"
                      className="w-full px-4 py-2.5 bg-[#fcfdfe] border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#88abac] transition"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">创作者 / 署名</label>
                    <input
                      type="text"
                      placeholder="你的名字或笔名（留空则默认为匿名）"
                      className="w-full px-4 py-2.5 bg-[#fcfdfe] border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#88abac] transition"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">作品简介 / 致读者</label>
                    <textarea
                      rows="3"
                      placeholder="简单介绍一下这份作品的契机与寄语..."
                      className="w-full px-4 py-2.5 bg-[#fcfdfe] border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#88abac] transition"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">上传 PDF 文件 *</label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-[#fcfdfe] hover:border-[#88abac] transition">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="pdf-upload"
                      />
                      <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                        <span className="text-2xl mb-2">📄</span>
                        <span className="text-xs text-gray-600 font-medium">
                          {formData.file ? formData.file.name : '点击选择或拖拽 PDF 电子刊文件'}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-1">支持最大 50MB 的高精 PDF</span>
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">意见与建议 *</label>
                    <textarea
                      rows="5"
                      required
                      placeholder="对网站或电子杂志有什么建议，欢迎随时留言..."
                      className="w-full px-4 py-2.5 bg-[#fcfdfe] border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#88abac] transition"
                      value={formData.feedbackContent}
                      onChange={(e) => setFormData({ ...formData, feedbackContent: e.target.value })}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">联系方式（选填）</label>
                    <input
                      type="text"
                      placeholder="邮箱 / B站 ID / 社交账号"
                      className="w-full px-4 py-2.5 bg-[#fcfdfe] border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#88abac] transition"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-xl text-sm font-medium transition duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? '正在提交中...' : '提交作品 · 送信する 📤'}
              </button>
            </form>
          </div>
        </main>
      </div>

      <footer className="w-full bg-[#88abac] text-white py-6 px-8 mt-16">
        <div className="max-w-5xl mx-auto flex justify-between items-center text-xs font-mono">
          <p>© 2026 YORUSHIKA FAN SITE.</p>
          <Link href="/magazine" className="hover:underline">← 返回杂志列表</Link>
        </div>
      </footer>
    </div>
  );
}
