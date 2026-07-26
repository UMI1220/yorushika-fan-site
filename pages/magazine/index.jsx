import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MagazineIndex() {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.magazines) {
          setMagazines(data.magazines);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>ヨルシカ 群刊 · 电子杂志首页</h1>
      <div style={{ margin: '20px 0' }}>
        <Link href="/magazine/submit">
          <button style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', borderRadius: '4px', backgroundColor: '#2980b9', color: '#fff', border: 'none' }}>
            ✍️ 我要投稿 / 意见反馈
          </button>
        </Link>
      </div>

      {loading ? (
        <p>加载云端数据中...</p>
      ) : magazines.length === 0 ? (
        <p>暂无刊物，快去投稿吧！</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {magazines.map((item) => (
            <div key={item.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '15px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <img
                src={item.coverImg || 'https://via.placeholder.com/300x200?text=Yorushika+Fan'}
                alt={item.title}
                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <h3 style={{ margin: '10px 0 5px' }}>{item.title}</h3>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 10px' }}>作者：{item.author} | 分类：{item.category}</p>
              <p style={{ fontSize: '14px', color: '#444', height: '40px', overflow: 'hidden' }}>{item.description}</p>
              <Link href={`/magazine/${item.id}`}>
                <button style={{ width: '100%', padding: '8px', backgroundColor: '#34495e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  📖 阅读刊物与盖戳评论
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
