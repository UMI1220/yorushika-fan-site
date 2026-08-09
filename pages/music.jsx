import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Layout, { useAudio } from '../components/Layout';

// 示例歌词 (包含《言の葉》《夏の幻》金句)
const SAMPLE_LYRICS = [
  { time: 0, ja: "言の葉が舞う、夏の幻のようだ", zh: "言之叶飘落，宛如夏日的幻影" },
  { time: 8, ja: "音楽の盗作をして生きていた", zh: "我靠着盗作别人的音乐度过了半生" },
  { time: 16, ja: "カトレアの花が咲いた、夏が始まる", zh: "嘉德丽雅兰绽放了，夏天拉开序幕" },
  { time: 24, ja: "言葉に出来ないから、歌を歌うことにした", zh: "无法化作言语，于是我选择歌唱" },
  { time: 32, ja: "ただ君に晴れ。夏の匂いがした", zh: "唯愿为你放晴。空气里全是夏天的味道" },
  { time: 42, ja: "エルマ、君へ。僕の音楽をすべてあげる", zh: "艾尔玛，献给你。我将我所有的音乐全数赠你" },
];

export default function MusicPage() {
  const { isPlaying, setIsPlaying, currentTrack, setCurrentTrack, theme } = useAudio();

  // 1. 移动端三段式视图状态: 'left' (详情) | 'center' (播放器) | 'right' (评论)
  const [activeTab, setActiveTab] = useState('center');

  // 2. 封面 3 模式切换: 'SQUARE' (圆角矩形) | 'DISC' (静态圆形) | 'ROTATE' (转动圆形)
  const [coverMode, setCoverMode] = useState('SQUARE');

  // 3. 全屏沉浸歌词模式
  const [isLyricImmersive, setIsLyricImmersive] = useState(false);

  // 4. 《音楽泥棒の自白》版权申诉弹窗
  const [showConfessionModal, setShowConfessionModal] = useState(false);

  // 循环模式: 'LOOP' | 'RANDOM' | 'SINGLE' | 'NONE'
  const [repeatMode, setRepeatMode] = useState('LOOP');

  // 评论展开二级回复 ID
  const [expandedCommentId, setExpandedCommentId] = useState(null);

  // 横屏检测 (电脑端强制 / 手机横屏)
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Layout>
      <Head>
        <title>{currentTrack ? `${currentTrack.title} · MUSIC` : 'MUSIC / 音楽泥棒の庭'}</title>
      </Head>

      {/* 动态取色背景容器: [月光] 模式下压暗 (Ambient Dimmed) */}
      <div
        className={`min-h-screen transition-all duration-700 relative overflow-hidden flex flex-col justify-between ${
          theme === 'gekkou' ? 'brightness-75' : 'brightness-100'
        }`}
        style={{
          background: `radial-gradient(circle at 50% 30%, #88abac33 0%, transparent 70%), 
                      linear-gradient(to bottom, ${theme === 'gekkou' ? '#09090b' : '#f4f3ef'}, ${theme === 'gekkou' ? '#18181b' : '#e4e3df'})`,
        }}
      >
        {/* 顶部辅助工具栏: 自白申诉入口 & 移动端 Tab 切换 */}
        <div className="pt-16 pb-2 px-4 max-w-6xl mx-auto w-full flex justify-between items-center font-mono text-[10px] z-10 border-b border-current/10">
          <button
            type="button"
            onClick={() => setShowConfessionModal(true)}
            className="hover:underline text-[#88abac] font-bold tracking-wider"
          >
            [ 音楽泥棒の自白 / CONFESSION ]
          </button>

          {/* 移动端 3 段式手势标签栏 */}
          <div className="flex sm:hidden space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('left')}
              className={`px-2 py-0.5 ${activeTab === 'left' ? 'bg-[#88abac] text-zinc-950 font-bold' : 'opacity-50'}`}
            >
              INFO
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('center')}
              className={`px-2 py-0.5 ${activeTab === 'center' ? 'bg-[#88abac] text-zinc-950 font-bold' : 'opacity-50'}`}
            >
              PLAYER
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('right')}
              className={`px-2 py-0.5 ${activeTab === 'right' ? 'bg-[#88abac] text-zinc-950 font-bold' : 'opacity-50'}`}
            >
              REPLY
            </button>
          </div>
        </div>

        {/* 主内容区域: 电脑端三栏并排 / 移动端丝滑切屏 */}
        <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 items-start font-serif">

          {/* 👈 左栏: 详情卡片 & 紧贴曲目列表 (Left View) */}
          <div className={`space-y-4 ${activeTab === 'left' || 'hidden sm:block'}`}>
            <div className="p-4 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-current/10 shadow-lg space-y-3">
              <div className="text-[10px] font-mono text-[#88abac] tracking-widest uppercase">
                ALBUM DETAILS / 盗作
              </div>
              <h2 className="text-lg font-medium">《だから僕は音楽を辞めた》</h2>
              <p className="text-xs italic opacity-70 leading-relaxed">
                「カトレアの花が咲いた、夏が始まる。言の葉は夏の幻のようだ。」
              </p>
            </div>

            {/* 紧贴的长方形毛玻璃曲目卡片 */}
            <div className="space-y-1">
              <div className="text-[9px] font-mono opacity-50 px-1 mb-1">TRACKLIST</div>
              {['言の葉', '夏の幻', 'だから僕は音楽を辞めた', 'エルマ'].map((title, i) => (
                <div
                  key={i}
                  className="p-3 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-sm border border-current/5 hover:bg-[#88abac]/20 cursor-pointer flex justify-between items-center transition"
                >
                  <span className="text-xs">{`0${i + 1}. ${title}`}</span>
                  <span className="text-[9px] font-mono opacity-40">[ PLAY ]</span>
                </div>
              ))}
            </div>
          </div>

          {/* ⏺️ 中栏: 播放器核心 (Center View) */}
          <div className={`flex flex-col items-center justify-center space-y-6 ${activeTab === 'center' || 'hidden sm:block'}`}>
            
            {/* 封面区域 3 模式切换控制器 (无 Emoji) */}
            <div className="flex space-x-2 font-mono text-[9px]">
              <button
                type="button"
                onClick={() => setCoverMode('SQUARE')}
                className={`px-2 py-0.5 border border-current/20 ${coverMode === 'SQUARE' ? 'bg-[#88abac] text-zinc-950 font-bold' : ''}`}
              >
                [ SQUARE ]
              </button>
              <button
                type="button"
                onClick={() => setCoverMode('DISC')}
                className={`px-2 py-0.5 border border-current/20 ${coverMode === 'DISC' ? 'bg-[#88abac] text-zinc-950 font-bold' : ''}`}
              >
                [ DISC ]
              </button>
              <button
                type="button"
                onClick={() => setCoverMode('ROTATE')}
                className={`px-2 py-0.5 border border-current/20 ${coverMode === 'ROTATE' ? 'bg-[#88abac] text-zinc-950 font-bold' : ''}`}
              >
                [ ROTATE ]
              </button>
            </div>

            {/* 封面主体 (坚果 OS 悬浮卡片投影) */}
            <div
              className={`w-64 h-64 bg-cover bg-center transition-all duration-700 shadow-2xl relative ${
                coverMode === 'SQUARE' ? 'rounded-2xl' : 'rounded-full border-4 border-zinc-900/50'
              } ${coverMode === 'ROTATE' && isPlaying ? 'animate-spin' : ''}`}
              style={{
                backgroundImage: `url(${currentTrack?.cover || '/covers/01.jpg'})`,
                animationDuration: '20s',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              }}
            >
              {/* 圆形唱片中心微孔 (DISC/ROTATE 模式) */}
              {coverMode !== 'SQUARE' && (
                <div className="absolute inset-0 m-auto w-10 h-10 bg-zinc-950 rounded-full border-2 border-white/20" />
              )}
            </div>

            {/* 曲名 & 点击进入沉浸歌词 */}
            <div className="text-center space-y-1">
              <h1 className="text-xl font-medium tracking-wide">{currentTrack?.title || '言の葉'}</h1>
              <p className="text-xs opacity-60 font-mono">{currentTrack?.artist || 'ヨルシカ'}</p>
              <button
                type="button"
                onClick={() => setIsLyricImmersive(true)}
                className="text-[10px] font-mono text-[#88abac] hover:underline pt-2 block mx-auto"
              >
                [ ENTER IMMERSIVE LYRICS &gt; ]
              </button>
            </div>
          </div>

          {/* 👉 右栏: 评论区卡片 (Right View) */}
          <div className={`space-y-3 ${activeTab === 'right' || 'hidden sm:block'}`}>
            <div className="text-[10px] font-mono opacity-50 px-1">REPLIES / 评论区</div>
            
            {/* 评论卡片项 */}
            {[
              { id: 1, user: 'エルマ', text: '「言の葉が夏の幻みたいに消えていく...」', hasMedia: true },
              { id: 2, user: 'エイハブ', text: '音乐泥棒的自白真的很触动，支持正版！', hasMedia: false },
            ].map((comment) => (
              <div
                key={comment.id}
                onClick={() => setExpandedCommentId(expandedCommentId === comment.id ? null : comment.id)}
                className="p-3 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-sm border border-current/10 cursor-pointer space-y-2 transition hover:bg-white/40"
              >
                <div className="flex justify-between items-center text-[10px] font-mono opacity-70">
                  <span className="font-bold">{comment.user}</span>
                  {comment.hasMedia && <span className="text-[#88abac]">[ MEDIA ]</span>}
                </div>
                <p className="text-xs leading-relaxed opacity-90">{comment.text}</p>

                {/* 二级回复展开 */}
                {expandedCommentId === comment.id && (
                  <div className="pt-2 border-t border-current/10 text-[11px] opacity-70 pl-2 space-y-1">
                    <div>└ 站长: 感谢留言！夏之幻影终会重逢。</div>
                  </div>
                )}
              </div>
            ))}

            {/* 底部上层评论输入层 */}
            <div className="p-3 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-current/10 space-y-2 font-mono text-[10px]">
              <div className="flex space-x-2">
                <button type="button" className="px-2 py-1 bg-current/10 hover:bg-current/20">[ + ]</button>
                <input
                  type="text"
                  placeholder="写下你的感悟..."
                  className="flex-1 bg-transparent border-b border-current/20 px-2 outline-none"
                />
              </div>
              <div className="flex justify-between items-center pt-1">
                <input type="text" placeholder="昵称" className="w-20 bg-transparent border-b border-current/20 px-1 outline-none" />
                <button type="button" className="bg-[#88abac] text-zinc-950 font-bold px-3 py-1">[ SEND ]</button>
              </div>
            </div>
          </div>

        </div>

        {/* ------------------- 全屏沉浸歌词模式 (FULLSCREEN LYRICS) ------------------- */}
        {isLyricImmersive && (
          <div className="fixed inset-0 z-50 bg-zinc-950 text-zinc-100 flex flex-col justify-between p-6 font-serif animate-in fade-in duration-300">
            {/* 顶部标题与退出按键 */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h3 className="text-sm font-medium">{currentTrack?.title}</h3>
                <span className="text-[10px] font-mono opacity-50">{currentTrack?.artist}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLyricImmersive(false)}
                className="font-mono text-xs text-[#88abac] hover:underline"
              >
                [ CLOSE ]
              </button>
            </div>

            {/* 歌词展示区域 (电脑端/横屏强制仅显示两行) */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center my-8">
              {isLandscape ? (
                // 横屏模式: 仅显示两行 (上一句 / 当前句)
                <div className="space-y-4">
                  <p className="text-sm font-light opacity-40">「カトレアの花が咲いた、夏が始まる」</p>
                  <p className="text-xl font-medium text-[#88abac]">「言の葉が舞う、夏の幻のようだ」</p>
                </div>
              ) : (
                // 竖屏模式: 滚动歌词
                <div className="space-y-6">
                  {SAMPLE_LYRICS.map((lrc, idx) => (
                    <div key={idx} className={idx === 0 ? 'text-lg font-bold text-[#88abac]' : 'text-xs opacity-40'}>
                      <p>{lrc.ja}</p>
                      <p className="text-[11px] font-sans pt-1 opacity-80">{lrc.zh}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部 Pixel 动态波浪进度条 & 5 大纯文字控制按键 */}
            <div className="space-y-4 font-mono text-xs max-w-xl mx-auto w-full">
              {/* 波浪进度条 */}
              <div className="h-1 bg-white/20 w-full overflow-hidden relative rounded-full">
                <div className="h-full bg-[#88abac] w-2/5" />
              </div>

              {/* 5 个纯文字控制按钮 (无 Emoji) */}
              <div className="flex justify-between items-center text-[10px] sm:text-xs">
                <button
                  type="button"
                  onClick={() => setRepeatMode(repeatMode === 'LOOP' ? 'RANDOM' : 'LOOP')}
                  className="hover:text-[#88abac]"
                >
                  [ {repeatMode} ]
                </button>
                <button type="button" className="hover:text-[#88abac]">[ PREV ]</button>
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="font-bold text-[#88abac] text-xs px-2"
                >
                  [ {isPlaying ? 'PAUSE' : 'PLAY'} ]
                </button>
                <button type="button" className="hover:text-[#88abac]">[ NEXT ]</button>
                <button type="button" className="hover:text-[#88abac]">[ LIST ]</button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------- 《音楽泥棒の自白》版权申诉弹窗 ------------------- */}
        {showConfessionModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 max-w-lg w-full p-6 text-zinc-200 font-serif space-y-4 shadow-2xl relative">
              <div className="border-b border-zinc-800 pb-2 flex justify-between items-center font-mono">
                <span className="text-[10px] text-[#88abac] uppercase">CONFESSION & COPYRIGHT</span>
                <button
                  type="button"
                  onClick={() => setShowConfessionModal(false)}
                  className="text-xs hover:text-white"
                >
                  [ CLOSE ]
                </button>
              </div>

              <h3 className="text-base font-medium">《音楽泥棒の自白》/ 版权声明</h3>
              <div className="text-xs leading-relaxed space-y-3 opacity-80 italic">
                <p>「僕らはただ、夏の間じゅうずっと、あの人の歌を盗み続けていた。」</p>
                <p>
                  本站为 ヨルシカ (Yorushika) 非商业粉丝同人交流站。站内所采用的所有音频与歌词版权均归原作者及唱片公司所有。
                </p>
                <p className="text-[#88abac]">
                  如有版权异议或侵权申诉，请通过关于页面提交 [ REPORT ]。
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowConfessionModal(false)}
                className="w-full py-2 bg-[#88abac] text-zinc-950 font-mono font-bold text-xs hover:bg-[#789b9c] transition"
              >
                [ I UNDERSTAND / 了解并进入 ]
              </button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
