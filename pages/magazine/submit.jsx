import { useState } from 'react';
import { useRouter } from 'next/router';

export default function SubmitPage() {
  const router = useRouter();
  const [tab, setTab] = useState('submission');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    author: '',
    category: '考据',
    description: '',
    totalPages: 1,
    coverImg: '',
    pagesText: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 解析多页图片链接
      const pagesArray = form.pagesText
        ? form.pagesText.split('\n').map((url) => url.trim()).filter((url) => url.length > 0)
        : [form.coverImg];

      const payload = {
        type: tab,
        ...form,
        pages: pagesArray,
      };

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        alert(tab === 'submission' ? '投稿成功，已写入云端数据库！' : '反馈成功，感谢你的意见！');
        if (tab === 'submission') {
          router.push('/magazine');
        } else {
          setForm({ ...form, description: '' });
        }
      } else {
        alert('提交失败：' + data.error);
      }
    } catch (err) {
      alert('发生错误：' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setTab('submission')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: tab === 'submission' ? '#2980b9' : '#f0f0f0',
            color: tab === 'submission' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          刊物投稿
        </button>
        <button
          onClick={() => setTab('feedback')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: tab === 'feedback' ? '#2980b9' : '#f0f0f0',
            color: tab === 'feedback' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          意见反馈
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {tab === 'submission' ? (
          <>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>刊物标题：</label>
              <input type="text" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>作者 / 创作者：</label>
              <input type="text" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>分类：</label>
              <select style={{ width: '100%', padding: '8px' }} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="考据">考据</option>
                <option value="二次创作">二次创作</option>
                <option value="乐评">乐评</option>
                <option value="插画/同人">插画/同人</option>
                <option value="杂谈">杂谈</option>
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>封面图片 URL：</label>
              <input type="text" placeholder="https://..." style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} value={form.coverImg} onChange={(e) => setForm({ ...form, coverImg: e.target.value })} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>各页图片链接 (每行一个图片 URL)：</label>
              <textarea rows="4" placeholder="https://...
https://..." style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} value={form.pagesText} onChange={(e) => setForm({ ...form, pagesText: e.target.value })}></textarea>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>作品简介：</label>
              <textarea rows="3" style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
            </div>
          </>
        ) : (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>意见或建议反馈：</label>
            <textarea rows="6" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
          </div>
        )}

        <button type="submit" disabled={submitting} style={{ width: '100%', padding: '12px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
          {submitting ? '提交中...' : '确认提交'}
        </button>
      </form>
    </div>
  );
}
