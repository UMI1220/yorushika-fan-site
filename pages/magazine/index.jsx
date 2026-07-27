import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';

export default function MagazineIndex() {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);

  // 从你刚刚确认的 /api/list 接口拉取 Supabase 数据
  useEffect(() => {
    async function fetchMagazines() {
      try {
        const res = await fetch('/api/list');
        const data = await res.json();
        // 对应 api 返回的 { magazines: [...] } 结构
        if (data && data.magazines) {
          setMagazines(data.magazines);
        }
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
        
        {/* 头部标题区域：向主页看齐的日系文艺风格 */}
        <div className="text-center mb-16">
          <h1 className="text-2xl sm:text-3xl font-light text-zinc-900 tracking-[0.25em] font-serif mb-3">
            电子刊物与同人合集
          </h1>
          <p className="text-xs text-zinc-400 tracking-[0.3em] uppercase font-mono">
            YORUSHIKA FAN MAGAZINE COLLECTION
          </p>
          <div className="w-12 h-[1px] bg-[#a5c9ca] mx-auto mt-6"></div>
        </div>

        {/* 顶部操作栏：投稿入口 */}
        <div className="flex justify-between items-center mb-10">
          <p className="text-xs text-zinc-500 font-light tracking-wide">
            收录群友与乐迷共同创作的赛博存档与文学特辑。
          </p>
          <Link 
            href="/magazine/submit"
            className="px-5 py-2.5 bg-white border border-zinc-200 hover:border-[#a5c9ca] text-zinc-700 hover:text-[#a5c9ca] text-xs font-mono tracking-widest rounded-full transition shadow-sm inline-flex items-center space-x-1"
          >
            <span>+ 参与投稿 / SUBMIT</span>
          </Link>
        </div>

        {/* 刊物网格展示 */}
        {loading ? (
          <div className="text-center py-20 text-xs font-mono text-zinc-400">
            正在载入夏日的诗篇……
          </div>
        ) : magazines.length === 0 ? (
          <div className="text-center py-20 text-xs font-mono text-zinc-400 bg-white rounded-2xl border border-zinc-100 shadow-sm">
            暂无刊物记录，快去点击上方进行投稿吧！
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {magazines.map((mag) => (
              <Link 
                key={mag.id}
                href={`/magazine/${mag.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col"
              >
                {/* 封面图 */}
                <div className="aspect-[4/3] w-full bg-zinc-100 overflow-hidden relative">
                  <img 
                    src={mag.coverImg || '/covers/1.jpg'} 
                    alt={mag.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {mag.category && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-zinc-700 shadow-sm">
                      {mag.category}
                    </div>
                  )}
                </div>

                {/* 文本内容 */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#a5c9ca] tracking-widest uppercase block mb-2">
                      {mag.author ? `By ${mag.author}` : 'Yorushika Fan Club'} · {mag.totalPages ? `共 ${mag.totalPages} 页` : ''}
                    </span>
                    <h2 className="text-sm font-serif font-medium text-zinc-900 mb-2 group-hover:text-teal-700 transition">
                      {mag.title}
                    </h2>
                    <p className="text-xs text-zinc-500 font-light leading-relaxed line-clamp-2">
                      {mag.description}
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