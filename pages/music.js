import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { YORUSHIKA_DISCOGRAPHY } from '../lib/discography';

// 假数据：歌曲歌词示例（包含时间轴）
const SAMPLE_LYRICS = [
  { time: 0, text: "音楽の盗作をして生きていた" },
  { time: 5, text: "それが僕のすべてだった" },
  { time: 10, text: "哀しい歌ばかりを書いていた" },
  { time: 15, text: "君の心が知りたくて" },
  { time: 22, text: "言葉に出来ないから、歌を歌うことにした" },
  { time: 30, text: "ただ君に晴れ。夏の匂いがした" },
  { time: 40, text: "エルマ、君へ。僕の音楽をすべてあげる" },
  { time: 50, text: "人生は人生のまま、藍色の空に消えていく" },
];

export default function MusicPage() {
  const router = useRouter();
  const { album: queryAlbumId } = router.query;

  // 全局与当前播放状态
  const [currentAlbum, setCurrentAlbum] = useState(YORUSHIKA_DISCOGRAPHY[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 假定时长 3 分钟
  const [playMode, setPlayMode] = useState('loop'); // 'random' | 'loop' | 'single' | 'none'
  
  // 页面三栏/滑块切换状态 (手机端：0=详情, 1=播放器, 2=评论)
  const [activeTab, setActiveTab] = useState(1); 
  const [isImmersion, setIsImmersion] = useState(false); // 沉浸模式
  const [showConfessionModal, setShowConfessionModal] = useState(false); // 泥棒自白信 Modal
  const [isAlbumCollapsed, setIsAlbumCollapsed] = useState(false); // 详情页卡片折叠状态

  // 评论相关状态
  const [comments, setComments] = useState([
    { id: 1, author: 'n-buna', text: '「盗作」の音楽を聴いてくれてありがとう。', hasImage: false, hasAudio: true, repliesCount: 12 },
    { id: 2, author: 'suis', text: '夏の匂いがする曲たち。', hasImage: true, hasAudio: false, repliesCount: 5 },
    { id: 3, author: '鹿友A', text: '这封信里的文字真的太触动了，那年的盗作与エルマ...', hasImage: false, hasAudio: false, repliesCount: 2 }
  ]);
  const [newComment, setNewComment] = useState('');
  const [nickname, setNickname] = useState('');
  const [deletePwd, setDeletePwd] = useState('');

  // 响应 URL 参数的专辑切换
  useEffect(() => {
    if (queryAlbumId) {
      const found = YORUSHIKA_DISCOGRAPHY.find(a => String(a.id) === String(queryAlbumId));
      if (found) setCurrentAlbum(found);
    }
  }, [queryAlbumId]);

  // 模拟播放器计时器
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => (prev >= duration ? 0 : prev + 1));
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // 循环模式切换逻辑
  const togglePlayMode = () => {
    const modes = ['loop', 'random', 'single', 'none'];
    const nextIdx = (modes.indexOf(playMode) + 1) % modes.length;
    setPlayMode(modes[nextIdx]);
  };

  const getPlayModeLabel = () => {
    switch (playMode) {
      case 'random': return '🔀 随机';
      case 'loop': return '🔁 列表';
      case 'single': return '🔂 单曲';
      default: return '➡️ 顺序';
    }
  };

  return (
    <>
      <Head>
        <title>{currentAlbum.name} - ヨルシカ 沉浸播放器</title>
      </Head>

      {/* 沉浸模式全屏/横屏层 */}
      {isImmersion ? (
        <div 
          onClick={() => setIsImmersion(false)}
          className="fixed inset-0 z-50 bg-zinc-950 text-zinc-100 flex flex-col justify-between p-6 sm:p-12 cursor-pointer select-none animate-in fade-in duration-500"
        >
          {/* 顶部极简标题 */}
          <div className="flex justify-between items-center text-xs font-mono opacity-60">
            <div>{currentAlbum.name} — ヨルシカ</div>
            <div className="text-[10px]">点击任意位置退出沉浸模式</div>
          </div>

          {/* 中央滚动歌词区域 */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 my-8 text-center overflow-hidden">
            {SAMPLE_LYRICS.map((lyric, idx) => {
              const isCurrent = currentTime >= lyric.time && (idx === SAMPLE_LYRICS.length - 1 || currentTime < SAMPLE_LYRICS[idx + 1].time);
              return (
                <p 
                  key={idx}
                  className={`transition-all duration-500 font-serif ${
                    isCurrent 
                      ? 'text-lg sm:text-2xl text-[#a5c9ca] font-medium scale-105 drop-shadow-md' 
                      : 'text-sm sm:text-base opacity-30 blur-[0.5px]'
                  }`}
                >
                  {lyric.text}
                </p>
              );
            })}
          </div>

          {/* 谷歌 Pixel 风格动态波浪进度条 + 底部极简控件 */}
          <div className="w-full max-w-2xl mx-auto space-y-4" onClick={(e) => e.stopPropagation()}>
            {/* 动态波浪 SVG 进度条 */}
            <div className="relative h-3 w-full bg-zinc-800/80 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 bottom-0 bg-[#a5c9ca] transition-all duration-300"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              {/* 波浪 SVG 装饰 */}
              <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 10">
                <path d="M0,5 Q25,0 50,5 T100,5 V10 H0 Z" fill="#ffffff" />
              </svg>
            </div>

            {/* 底部 5 个控制按钮 */}
            <div className="flex justify-between items-center font-mono text-xs px-2 text-zinc-300">
              <button onClick={togglePlayMode} className="hover:text-[#a5c9ca]">{getPlayModeLabel()}</button>
              <button onClick={() => setCurrentTime(Math.max(0, currentTime - 10))} className="hover:text-[#a5c9ca]">⏮ 上一首</button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className="w-10 h-10 rounded-full bg-[#a5c9ca] text-zinc-900 font-bold flex items-center justify-center shadow-lg hover:scale-105 transition"
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))} className="hover:text-[#a5c9ca]">⏭ 下一首</button>
              <button onClick={() => setShowConfessionModal(true)} className="hover:text-[#a5c9ca]">✉ 自白</button>
            </div>
          </div>
        </div>
      ) : (
        /* 标准响应式页面结构 (电脑端三栏并排, 移动端 Tab 切换) */
        <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans flex flex-col justify-between">
          
          {/* 顶部 Header */}
          <header className="px-6 py-4 border-b border-zinc-800/80 flex justify-between items-center backdrop-blur-md bg-zinc-900/40">
            <Link href="/" className="font-mono text-xs text-zinc-400 hover:text-[#a5c9ca] transition flex items-center gap-2">
              <span>←</span>
              <span>RETURN TO TILES</span>
            </Link>
            
            <div className="text-xs font-serif text-zinc-300 tracking-widest">
              {currentAlbum.name}
            </div>

            <button 
              onClick={() => setShowConfessionModal(true)}
              className="px-3 py-1 bg-[#a5c9ca]/20 text-[#a5c9ca] border border-[#a5c9ca]/40 text-xs font-mono hover:bg-[#a5c9ca] hover:text-zinc-950 transition"
            >
              ✉ 盗作自白信
            </button>
          </header>

          {/* 移动端 Tab 导航条 */}
          <div className="sm:hidden flex border-b border-zinc-800 text-xs font-mono text-center">
            <button 
              onClick={() => setActiveTab(0)} 
              className={`flex-1 py-2.5 ${activeTab === 0 ? 'text-[#a5c9ca] border-b-2 border-[#a5c9ca]' : 'text-zinc-500'}`}
            >
              详情
            </button>
            <button 
              onClick={() => setActiveTab(1)} 
              className={`flex-1 py-2.5 ${activeTab === 1 ? 'text-[#a5c9ca] border-b-2 border-[#a5c9ca]' : 'text-zinc-500'}`}
            >
              播放器
            </button>
            <button 
              onClick={() => setActiveTab(2)} 
              className={`flex-1 py-2.5 ${activeTab === 2 ? 'text-[#a5c9ca] border-b-2 border-[#a5c9ca]' : 'text-zinc-500'}`}
            >
              评论
            </button>
          </div>

          {/* 主内容区域 (电脑端 3 栏，手机端按 activeTab 显示) */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
            
            {/* === 左栏：专辑详情页 (电脑端/Mobile Tab 0) === */}
            <div className={`sm:col-span-3 space-y-4 ${activeTab === 0 ? 'block' : 'hidden sm:block'}`}>
              
              {/* 专辑可折叠毛玻璃卡片 */}
              <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-4 rounded-none transition-all">
                <div 
                  onClick={() => setIsAlbumCollapsed(!isAlbumCollapsed)}
                  className="flex items-center justify-between cursor-pointer border-b border-zinc-800/80 pb-3 mb-3"
                >
                  <div className="flex items-center space-x-3">
                    <img src={currentAlbum.cover} alt="Cover" className="w-10 h-10 object-cover" />
                    <div>
                      <h4 className="text-xs font-serif text-zinc-100">{currentAlbum.name}</h4>
                      <p className="text-[10px] font-mono text-zinc-500">{currentAlbum.date}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">{isAlbumCollapsed ? '+' : '-'}</span>
                </div>

                {!isAlbumCollapsed && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <p className="text-xs font-serif italic text-[#a5c9ca] leading-relaxed">
                      {currentAlbum.quote}
                    </p>
                    <div className="text-[11px] font-mono text-zinc-400 space-y-1">
                      <div>曲目类型: {currentAlbum.type}</div>
                      <div>包含曲目: {currentAlbum.tracks}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 紧贴的专辑切换列表 */}
              <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800 p-3 max-h-[360px] overflow-y-auto no-scrollbar space-y-1.5">
                <div className="text-[10px] font-mono text-zinc-500 mb-2 uppercase">DISCOGRAPHY LIST</div>
                {YORUSHIKA_DISCOGRAPHY.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setCurrentAlbum(item)}
                    className={`p-2 text-xs font-serif cursor-pointer flex items-center space-x-2 transition ${
                      currentAlbum.id === item.id 
                        ? 'bg-[#a5c9ca]/20 text-[#a5c9ca] border-l-2 border-[#a5c9ca]' 
                        : 'hover:bg-zinc-800/50 text-zinc-400'
                    }`}
                  >
                    <img src={item.cover} className="w-6 h-6 object-cover shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* === 中栏：播放器主页 (电脑端/Mobile Tab 1) === */}
            <div className={`sm:col-span-6 flex flex-col items-center justify-between space-y-6 ${activeTab === 1 ? 'block' : 'hidden sm:block'}`}>
              
              {/* 大封面与沉浸点击入口 */}
              <div 
                onClick={() => setIsImmersion(true)}
                className="relative group cursor-pointer w-64 h-64 sm:w-80 sm:h-80 shadow-2xl overflow-hidden border border-zinc-800"
              >
                <img 
                  src={currentAlbum.cover} 
                  alt={currentAlbum.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center backdrop-blur-xs text-white">
                  <span className="text-2xl mb-1">🔍</span>
                  <span className="text-xs font-mono tracking-widest">点击进入沉浸歌词模式</span>
                </div>
              </div>

              {/* 当前歌曲歌词前瞻 */}
              <div 
                onClick={() => setIsImmersion(true)}
                className="w-full bg-zinc-900/40 backdrop-blur-md border border-zinc-800 p-4 text-center cursor-pointer hover:border-zinc-700 transition"
              >
                <span className="text-[10px] font-mono text-[#a5c9ca] uppercase block mb-1">CURRENT LYRICS</span>
                <p className="text-sm font-serif italic text-zinc-200">
                  {SAMPLE_LYRICS[0].text}
                </p>
              </div>

              {/* Pixel 动态波浪进度条与控件 */}
              <div className="w-full bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-4 space-y-4">
                <div className="relative h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 bottom-0 bg-[#a5c9ca] transition-all duration-300"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between items-center font-mono text-xs text-zinc-300 px-2">
                  <button onClick={togglePlayMode} className="hover:text-[#a5c9ca]">{getPlayModeLabel()}</button>
                  <button onClick={() => setCurrentTime(Math.max(0, currentTime - 10))} className="hover:text-[#a5c9ca]">⏮ 上一首</button>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)} 
                    className="w-10 h-10 rounded-full bg-[#a5c9ca] text-zinc-900 font-bold flex items-center justify-center shadow-lg hover:scale-105 transition"
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                  <button onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))} className="hover:text-[#a5c9ca]">⏭ 下一首</button>
                  <button onClick={() => setIsImmersion(true)} className="hover:text-[#a5c9ca]">全屏</button>
                </div>
              </div>

            </div>

            {/* === 右栏：评论与自白区域 (电脑端/Mobile Tab 2) === */}
            <div className={`sm:col-span-3 space-y-4 ${activeTab === 2 ? 'block' : 'hidden sm:block'}`}>
              
              <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-4 flex flex-col justify-between h-[480px]">
                <div className="border-b border-zinc-800 pb-2 mb-3 flex justify-between items-center">
                  <span className="text-xs font-mono text-[#a5c9ca] uppercase">REPLIES & COMMENTS</span>
                  <span className="text-[10px] font-mono text-zinc-500">{comments.length} 条</span>
                </div>

                {/* 评论列表 */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
                  {comments.map((item) => (
                    <div key={item.id} className="bg-zinc-950/60 p-3 border border-zinc-800/80 text-xs font-serif space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                        <span className="text-[#a5c9ca]">{item.author}</span>
                        <div className="flex gap-1.5">
                          {item.hasImage && <span className="text-amber-300">[图]</span>}
                          {item.hasAudio && <span className="text-teal-300">[音]</span>}
                        </div>
                      </div>
                      <p className="text-zinc-300 line-clamp-2">{item.text}</p>
                      <div className="text-[9px] font-mono text-zinc-500 text-right">
                        回复 ({item.repliesCount})
                      </div>
                    </div>
                  ))}
                </div>

                {/* 底部评论输入框 */}
                <div className="pt-3 border-t border-zinc-800 space-y-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="昵称" 
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-1/2 bg-zinc-950 border border-zinc-800 p-1.5 text-xs text-zinc-200 rounded-none focus:outline-none focus:border-[#a5c9ca]" 
                    />
                    <input 
                      type="password" 
                      placeholder="删除密码" 
                      value={deletePwd}
                      onChange={(e) => setDeletePwd(e.target.value)}
                      className="w-1/2 bg-zinc-950 border border-zinc-800 p-1.5 text-xs text-zinc-200 rounded-none focus:outline-none focus:border-[#a5c9ca]" 
                    />
                  </div>

                  <div className="flex gap-2">
                    <button className="px-2.5 py-1 bg-zinc-800 text-zinc-300 text-xs font-mono hover:bg-zinc-700">
                      +
                    </button>
                    <input 
                      type="text" 
                      placeholder="写下你对这首音乐的感想..." 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 p-1.5 text-xs text-zinc-200 rounded-none focus:outline-none focus:border-[#a5c9ca]" 
                    />
                    <button 
                      onClick={() => {
                        if (newComment) {
                          setComments([{ id: Date.now(), author: nickname || '鹿友', text: newComment, repliesCount: 0 }, ...comments]);
                          setNewComment('');
                        }
                      }}
                      className="px-3 py-1 bg-[#a5c9ca] text-zinc-950 font-mono text-xs font-bold"
                    >
                      发送
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </main>
        </div>
      )}

      {/* ✉ 《音乐泥棒的自白》Modal 弹窗 */}
      {showConfessionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-700 max-w-xl w-full p-6 sm:p-8 space-y-6 text-zinc-200 font-serif max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl">
            <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-[#a5c9ca] tracking-widest uppercase block">YORUSHIKA CONFESSION</span>
                <h3 className="text-base sm:text-lg font-medium">《音楽泥棒の自白》/ 音乐泥棒的自白</h3>
              </div>
              <button onClick={() => setShowConfessionModal(false)} className="text-zinc-400 hover:text-white font-mono text-sm">✕</button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-zinc-300 italic font-light">
              <p>「我偷走了 n-buna 的音乐。」</p>
              <p>
                曾经在某一个夏日的街角，我听到了那声音——那是比夏天还要炙热、比晚霞还要寂寞的旋律。
                从那一刻起，我决定将他的呼吸、他的吉他声、以及他写在信笺上的每句诗，全盘掠夺。
              </p>
              <p>
                这并非为了名利，也不是为了证明什么。只是因为，如果不把这些歌唱出来，我的胸口就会像空掉了一块一样。
              </p>
              <p className="text-[#a5c9ca]">
                「エルマ、如果你听到了这些歌，请不要原谅我。」
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
              <button 
                onClick={() => setShowConfessionModal(false)}
                className="px-5 py-2 bg-[#a5c9ca] text-zinc-950 font-mono text-xs font-bold hover:bg-[#88abac] transition"
              >
                解封与收下自白
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
