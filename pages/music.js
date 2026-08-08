import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { YORUSHIKA_DISCOGRAPHY } from '../lib/discography';

// 示例歌词 (支持日中混合)
const SAMPLE_LYRICS = [
  { time: 0, ja: "音楽の盗作をして生きていた", zh: "我靠着盗作别人的音乐度过了半生" },
  { time: 6, ja: "それが僕のすべてだった", zh: "那就是我生命的全部" },
  { time: 12, ja: "哀しい歌ばかりを書いていた", zh: "写尽了所有悲伤的歌" },
  { time: 18, ja: "君の心が知りたくて", zh: "只为了窥探你的内心" },
  { time: 25, ja: "言葉に出来ないから、歌を歌うことにした", zh: "无法化作言语，于是我选择歌唱" },
  { time: 35, ja: "ただ君に晴れ。夏の匂いがした", zh: "唯愿为你放晴。空气里全是夏天的味道" },
  { time: 45, ja: "エルマ、君へ。僕の音楽をすべてあげる", zh: "艾尔玛，献给你。我将我所有的音乐全数赠你" },
];

export default function MusicPage() {
  const router = useRouter();
  const { album: queryAlbumId } = router.query;

  // 全局专辑与播放状态
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState('loop'); // 'random' | 'loop' | 'single' | 'none'
  const [mediaType, setMediaType] = useState('audio'); // 'audio' | 'mv'
  const [coverShape, setCoverShape] = useState('square'); // 'square' | 'circle' | 'rotate'
  
  // 提取的主色 (用于全背景填充)
  const [bgColor, setBgColor] = useState('#ffffff');
  
  // 自白书 Modal 状态与滑动撕开手势
  const [showConfession, setShowConfession] = useState(true);
  const touchStartPos = useRef({ x: 0, y: 0 });

  // 手机端三栏滑动状态 (0=详情, 1=播放器, 2=评论)
  const [activeMobileTab, setActiveMobileTab] = useState(1);
  const [isImmersion, setIsImmersion] = useState(false); // 沉浸歌词模式
  const [isAlbumCollapsed, setIsAlbumCollapsed] = useState(false); // 详情卡片折叠
  
  // 导航栏显示/隐藏状态
  const [showNav, setShowNav] = useState(false);

  // 评论数据
  const [comments, setComments] = useState([
    { id: 1, author: 'n-buna', text: '「盗作」の音楽を聴いてくれてありがとう。', hasImage: false, hasAudio: true, replies: 12 },
    { id: 2, author: 'suis', text: '夏の匂いがする曲たち。', hasImage: true, hasAudio: false, replies: 5 },
    { id: 3, author: '鹿友', text: '这封信里的文字真的太触动了，那年的盗作与エルマ...', hasImage: false, hasAudio: false, replies: 2 }
  ]);
  const [newComment, setNewComment] = useState('');
  const [nickname, setNickname] = useState('');
  const [deletePwd, setDeletePwd] = useState('');

  // 监听 URL 专辑参数，若无参数则呈全白未选曲状态
  useEffect(() => {
    if (queryAlbumId) {
      const found = YORUSHIKA_DISCOGRAPHY.find(a => String(a.id) === String(queryAlbumId));
      if (found) {
        setCurrentAlbum(found);
        setBgColor('#18181b'); // 简易背景取色，可扩展 Pixel 动态取色
      }
    }
  }, [queryAlbumId]);

  // 选择专辑
  const handleSelectAlbum = (album) => {
    setCurrentAlbum(album);
    setCurrentTrackIndex(0);
    setBgColor('#18181b');
  };

  // 四向滑动撕开自白书 (手机端手势)
  const handleTouchStartConfession = (e) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEndConfession = (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartPos.current.x;
    const deltaY = endY - touchStartPos.current.y;

    // 滑动距离大于 50px 则判定撕开成功
    if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
      setShowConfession(false);
    }
  };

  // 切换封面形态
  const toggleCoverShape = () => {
    const shapes = ['square', 'circle', 'rotate'];
    const next = shapes[(shapes.indexOf(coverShape) + 1) % shapes.length];
    setCoverShape(next);
  };

  return (
    <>
      <Head>
        <title>{currentAlbum ? `${currentAlbum.name} - ヨルシカ` : 'MUSIC - ヨルシカ'}</title>
      </Head>

      {/* ===== 动态唤出的悬浮导航栏 ===== */}
      <div 
        onMouseEnter={() => setShowNav(true)}
        onMouseLeave={() => setShowNav(false)}
        className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ${
          showNav ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-6 py-3 flex justify-between items-center text-xs font-mono text-zinc-300">
          <Link href="/" className="hover:text-[#a5c9ca]">← INDEX</Link>
          <span className="font-serif">{currentAlbum ? currentAlbum.name : '音楽泥棒の自白'}</span>
          <button onClick={() => setShowConfession(true)} className="hover:text-[#a5c9ca]">自白書</button>
        </div>
      </div>

      {/* 顶部隐形下拉触敏条 */}
      <div 
        onMouseEnter={() => setShowNav(true)}
        className="fixed top-0 left-0 right-0 h-3 z-30 cursor-pointer"
      />

      {/* ===== 页面整体主容器 (全屏专辑取色填充) ===== */}
      <div 
        className="min-h-screen text-zinc-100 font-sans transition-colors duration-700 relative overflow-hidden"
        style={{
          backgroundColor: currentAlbum ? bgColor : '#f8f8f6',
          color: currentAlbum ? '#f4f4f5' : '#09090b'
        }}
      >
        {/* 背景高斯模糊与暗色遮罩 */}
        {currentAlbum && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-25 filter blur-3xl scale-125">
            <img src={currentAlbum.cover} className="w-full h-full object-cover" />
          </div>
        )}

        {/* ===== 未选曲状态 (从 MENU 点击进入全白背景) ===== */}
        {!currentAlbum ? (
          <div className="relative z-10 max-w-4xl mx-auto min-h-screen flex flex-col justify-center items-center p-8 text-center space-y-6">
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">NO ALBUM SELECTED</span>
            <h1 className="text-2xl sm:text-3xl font-serif tracking-widest">音楽泥棒の自白・曲目選択</h1>
            <p className="text-xs font-serif text-zinc-500 max-w-md leading-relaxed">
              请从下方专辑列表中选择一张专辑以加载盗作音乐与自白。
            </p>

            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              {YORUSHIKA_DISCOGRAPHY.slice(0, 8).map((album) => (
                <div 
                  key={album.id}
                  onClick={() => handleSelectAlbum(album)}
                  className="bg-white/80 border border-zinc-200 p-3 text-left cursor-pointer hover:border-black transition space-y-2 shadow-sm"
                >
                  <img src={album.cover} className="w-full aspect-square object-cover" />
                  <p className="text-xs font-serif font-medium truncate text-zinc-900">{album.name}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ===== 已选曲：三栏响应式结构 ===== */
          <div className="relative z-10 max-w-7xl mx-auto min-h-screen p-4 sm:p-8 flex flex-col justify-between">
            
            {/* 手机端 Mini 顶栏 */}
            <div className="sm:hidden flex items-center justify-between bg-zinc-900/80 backdrop-blur-md p-2.5 border border-zinc-800 text-xs font-mono mb-4">
              <span className="truncate max-w-[200px]">{currentAlbum.name}</span>
              <div className="flex gap-2">
                <button onClick={() => setActiveMobileTab(0)} className={activeMobileTab === 0 ? 'text-[#a5c9ca]' : 'text-zinc-500'}>详情</button>
                <button onClick={() => setActiveMobileTab(1)} className={activeMobileTab === 1 ? 'text-[#a5c9ca]' : 'text-zinc-500'}>播放</button>
                <button onClick={() => setActiveMobileTab(2)} className={activeMobileTab === 2 ? 'text-[#a5c9ca]' : 'text-zinc-500'}>评论</button>
              </div>
            </div>

            {/* 三栏并排 (电脑端) / Tab 切换 (手机端) */}
            <main className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start my-auto">
              
              {/* === 左栏：详情页 (折叠专辑卡片 + 紧贴歌曲列表) === */}
              <div className={`sm:col-span-3 space-y-3 ${activeMobileTab === 0 ? 'block' : 'hidden sm:block'}`}>
                {/* 1. 折叠专辑卡片 (毛玻璃长方形) */}
                <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-4">
                  <div 
                    onClick={() => setIsAlbumCollapsed(!isAlbumCollapsed)}
                    className="flex justify-between items-center cursor-pointer border-b border-zinc-800 pb-2 mb-2"
                  >
                    <span className="text-xs font-mono text-[#a5c9ca]">ALBUM INFO</span>
                    <span className="text-xs font-mono text-zinc-500">{isAlbumCollapsed ? '+' : '-'}</span>
                  </div>

                  {!isAlbumCollapsed && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <img src={currentAlbum.cover} className="w-full h-32 object-cover border border-zinc-800" />
                      <h3 className="text-sm font-serif font-medium">{currentAlbum.name}</h3>
                      <p className="text-xs font-serif italic text-zinc-400">{currentAlbum.quote}</p>
                    </div>
                  )}
                </div>

                {/* 2. 紧贴的长方形毛玻璃歌曲列表 */}
                <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-3 space-y-1 max-h-[380px] overflow-y-auto no-scrollbar">
                  <span className="text-[10px] font-mono text-zinc-500 block mb-2">TRACKLIST</span>
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentTrackIndex(idx)}
                      className={`p-2 text-xs font-serif cursor-pointer flex justify-between items-center transition ${
                        currentTrackIndex === idx ? 'bg-[#a5c9ca]/20 text-[#a5c9ca]' : 'hover:bg-zinc-800/40 text-zinc-300'
                      }`}
                    >
                      <span>0{idx + 1}. Track Title Sample</span>
                      <span className="text-[10px] font-mono text-zinc-500">03:45</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* === 中栏：播放器主页 (含大视窗 MV 模式与 3 种封面形态) === */}
              <div className={`sm:col-span-6 flex flex-col items-center space-y-6 ${activeMobileTab === 1 ? 'block' : 'hidden sm:block'}`}>
                
                {/* 音源 / MV 模式切换标签 */}
                <div className="flex border border-zinc-800 bg-zinc-900/80 font-mono text-xs">
                  <button 
                    onClick={() => setMediaType('audio')}
                    className={`px-4 py-1.5 ${mediaType === 'audio' ? 'bg-[#a5c9ca] text-zinc-950 font-bold' : 'text-zinc-400'}`}
                  >
                    AUDIO 模式
                  </button>
                  <button 
                    onClick={() => setMediaType('mv')}
                    className={`px-4 py-1.5 ${mediaType === 'mv' ? 'bg-[#a5c9ca] text-zinc-950 font-bold' : 'text-zinc-400'}`}
                  >
                    MV 沉浸模式
                  </button>
                </div>

                {/* MV 大视窗模式 vs 封面播放模式 */}
                {mediaType === 'mv' ? (
                  /* 大视窗沉浸 MV 播放框 */
                  <div className="w-full aspect-video bg-black border border-zinc-800 shadow-2xl relative overflow-hidden flex items-center justify-center group">
                    <iframe 
                      className="w-full h-full pointer-events-auto"
                      src="https://player.bilibili.com/player.html?bvid=BV134411c7A2&page=1&high_quality=1" 
                      scrolling="no" 
                      frameBorder="0" 
                      allowFullScreen={true}
                    />
                  </div>
                ) : (
                  /* AUDIO 模式 3 种封面形态 (方形 / 圆形 / 转动黑胶) */
                  <div 
                    onClick={toggleCoverShape}
                    className="relative cursor-pointer group flex items-center justify-center my-4"
                  >
                    <div className={`w-60 h-60 sm:w-72 sm:h-72 overflow-hidden border border-zinc-800 shadow-2xl transition-all duration-700 ${
                      coverShape === 'circle' ? 'rounded-full' :
                      coverShape === 'rotate' ? 'rounded-full animate-spin-slow' : 'rounded-none'
                    }`}>
                      <img src={currentAlbum.cover} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-mono">
                      点击切换形态 ({coverShape})
                    </div>
                  </div>
                )}

                {/* 双行中日歌词预览 (点击进入全屏沉浸) */}
                <div 
                  onClick={() => setIsImmersion(true)}
                  className="w-full bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-4 text-center cursor-pointer hover:border-zinc-700 space-y-1"
                >
                  <p className="text-sm font-serif text-zinc-100">{SAMPLE_LYRICS[0].ja}</p>
                  <p className="text-xs font-serif text-zinc-400">{SAMPLE_LYRICS[0].zh}</p>
                </div>

                {/* Google Pixel 动态波浪进度条与控件 */}
                <div className="w-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-4 space-y-4">
                  <div className="relative h-2 w-full bg-zinc-800 overflow-hidden">
                    <div className="absolute top-0 left-0 bottom-0 bg-[#a5c9ca] w-1/3" />
                  </div>

                  <div className="flex justify-between items-center font-mono text-xs text-zinc-300">
                    <button onClick={() => setPlayMode(playMode === 'loop' ? 'random' : 'loop')}>{playMode}</button>
                    <button>PREV</button>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-8 h-8 rounded-full bg-[#a5c9ca] text-zinc-950 font-bold flex items-center justify-center"
                    >
                      {isPlaying ? 'PAUSE' : 'PLAY'}
                    </button>
                    <button>NEXT</button>
                    <button onClick={() => setIsImmersion(true)}>FULL</button>
                  </div>
                </div>

              </div>

              {/* === 右栏：评论页 (UI 与详情页完全一致) === */}
              <div className={`sm:col-span-3 space-y-3 ${activeMobileTab === 2 ? 'block' : 'hidden sm:block'}`}>
                <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-4 h-[460px] flex flex-col justify-between">
                  <div className="border-b border-zinc-800 pb-2 mb-2 flex justify-between items-center">
                    <span className="text-xs font-mono text-[#a5c9ca]">COMMENTS</span>
                    <span className="text-[10px] font-mono text-zinc-500">{comments.length} 条</span>
                  </div>

                  {/* 评论列表 (毛玻璃卡片) */}
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pr-1">
                    {comments.map((item) => (
                      <div key={item.id} className="bg-zinc-950/60 p-2.5 border border-zinc-800 text-xs font-serif space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                          <span className="text-[#a5c9ca]">{item.author}</span>
                          <div>
                            {item.hasImage && <span className="text-amber-300 mr-1">[含图]</span>}
                            {item.hasAudio && <span className="text-teal-300">[音频]</span>}
                          </div>
                        </div>
                        <p className="text-zinc-300">{item.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* 评论输入框 */}
                  <div className="pt-3 border-t border-zinc-800 space-y-2">
                    <div className="flex gap-2 text-xs">
                      <input type="text" placeholder="昵称" value={nickname} onChange={e=>setNickname(e.target.value)} className="w-1/2 bg-zinc-950 border border-zinc-800 p-1 rounded-none" />
                      <input type="password" placeholder="删除密码" value={deletePwd} onChange={e=>setDeletePwd(e.target.value)} className="w-1/2 bg-zinc-950 border border-zinc-800 p-1 rounded-none" />
                    </div>
                    <div className="flex gap-1.5">
                      <button className="px-2 bg-zinc-800 text-xs font-mono">+</button>
                      <input type="text" placeholder="写下评论..." value={newComment} onChange={e=>setNewComment(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 p-1 text-xs rounded-none" />
                      <button className="px-3 bg-[#a5c9ca] text-zinc-950 font-mono text-xs font-bold">发送</button>
                    </div>
                  </div>
                </div>
              </div>

            </main>
          </div>
        )}

      </div>

      {/* ===== ✉ 《音楽泥棒の自白》撕封/解封 Modal ===== */}
      {showConfession && (
        <div 
          onTouchStart={handleTouchStartConfession}
          onTouchEnd={handleTouchEndConfession}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-500"
        >
          <div className="bg-zinc-900 border border-zinc-700 max-w-xl w-full p-6 sm:p-8 text-zinc-200 font-serif space-y-6 relative shadow-2xl">
            {/* 电脑端右上角 ✕ 按钮 */}
            <button 
              onClick={() => setShowConfession(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white font-mono text-sm hidden sm:block"
            >
              ✕
            </button>

            <div className="border-b border-zinc-800 pb-3">
              <span className="text-[10px] font-mono text-[#a5c9ca] block uppercase">CONFESSION OF A MUSIC THIEF</span>
              <h2 className="text-base sm:text-lg font-medium">《音楽泥棒の自白》/ 盗作自白</h2>
            </div>

            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-zinc-300 italic">
              <p>「僕には音楽の盗作をして生きていく覚悟があった。」</p>
              <p>我曾向夏日的街道发誓，要偷走他吉他上的每一声叹息。那些未被听见的旋律、未被寄出的信件，如今都化作了我的呼吸。</p>
              <p className="text-[#a5c9ca]">「エルマ、君の音楽を奪った僕を、どうか許さないでほしい。」</p>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-between items-center text-[10px] font-mono text-zinc-500">
              <span className="sm:hidden">← 上下左右滑动撕开信封 →</span>
              <span className="hidden sm:inline">点击右上角关闭或解封</span>
              <span className="text-zinc-400">© UMI / YORUSHIKA</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
