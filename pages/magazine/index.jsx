import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';

export default function MagazineIndex() {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);

  // 从 /api/list 接口拉取 Supabase 数据
  useEffect(() => {
    async function fetchMagazines() {
      try {
        const res = await fetch('/api/list');
        const data = await res.json();
        
        // ✅ 兼容直接返回数组 [...] 或返回对象 { magazines: [...] } 的结构
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
          <p className="text-xs sm:text-sm text-zinc-500 font-light tracking-widest font-mono">
            ECHOES & FAN MAGAZINES
          </p>
          <div className="w-8 h-[1px] bg-[#a5c9ca] mx-auto mt-6"></div>
        </div>

        {/* 刊物操作栏（例如发布入口） */}
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-zinc-100">
          <span className="text-xs font-mono text-zinc-400">
            全部刊物 ({magazines.length})
          </span>
          <Link
            href="/magazine/submit"
            className="px-4 py-2 bg-[#a5c9ca] hover:bg-[#94b8b9] text-white rounded-lg text-xs font-mono transition shadow-sm"
          >
            + 投稿/发布刊物
          </Link>
        </div>

        {/* 列表加载状态与展示 */}
        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-zinc-400 animate-pulse">
            Loading magazines...
          </div>
        ) : magazines.length === 0 ? (
          <div className="text-center py-20 font-mono text-xs text-zinc-400">
            暂无发布的刊物，快去发布第一期吧！
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {magazines.map((mag) => (
              <Link
                key={mag.id}
                href={`/magazine/${mag.id}`}
                className="group block bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm hover:shadow-md transition duration-300 flex flex-col"
              >
                {/* 封面图容器 */}
                <div className="aspect-[3/4] relative bg-zinc-100 overflow-hidden">
                  {mag.cover_url ? (
                    <img
                      src={mag.cover_url}
                      alt={mag.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300 font-mono text-xs">
                      NO COVER
                    </div>
                  )}
                  
                  {/* 角标分类 */}
                  {mag.category && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-zinc-700 shadow-sm">
                      {mag.category}
                    </div>
                  )}
                </div>

                {/* 文本内容区 */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#a5c9ca] tracking-widest uppercase block mb-2">
                      {mag.author ? `By ${mag.author}` : 'Yorushika Fan Club'} · {mag.issue_number || 'Vol.1'}
                    </span>
                    <h2 className="text-sm font-serif font-medium text-zinc-900 mb-2 group-hover:text-teal-700 transition">
                      {mag.title}
                    </h2>
                    <p className="text-xs text-zinc-500 font-light leading-relaxed line-clamp-2">
                      {mag.description || '暂无描述信息...'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span>在线阅读与弹幕戳记</span>
                    <span className="text-[#a5c9ca] group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
}