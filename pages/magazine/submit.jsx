import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function MagazineSubmit() {
  const router = useRouter();
  const [tab, setTab] = useState('submission');
  
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('刊物/电子书 (JPG多图)');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let base64Pages = [];
      
      // 仅在作品投稿模式下转换图片
      if (tab === 'submission' && selectedFiles.length > 0) {
        base64Pages = await Promise.all(
          selectedFiles.map((file) => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = (error) => reject(error);
              reader.readAsDataURL(file);
            });
          })
        );
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: tab,
          title: tab === 'submission' ? title : '意见反馈',
          author: tab === 'submission' ? author : '社区访客',
          category,
          description,
          totalPages: base64Pages.length || 1,
          pages: base64Pages,
          coverImg: base64Pages[0] || '/magazine-pages/page-1.jpg'
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        alert('送信成功しました！');
        if (tab === 'submission') {
          router.push('/magazine');
        } else {
          setDescription('');
        }
      } else {
        alert('提交失败: ' + (result.error || '未知错误'));
      }
    } catch (err) {
      console.error(err);
      alert('提交过程中出现错误，请检查网络或控制台');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8 border-b border-zinc-200 pb-6">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Creator Window</span>
            <span className="text-zinc-300">/</span>
            <span className="text-[11px] font-serif text-[#597b7c] tracking-widest">作品・資料の提出</span>
          </div>
          <h1 className="text-2xl font-serif text-zinc-800 tracking-wider">
            創作者の窓 <span className="text-xs text-zinc-500 font-normal ml-2">群刊投稿与社区回声反馈</span>
          </h1>
        </div>
        
        <div className="flex space-x-4 mb-8 border-b border-zinc-200 pb-4">
          <button
            type="button"
            onClick={() => setTab('submission')}
            className={`px-4 py-2 rounded-full text-xs font-serif transition cursor-pointer ${
              tab === 'submission' ? 'bg-[#a5c9ca] text-zinc-900 font-medium' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            📁 作品・刊物投稿 (Submission)
          </button>
          <button
            type="button"
            onClick={() => setTab('feedback')}
            className={`px-4 py-2 rounded-full text-xs font-serif transition cursor-pointer ${
              tab === 'feedback' ? 'bg-[#a5c9ca] text-zinc-900 font-medium' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            💬 ご意見・フィードバック (Feedback)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
          {tab === 'submission' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-serif text-zinc-600 mb-2">作品 / 刊物名称 (タイトル) *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例：《回声》第二期"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:border-[#a5c9ca]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-serif text-zinc-600 mb-2">创作者 / 团队昵称 (作者) *</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="例：贤弦"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:border-[#a5c9ca]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-serif text-zinc-600">
                  上传刊物图片文件夹 / 多张 JPG 图片 (JPGフォルダ) *
                </label>
                
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const files = Array.from(e.dataTransfer.files);
                      setSelectedFiles(files);
                      e.dataTransfer.clearData();
                    }
                  }}
                  className="border-2 border-dashed border-zinc-300 rounded-xl p-6 text-center hover:border-[#a5c9ca] transition bg-zinc-50/50 cursor-pointer"
                >
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setSelectedFiles(files);
                    }}
                    className="hidden"
                    id="magazine-file-upload"
                  />
                  <label htmlFor="magazine-file-upload" className="cursor-pointer space-y-2 block">
                    <div className="text-2xl">📁</div>
                    <p className="text-xs font-serif text-zinc-700">
                      {selectedFiles.length > 0 ? `已成功选择 / 拖入 ${selectedFiles.length} 个 JPG 文件` : '点击选择，或将 JPG 图片文件夹直接拖拽到此处'}
                    </p>
                    <p className="text-[11px] font-mono text-[#597b7c] bg-[#a5c9ca]/10 py-1.5 px-3 rounded-lg inline-block">
                      💡 格式要求：仅支持包含多张 JPG 格式图片的文件夹或批量 JPG 文件
                    </p>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-serif text-zinc-600 mb-2">反馈详情描述 (フィードバック内容) *</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入您的建议或发现的 Bug..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 text-xs focus:outline-none focus:border-[#a5c9ca]"
              />
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#a5c9ca] hover:bg-[#8eb8b9] text-zinc-900 rounded-xl text-xs font-serif font-medium shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? '送信中...' : '提交作品 · 送信する 📤'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
