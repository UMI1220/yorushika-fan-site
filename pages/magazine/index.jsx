import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';

export default function MagazineIndex() {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMagazines() {
      try {
        setLoading(true);
        const res = await fetch('/api/list');
        const data = await res.json();

        // 兼容直接返回数组 [...] 或返回 { magazines: [...] } 的结构
        const list = Array.isArray(data) ? data : (data.magazines || []);
        setMagazines(list);
      } catch (err) {
        console.error('Failed to fetch magazines:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMagazines();
  }, []);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-12 sm:py-20">
        
        {/* 头部标题区域 */}
        <div className="text-center mb-16">
          <h1 className="text-2xl sm:text-3xl font-light text-zinc-900 tracking-[0.25em] font-serif mb-3">
            电子刊物与同人合集
          </h1>
          <p className="text-xs text-zinc-400 font-mono tracking-wider uppercase">
            Yorushika Fan Magazines & Echo Publications
          </p>
          
          <div className="mt-6 flex justify-center">
            {/* 切换为月光青 `#88abac` / `#a5c9ca` 风格 */}
            <Link
              href="/magazine/submit"
              className="inline-flex items-center space-x-2 text-xs font-mono px-5 py-2.5 bg-[#88abac] hover:bg-[#a5c9ca] text-white rounded-full transition shadow-sm"
            >
              <span>+ 投稿刊物</span>
            </Link>
          </div>
        </div>

        {/* 加载状态 */}
        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-zinc-400 animate-pulse">
            Loading collection...
          </div>
        ) : magazines.length === 0 ? (
          /* 空列表提示 */
          <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-xs font-mono text-zinc-400 mb-4">暂无已发布的电子刊物</p>
            <Link
              href="/magazine/submit"
              className="text-xs font-mono text-[#88abac] hover:underline"
            >
              成为第一个投稿的鹿友 →
            </Link>
          </div>
        ) : (
          /* 刊物卡片网格 */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {magazines.map((mag) => {
              // 兼容多种封面与链接字段名
              const coverImg = mag.cover_url || mag.cover_img || '/placeholder.png';
              const magId = mag.id;

              return (
                <Link
                  key={magId}
                  href={`/magazine/${magId}`}
                  className="group block bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* 封面图区域 */}
                  <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden">
                    {coverImg ? (
                      <img
                        src={coverImg}
                        alt={mag.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-mono text-xs text-zinc-400">
                        NO COVER
                      </div>
                    )}
                    
                    {mag.category && (
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-zinc-700 shadow-sm">
                        {mag.category}
                      </div>
                    )}
                  </div>

                  {/* 文本内容区域 */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#88abac] tracking-widest uppercase block mb-2">
                        {mag.author ? `By ${mag.author}` : 'Yorushika Fan Club'} {mag.issue_number ? `· ${mag.issue_number}` : ''}
                      </span>
                      <h2 className="text-sm font-serif font-medium text-zinc-900 mb-2 group-hover:text-[#88abac] transition line-clamp-1">
                        {mag.title}
                      </h2>
                      <p className="text-xs text-zinc-500 font-light leading-relaxed line-clamp-2">
                        {mag.description || '暂无描述信息'}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-mono text-zinc-400">
                      <span>在线阅读与弹幕戳记</span>
                      <span className="text-[#88abac] group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </Layout>
  );
}