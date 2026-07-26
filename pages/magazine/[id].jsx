import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';

export default function MagazineDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [magazine, setMagazine] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [nickname, setNickname] = useState('');
  const [commentText, setCommentText] = useState('');
  const [selectedPage, setSelectedPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    // 获取单篇刊物
    async function fetchMagazine() {
      const { data, error } = await supabase.from('magazines').select('*').eq('id', id).single();
      if (data) setMagazine(data);
    }

    // 获取所有戳记评论
    fetchAnnotations();
    fetchMagazine();
  }, [id]);

  const fetchAnnotations = async () => {
    if (!id) return;
    const res = await fetch(`/api/stamp?magazineId=${id}`);
    const data = await res.json();
    if (data.annotations) {
      setAnnotations(data.annotations);
    }
  };

  const handleAddStamp = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return alert('请输入戳记评论内容');
    setSubmitting(true);

    try {
      const res = await fetch('/api/stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          magazineId: id,
          pageIndex: selectedPage,
          content: commentText,
          nickname: nickname.trim() || '匿名粉丝',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCommentText('');
        fetchAnnotations(); // 刷新戳记评论列表
      } else {
        alert('留下戳记失败：' + data.error);
      }
    } catch (err) {
      alert('发送失败：' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!magazine) return <div style={{ padding: '40px', textAlign: 'center' }}>刊物加载中...</div>;

  const filteredAnnotations = annotations.filter((a) => a.page_index === selectedPage);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>{magazine.title}</h1>
      <p style={{ color: '#666' }}>作者：{magazine.author} | 分类：{magazine.category}</p>
      <p>{magazine.description}</p>

      <hr style={{ margin: '20px 0', borderColor: '#eee' }} />

      {/* 页码选择器 */}
      <div style={{ margin: '15px 0', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span>切换当前阅读页：</span>
        {(magazine.pages || [magazine.cover_img]).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedPage(idx)}
            style={{
              padding: '5px 12px',
              backgroundColor: selectedPage === idx ? '#e74c3c' : '#f0f0f0',
              color: selectedPage === idx ? '#fff' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            第 {idx + 1} 页
          </button>
        ))}
      </div>

      {/* 刊物图片展示 */}
      <div style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '6px', textAlign: 'center', backgroundColor: '#fafafa' }}>
        <img
          src={(magazine.pages && magazine.pages[selectedPage]) || magazine.cover_img || 'https://via.placeholder.com/600x800?text=Page'}
          alt={`Page ${selectedPage + 1}`}
          style={{ maxWidth: '100%', maxHeight: '700px', objectFit: 'contain' }}
        />
      </div>

      {/* 戳记评论互动区 */}
      <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff' }}>
        <h3>🔖 本页戳记与评论 ({filteredAnnotations.length})</h3>

        {/* 发表戳记评论表单 */}
        <form onSubmit={handleAddStamp} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="你的昵称 (可选，默认匿名)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              style={{ padding: '8px', width: '200px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <input
              type="text"
              placeholder="在此留下你的感悟或对本页的戳记评论..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ padding: '8px', flex: 1, border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '8px 20px',
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {submitting ? '发送中...' : '💮 盖戳'}
            </button>
          </div>
        </form>

        {/* 展示已有戳记评论列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredAnnotations.length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>本页还没有人留下戳记，快抢沙发吧！</p>
          ) : (
            filteredAnnotations.map((item) => (
              <div key={item.id} style={{ padding: '10px', backgroundColor: '#f9f9f9', borderLeft: '4px solid #e74c3c', borderRadius: '2px' }}>
                <div style={{ fontSize: '13px', color: '#777', display: 'flex', justifyContent: 'space-between' }}>
                  <span>👤 {item.nickname}</span>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
                <p style={{ margin: '5px 0 0', color: '#333' }}>{item.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

