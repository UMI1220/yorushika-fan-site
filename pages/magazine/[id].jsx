import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function MagazineReader() {
  const router = useRouter();
  const { id } = router.query;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 52; // 《回声》第一期总页数

  // 状态：记录当前图片是否加载成功
  const [imgLoaded, setImgLoaded] = useState(false);

  // 存储所有页面的戳记数据
  const [annotations, setAnnotations] = useState([
    { page: 1, x: 50, y: 50, author: '听海', content: '欢迎来到回声第一页！' }
  ]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentPos, setCommentPos] = useState({ x: 0, y: 0 });
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');

  // 精准计算并捕获当前页面点击坐标
  const handlePageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCommentPos({ x, y });
    setShowCommentModal(true);
  };

  const handleAddAnnotation = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setAnnotations([
      ...annotations,
      { page: currentPage, x: commentPos.x, y: commentPos.y, author: commentAuthor || '匿名友人', content: newComment }
    ]);
    setNewComment('');
    setCommentAuthor('');
    setShowCommentModal(false);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* 顶部导航与翻页控制栏 */}
        <div className="flex justify-between items-center mb-6 bg-white/85 backdrop-blur-md px-6 py-3 rounded-2xl border border-zinc-200/60 shadow-sm relative z-20">
          <button
            onClick={() => router.push('/magazine')}
            className="text-xs font-mono text-zinc-500 hover:text-[#597b7c] transition cursor-pointer"
          >
            &larr; 返回目录
          </button>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); setImgLoaded(false); }}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-30 rounded-lg text-xs font-mono cursor-pointer"
            >
              &larr; 上一页
            </button>
            <span className="text-xs font-mono text-zinc-600 font-medium">
              第 {currentPage} 页 / 共 {totalPages} 页
            </span>
            <button
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); setImgLoaded(false); }}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-30 rounded-lg text-xs font-mono cursor-pointer"
            >
              下一页 &rarr;
            </button>
          </div>
        </div>

        {/* 阅读视窗外层容器 */}
        <div className="relative bg-[#f9f8f6] border border-zinc-200 rounded-2xl shadow-sm overflow-hidden min-h-[750px] flex flex-col items-center justify-center p-6">
          
          {/* 核心容器 */}
          <div 
            className="relative w-full max-w-xl aspect-[1/1.414] bg-white shadow-md rounded-xl border border-zinc-200/80 overflow-hidden cursor-crosshair select-none flex items-center justify-center"
            onClick={handlePageClick}
          >
            {/* 1. 杂志高清图片层 */}
            <img 
              src={`/magazine-pages/page-${currentPage}.jpg`} 
              alt={`Echo Issue 01 Page ${currentPage}`}
              className="absolute inset-0 w-full h-full object-contain z-10"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(false)}
            />

            {/* 2. 降级备用提示层：只有当图片未成功加载时才显示，绝不与图片重叠 */}
            {!imgLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white z-0 pointer-events-none">
                <span className="text-3xl mb-2">📖</span>
                <p className="text-xs font-serif text-zinc-700 font-medium">【回声】群刊第一期 - 第 {currentPage} 页</p>
                <p className="text-[10px] font-mono text-zinc-400 mt-2 max-w-xs leading-relaxed">
                  提示：尚未检测到 <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-600">public/magazine-pages/page-{currentPage}.jpg</code>。<br/>请运行 Python 脚本生成图片或检查路径！
                </p>
              </div>
            )}

            {/* 3. 戳记小圆点层（置于最顶层 z-30） */}
            {annotations
              .filter(ann => ann.page === currentPage)
              .map((ann, idx) => (
                <div
                  key={idx}
                  className="absolute w-5 h-5 -ml-2.5 -mt-2.5 bg-[#a5c9ca] border-2 border-white rounded-full shadow-md flex items-center justify-center cursor-pointer group hover:scale-125 transition-transform z-30"
                  style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[10px] text-zinc-900 font-bold">💬</span>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-zinc-900 text-white text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-40 font-sans">
                    <span className="text-[#a5c9ca] font-medium">{ann.author}：</span>{ann.content}
                  </div>
                </div>
              ))}
          </div>

        </div>

        {/* 底部提示 */}
        <div className="text-center mt-4">
          <p className="text-[11px] font-mono text-zinc-400">
            💡 提示：点击“上一页” / “下一页”无缝切换，点击页面任意位置即可留下阅读戳记！
          </p>
        </div>

        {/* 发表批注弹窗 */}
        {showCommentModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in">
              <h3 className="text-sm font-serif text-zinc-800 font-medium">✨ 在第 {currentPage} 页留下阅读戳记</h3>
              <form onSubmit={handleAddAnnotation} className="space-y-3">
                <input
                  type="text"
                  placeholder="你的昵称 (选填，默认 匿名友人)"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#a5c9ca]"
                />
                <textarea
                  rows={3}
                  required
                  placeholder="写下你对这一页的感悟、考据或吐槽..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#a5c9ca] resize-none"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCommentModal(false)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-full text-xs cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#a5c9ca] hover:bg-[#8eb8b9] text-zinc-900 rounded-full text-xs font-medium cursor-pointer"
                  >
                    钉在这一页 📌
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
