import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export default function MagazineDetail({ magazine, error }) {
  if (error || !magazine) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-gray-500 font-serif mb-4">未找到该刊物，可能已被移走...</p>
          <Link href="/magazine" className="px-5 py-2 bg-[#88abac] text-white text-xs rounded-full">
            ← 返回杂志列表
          </Link>
        </div>
      </div>
    );
  }

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

          <Link href="/magazine" className="text-xs text-gray-500 hover:text-black font-mono">
            ← BACK TO MAGAZINE
          </Link>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-10">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-[#88abac]/10 text-[#88abac] text-xs font-mono rounded-full font-medium">
                  {magazine.category || '电子刊物'}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(magazine.created_at).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif text-gray-800 tracking-wide mb-2">
                {magazine.title}
              </h1>
              <p className="text-xs text-gray-400">
                作者 / 编辑：<span className="text-gray-600 font-medium">{magazine.author || '匿名'}</span>
              </p>
              {magazine.description && (
                <p className="text-sm text-gray-500 mt-4 leading-relaxed font-light border-t border-gray-100 pt-4">
                  {magazine.description}
                </p>
              )}
            </div>

            {magazine.pdf_url && (
              <a
                href={magazine.pdf_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-xl text-xs font-medium transition duration-200 shadow-sm flex items-center gap-2 shrink-0"
              >
                <span>📥</span> 下载高精原文件 PDF
              </a>
            )}
          </div>

          {magazine.pdf_url ? (
            <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-md overflow-hidden h-[800px]">
              <iframe
                src={`${magazine.pdf_url}#toolbar=0`}
                className="w-full h-full rounded-xl"
                title={magazine.title}
              ></iframe>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 text-gray-400 font-serif">
              暂未关联 PDF 预览地址...
            </div>
          )}
        </main>
      </div>

      <footer className="w-full bg-[#88abac] text-white py-6 px-8 mt-16">
        <div className="max-w-5xl mx-auto flex justify-between items-center text-xs font-mono">
          <p>© 2026 YORUSHIKA FAN SITE.</p>
          <Link href="/magazine" className="hover:underline">MAGAZINE INDEX</Link>
        </div>
      </footer>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { props: { error: 'Supabase 未配置' } };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('magazines')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    return {
      props: {
        magazine: data || null,
      },
    };
  } catch (err) {
    return {
      props: {
        error: err.message,
      },
    };
  }
}
