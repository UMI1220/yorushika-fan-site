import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export default function MagazineIndex({ magazines }) {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-[#4a5568] flex flex-col justify-between font-sans">
      <div>
        {/* 1. 顶部 Header 导航栏 */}
        <header className="w-full bg-white border-b border-gray-100 py-4 px-8 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center">
              <div className="w-1 h-5 bg-black rounded-full"></div>
            </div>
            <Link href="/" className="font-serif text-xl tracking-widest text-gray-800">ヨルシカ</Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-widest text-gray-500">
            <Link href="/" className="hover:text-black transition">INDEX</Link>
            <Link href="/magazine" className="text-black font-bold underline underline-offset-4 decoration-[#88abac]">MAGAZINE</Link>
            <a href="#" className="hover:text-black transition">FORUM</a>
            <a href="#" className="hover:text-black transition">GALLERY</a>
            <a href="#" className="hover:text-black transition">DISCOGRAPHY</a>
            <Link href="/about" className="hover:text-black transition">ABOUT</Link>
          </nav>
        </header>

        {/* 2. 主体区 */}
        <main className="max-w-5xl mx-auto px-6 py-10">
          {/* 页头标题区 */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-gray-200/60">
            <div>
              <h1 className="text-2xl font-normal text-gray-800 tracking-wide font-serif">
                ヨルシカ 群刊 · 电子杂志首页
              </h1>
              <p className="text-xs text-gray-400 mt-1 font-mono">OFFICIAL FAN PUBLICATION ARCHIVE</p>
            </div>

            {/* 投稿按钮：莫兰迪青蓝色圆角 */}
            <Link 
              href="/magazine/submit"
              className="mt-4 md:mt-0 px-6 py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-full text-sm font-medium transition duration-200 shadow-sm flex items-center gap-2"
            >
              <span>✍️</span> 我要投稿 / 意见反馈
            </Link>
          </div>

          {/* 3. 刊物展示网格 (拍立得卡片风) */}
          {magazines && magazines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
              {magazines.map((item, index) => {
                const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2'];
                const rotationClass = rotations[index % rotations.length];

                return (
                  <div 
                    key={item.id}
                    className={`bg-white p-4 rounded-xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 transform ${rotationClass} hover:rotate-0 hover:-translate-y-1 flex flex-col justify-between`}
                  >
                    {/* 封面相框区 */}
                    <div className="w-full h-56 bg-[#f2f4f5] rounded-lg overflow-hidden border border-gray-100 relative mb-4">
                      {item.cover_img ? (
                        <img src={item.cover_img} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 font-serif p-4 text-center">
                          <span className="text-2xl mb-1">月光</span>
                          <span className="text-xs text-gray-400 font-sans">{item.title}</span>
                        </div>
                      )}
                      
                      {item.category && (
                        <span className="absolute top-2 right-2 px-2.5 py-0.5 bg-white/90 text-gray-600 text-[10px] rounded-full border border-gray-200 backdrop-blur-sm">
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* 信息与描述 */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h2 className="text-lg font-medium text-gray-800 mb-1 font-serif line-clamp-1">
                          {item.title}
                        </h2>
                        <p className="text-xs text-gray-400 mb-3">
                          作者: <span className="text-gray-600">{item.author || '匿名'}</span>
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4 font-light">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* 底部按键区 */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        <Link
                          href={`/magazine/${item.id}`}
                          className="px-4 py-1.5 bg-[#88abac] hover:bg-[#7a9d9e] text-white text-xs rounded-md transition"
                        >
                          阅读刊物
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 空状态 */
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm mt-6">
              <p className="text-gray-600 text-lg font-serif mb-2">暂无刊物，快去投稿吧！</p>
              <p className="text-xs text-gray-400">期待大家分享关乎月光与音乐的故事。</p>
            </div>
          )}
        </main>
      </div>

      {/* 底部 Footer */}
      <footer className="w-full bg-[#88abac] text-white py-6 px-8 mt-16">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs gap-4 font-mono">
          <p>© 2026 YORUSHIKA FAN SITE.</p>
          <div className="flex gap-6 tracking-widest">
            <Link href="/about" className="hover:underline">ABOUT</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:underline">GITHUB</a>
            <a href="https://bilibili.com" target="_blank" rel="noreferrer" className="hover:underline">BILIBILI</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return { props: { magazines: [] } };

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase.from('magazines').select('*').order('created_at', { ascending: false });

    return { props: { magazines: data || [] } };
  } catch (err) {
    return { props: { magazines: [] } };
  }
}
