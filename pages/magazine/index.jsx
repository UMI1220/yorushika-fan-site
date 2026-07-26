import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function MagazineIndex() {
  const router = useRouter();

  const defaultMagazines = [
    {
      id: 'echo-issue-01',
      title: '【回声】群刊第一期',
      period: '2026 盛夏号 · 赛博存档特刊',
      description: '收录了本期社区所有优秀的访谈、诗歌、考据及视觉艺术作品。',
      totalPages: 52,
      coverImg: '/magazine-pages/page-1.jpg',
    }
  ];

  const [dynamicMagazines, setDynamicMagazines] = useState([]);

  useEffect(() => {
    fetch('/api/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.magazines && Array.isArray(data.magazines)) {
          const formatted = data.magazines.map((item) => ({
            id: item.id,
            title: item.title || '無題の群刊',
            period: item.period || 'クリエイター投稿特刊',
            description: item.description || '暂无描述',
            totalPages: item.totalPages || (item.pages ? item.pages.length : 1),
            coverImg: item.coverImg || (item.pages && item.pages[0]) || '/magazine-pages/page-1.jpg',
          }));
          setDynamicMagazines(formatted);
        }
      })
      .catch((err) => console.error('获取动态杂志失败:', err));
  }, []);

  const allMagazines = [...defaultMagazines, ...dynamicMagazines];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-12 border-b border-zinc-200 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">Creator Window</span>
              <span className="text-zinc-300">/</span>
              <span className="text-[11px] font-serif text-[#597b7c] tracking-widest">創作室アーカイヴ</span>
            </div>
            <h1 className="text-3xl font-serif text-zinc-800 tracking-wider font-light">
              MAGAZINE <span className="text-sm font-sans text-zinc-500 font-normal ml-2">回声群刊与存档</span>
            </h1>
          </div>

          <div>
            <button
              onClick={() => router.push('/magazine/submit')}
              className="px-6 py-2.5 bg-[#a5c9ca] hover:bg-[#8eb8b9] text-zinc-900 rounded-full text-xs font-serif font-medium tracking-wider shadow-sm transition flex items-center space-x-2 cursor-pointer"
            >
              <span>📤 投稿する · 参与投稿 Submit</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {allMagazines.map((mag) => (
            <div
              key={mag.id}
              onClick={() => router.push(`/magazine/${mag.id}`)}
              className="group bg-white rounded-2xl border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col sm:flex-row"
            >
              <div className="sm:w-1/2 aspect-[1/1.414] bg-zinc-100 relative overflow-hidden">
                <img
                  src={mag.coverImg}
                  alt={mag.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>

              <div className="sm:w-1/2 p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="inline-block px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-mono">
                    {mag.period}
                  </span>
                  <h3 className="text-base font-serif text-zinc-800 font-medium group-hover:text-[#597b7c] transition-colors">
                    {mag.title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3 font-light">
                    {mag.description}
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-zinc-100 mt-4">
                  <span className="text-[11px] font-mono text-zinc-400">
                    全 {mag.totalPages} ページ
                  </span>
                  <span className="text-xs font-serif text-[#597b7c] group-hover:translate-x-1 transition-transform">
                    在线阅读 読む &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
