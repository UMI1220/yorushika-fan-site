import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAudio } from '../components/Layout';

export default function MusicPage() {
  const router = Router = useRouter();
  const { query } = router;
  const albumIdFromUrl = query.album;

  const {
    isPlaying,
    togglePlay,
    playTrack,
    playNext,
    playPrev,
    currentTrack,
    currentAlbum,
    playlist,
    progress,
    currentTime,
    duration,
    seek,
    themeColor,
    theme,
  } = useAudio();

  // ---------------------------------------------------------------------------
  // 1. 本地状态管理
  // ---------------------------------------------------------------------------
  const [albums, setAlbums] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [comments, setComments] = useState([]);
  
  // UI 交互控制
  const [showConfession, setShowConfession] = useState(true); // 自白信 Modal
  const [coverMode, setCoverMode] = useState('square'); // 'square' | 'disc' | 'rotate'
  const [mediaSourceMode, setMediaSourceMode] = useState('audio'); // 'audio' | 'mv'
  const [loopMode, setLoopMode] = useState('LOOP'); // 'LOOP' | 'RAND' | 'SINGLE' | 'NONE'
  const [showQueueModal, setShowQueueModal] = useState(false); // 播放列表弹窗
  const [isImmersiveLyrics, setIsImmersiveLyrics] = useState(false); // 沉浸式歌词

  // 移动端三栏切屏: 'detail' | 'player' | 'comments'
  const [mobileTab, setMobileTab] = useState('player');

  // 评论输入表单
  const [commentForm, setCommentForm] = useState({ nickname: '', content: '', email: '' });
  const [submittingComment, setSubmittingComment] = useState(false);

  // 自白卡片四向滑动 Touch
  const confessionTouchStart = useRef({ x: 0, y: 0 });

  // ---------------------------------------------------------------------------
  // 2. API 数据拉取: /api/albums & /api/tracks & /api/comments
  // ---------------------------------------------------------------------------
  // 加载专辑列表与当前曲目
  useEffect(() => {
    async function initData() {
      try {
        const resAlbums = await fetch('/api/albums');
        const dataAlbums = await resAlbums.json();
        if (dataAlbums.success) {
          setAlbums(dataAlbums.albums);
        }

        if (albumIdFromUrl) {
          fetchTracks(albumIdFromUrl);
          fetchComments(`album_${albumIdFromUrl}`);
        }
      } catch (err) {
        console.error('初始化音乐页数据失败:', err);
      }
    }
    initData();
  }, [albumIdFromUrl]);

  // 获取特定专辑下的曲目列表
  const fetchTracks = async (albumId) => {
    try {
      const res = await fetch(`/api/tracks?albumId=${albumId}`);
      const data = await res.json();
      if (data.success && data.tracks) {
        setTracks(data.tracks);
      }
    } catch (err) {
      console.error('获取曲目失败:', err);
    }
  };

  // 获取评论列表
  const fetchComments = async (targetId) => {
    try {
      const res = await fetch(`/api/comments?targetId=${targetId}`);
      const data = await res.json();
      if (data.success && data.comments) {
        setComments(data.comments);
      }
    } catch (err) {
      console.error('获取评论失败:', err);
    }
  };

  // 发表评论
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentForm.nickname.trim() || !commentForm.content.trim()) return;

    setSubmittingComment(true);
    const targetId = albumIdFromUrl ? `album_${albumIdFromUrl}` : 'global';

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId,
          nickname: commentForm.nickname,
          content: commentForm.content,
          email: commentForm.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCommentForm({ nickname: '', content: '', email: '' });
        fetchComments(targetId);
      }
    } catch (err) {
      console.error('发表评论失败:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. 循环模式四档切换逻辑
  // ---------------------------------------------------------------------------
  const toggleLoopMode = () => {
    const modes = ['LOOP', 'RAND', 'SINGLE', 'NONE'];
    const nextIndex = (modes.indexOf(loopMode) + 1) % modes.length;
    setLoopMode(modes[nextIndex]);
  };

  // ---------------------------------------------------------------------------
  // 4. 《音楽泥棒の自白》四向滑动撕开/解封手势
  // ---------------------------------------------------------------------------
  const handleConfessionTouchStart = (e) => {
    confessionTouchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleConfessionTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - confessionTouchStart.current.x;
    const dy = e.changedTouches[0].clientY - confessionTouchStart.current.y;
    // 上下左右任意方向滑动超过 60px 即解封
    if (Math.abs(dx) > 60 || Math.abs(dy) > 60) {
      setShowConfession(false);
    }
  };

  // 渲染格式化时间
  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ---------------------------------------------------------------------------
  // 5. 特殊状态: 无 URL 专辑参数的“空白/未选择”初始态
  // ---------------------------------------------------------------------------
  if (!albumIdFromUrl && !currentTrack) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center font-mono">
        <p className="text-sm opacity-60 tracking-widest mb-4">
          [ 02. MUSIC / NO ALBUM SELECTED ]
        </p>
        <p className="text-xs opacity-40 max-w-md leading-relaxed mb-6 font-serif">
          请从首页磁贴选择专辑进入，或点击下方按钮浏览全部专辑列表。
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{ backgroundColor: themeColor }}
          className="px-6 py-2 text-zinc-950 font-bold text-xs tracking-widest shadow-sm"
        >
          [ RETURN TO INDEX ]
        </button>
      </div>
    );
  }

  const selectedAlbumObj = albums.find((a) => String(a.id) === String(albumIdFromUrl)) || currentAlbum;

  return (
    <div
      className="min-h-[calc(100vh-3.5rem)] relative overflow-x-hidden font-serif transition-colors duration-700"
      style={{
        background:
          theme === 'gekkou'
            ? `radial-gradient(circle at 50% 30%, ${themeColor}22 0%, #09090b 80%)`
            : `radial-gradient(circle at 50% 30%, ${themeColor}33 0%, #f4f3ef 80%)`,
      }}
    >
      {/* ------------------- 《音楽泥棒の自白》解封卡片 Modal ------------------- */}
      {showConfession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div
            onTouchStart={handleConfessionTouchStart}
            onTouchEnd={handleConfessionTouchEnd}
            className="max-w-md w-full bg-white/90 dark:bg-zinc-900/90 border border-current/20 p-6 sm:p-8 relative shadow-2xl space-y-4 font-serif text-xs leading-relaxed"
          >
            <div className="flex justify-between items-center border-b border-current/10 pb-3">
              <span className="font-mono font-bold tracking-widest opacity-70">
                [ 音楽泥棒の自白 ]
              </span>
              <button
                type="button"
                onClick={() => setShowConfession(false)}
                className="font-mono font-bold hover:opacity-100 opacity-60 text-sm"
              >
                [ × ]
              </button>
            </div>
            <p className="opacity-90 leading-loose">
              「僕らはただ、夏の間じゅうずっと、あの人の歌を盗み続けていた。」
            </p>
            <p className="opacity-75 leading-relaxed">
              本站为ヨルシカ (Yorushika) 非商业粉丝试听交流同人站。音源与视觉版权均归属于 n-buna、suis 及所属唱片公司所有。
            </p>
            <div className="pt-4 border-t border-current/10 flex justify-between items-center font-mono text-[10px] opacity-60">
              <span>SWIPE IN ANY DIRECTION TO ENTER</span>
              <span>UMI / FAN SITE</span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- 移动端切换至详情/评论时的 Mini 播放顶栏 ------------------- */}
      {mobileTab !== 'player' && currentTrack && (
        <div className="sm:hidden sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-current/10 p-3 flex justify-between items-center font-mono text-xs">
          <div className="flex items-center space-x-2 truncate">
            <span style={{ color: themeColor }} className="font-bold">●</span>
            <span className="truncate">{currentTrack.title || currentTrack.name}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button type="button" onClick={togglePlay} style={{ color: themeColor }} className="font-bold">
              [ {isPlaying ? 'PAUSE' : 'PLAY'} ]
            </button>
            <button type="button" onClick={() => setMobileTab('player')} className="opacity-80">
              [ PLAYER &gt; ]
            </button>
          </div>
        </div>
      )}

      {/* ------------------- 核心三栏响应式布局 ------------------- */}
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        
        {/* 移动端 Tab 选项卡 (仅 Mobile 显示) */}
        <div className="sm:hidden flex justify-around font-mono text-xs border-b border-current/10 pb-2 mb-6">
          <button
            type="button"
            onClick={() => setMobileTab('detail')}
            className={mobileTab === 'detail' ? 'font-bold underline' : 'opacity-60'}
          >
            01. DETAIL
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('player')}
            className={mobileTab === 'player' ? 'font-bold underline' : 'opacity-60'}
          >
            02. PLAYER
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('comments')}
            className={mobileTab === 'comments' ? 'font-bold underline' : 'opacity-60'}
          >
            03. COMMENTS
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 items-start">

          {/* =================== 左栏: 专辑详情 & 曲目列表 =================== */}
          <div className={`${mobileTab === 'detail' ? 'block' : 'hidden'} sm:block space-y-4`}>
            
            {/* 专辑详情毛玻璃直角卡片 */}
            {selectedAlbumObj && (
              <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-current/10 p-5 space-y-3">
                <div
                  className="w-full aspect-square bg-cover bg-center border border-current/20 shadow-sm"
                  style={{ backgroundImage: `url(${selectedAlbumObj.coverUrl || selectedAlbumObj.cover})` }}
                />
                <h2 className="font-mono font-bold text-sm truncate">{selectedAlbumObj.title || selectedAlbumObj.name}</h2>
                <p className="text-xs opacity-75 font-serif leading-relaxed line-clamp-3">
                  {selectedAlbumObj.description || 'ヨルシカ Official Discography Tracklist.'}
                </p>
                <div className="font-mono text-[10px] opacity-60 flex justify-between pt-2 border-t border-current/10">
                  <span>RELEASE: {selectedAlbumObj.releaseDate || '2020'}</span>
                  <span>{tracks.length} TRACKS</span>
                </div>
              </div>
            )}

            {/* 紧贴的长方形曲目列表 */}
            <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-current/10 p-4 space-y-2 font-mono text-xs">
              <p className="font-bold opacity-60 border-b border-current/10 pb-2 mb-2">[ TRACKLIST ]</p>
              {tracks.map((track, idx) => {
                const hasAudio = !!(track.audioUrl || track.audio_path);
                const isCurrent = currentTrack?.id === track.id;

                return (
                  <div
                    key={track.id || idx}
                    className={`flex items-center justify-between p-2 transition-colors ${
                      isCurrent ? 'bg-current/10 font-bold' : 'hover:bg-current/5'
                    }`}
                  >
                    {/* 左侧曲目点击播放 */}
                    <button
                      type="button"
                      onClick={() => {
                        if (hasAudio) {
                          playTrack(track, selectedAlbumObj, tracks);
                        } else {
                          // 无音源引导跳转 /music/submit
                          router.push(`/music/submit?albumId=${albumIdFromUrl}&trackTitle=${encodeURIComponent(track.title)}`);
                        }
                      }}
                      className="flex items-center space-x-2 text-left truncate flex-1 mr-2"
                    >
                      <span className="opacity-50 text-[10px]">{(idx + 1).toString().padStart(2, '0')}</span>
                      <span className="truncate">{track.title || track.name}</span>
                    </button>

                    {/* 右侧控件: 有音源加 [ NEXT PLAY ] / 无音源引导 [ SUBMIT > ] */}
                    {hasAudio ? (
                      <button
                        type="button"
                        onClick={() => {
                          // 插入队列下一首
                          playTrack(track, selectedAlbumObj, [currentTrack, track, ...playlist]);
                        }}
                        style={{ color: themeColor }}
                        className="text-[10px] hover:underline flex-shrink-0"
                      >
                        [ NEXT PLAY ]
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/music/submit?albumId=${albumIdFromUrl}&trackTitle=${encodeURIComponent(track.title)}`)
                        }
                        className="text-[10px] opacity-60 hover:opacity-100 flex-shrink-0"
                      >
                        [ SUBMIT &gt; ]
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

          {/* =================== 中栏: 中央播放器 =================== */}
          <div className={`${mobileTab === 'player' ? 'block' : 'hidden'} sm:block space-y-6`}>
            
            {/* 顶栏: [ 音源 / MV ] 双模式 */}
            <div className="flex justify-center space-x-6 font-mono text-xs border-b border-current/10 pb-3">
              <button
                type="button"
                onClick={() => setMediaSourceMode('audio')}
                className={mediaSourceMode === 'audio' ? 'font-bold underline' : 'opacity-60'}
              >
                [ 音源 / AUDIO ]
              </button>
              <button
                type="button"
                onClick={() => setMediaSourceMode('mv')}
                className={mediaSourceMode === 'mv' ? 'font-bold underline' : 'opacity-60'}
              >
                [ MV MODE ]
              </button>
            </div>

            {/* 封面区域 (3 模式切换) */}
            <div className="flex flex-col items-center space-y-4">
              <div
                className={`relative transition-all duration-500 overflow-hidden ${
                  coverMode === 'square'
                    ? 'w-64 h-64 sm:w-72 sm:h-72 rounded-sm shadow-2xl'
                    : 'w-60 h-60 sm:w-64 sm:h-64 rounded-full border-4 border-zinc-900 shadow-xl'
                } ${coverMode === 'rotate' && isPlaying ? 'animate-spin' : ''}`}
                style={{
                  backgroundImage: `url(${currentTrack?.coverUrl || selectedAlbumObj?.coverUrl || '/01.jpg'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  animationDuration: '20s',
                }}
              />

              {/* 模式选择切换微调按键 */}
              <div className="flex space-x-3 font-mono text-[10px] opacity-70">
                <button
                  type="button"
                  onClick={() => setCoverMode('square')}
                  className={coverMode === 'square' ? 'font-bold underline' : ''}
                >
                  [ SQUARE ]
                </button>
                <button
                  type="button"
                  onClick={() => setCoverMode('disc')}
                  className={coverMode === 'disc' ? 'font-bold underline' : ''}
                >
                  [ static DISC ]
                </button>
                <button
                  type="button"
                  onClick={() => setCoverMode('rotate')}
                  className={coverMode === 'rotate' ? 'font-bold underline' : ''}
                >
                  [ ROTATE ]
                </button>
              </div>
            </div>

            {/* 滚动歌词区 (带混合排版规则) */}
            <div
              onClick={() => setIsImmersiveLyrics(!isImmersiveLyrics)}
              className="bg-white/30 dark:bg-zinc-900/30 backdrop-blur-md p-6 h-36 flex flex-col items-center justify-center text-center cursor-pointer space-y-2 border border-current/10"
            >
              <p className="font-serif text-sm font-bold leading-relaxed">
                {currentTrack?.title ? `「 ${currentTrack.title} 」` : '「 言の葉、夏の幻 」'}
              </p>
              <p className="font-serif text-xs opacity-75">
                カトレアの花が咲いた、夏草に邪魔をされる。
              </p>
              <p className="font-mono text-[9px] opacity-40 pt-2">[ CLICK FOR IMMERSIVE LYRICS ]</p>
            </div>

            {/* Google Pixel 动态波浪进度条 */}
            <div className="space-y-1 font-mono text-[10px]">
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = ((e.clientX - rect.left) / rect.width) * 100;
                  seek(pct);
                }}
                className="h-2 bg-current/20 w-full relative cursor-pointer overflow-hidden rounded-full"
              >
                <div
                  className="h-full transition-all duration-150"
                  style={{ width: `${progress}%`, backgroundColor: themeColor }}
                />
              </div>
              <div className="flex justify-between opacity-60 pt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* ------------------- 中央播放器 5 大纯文字按键 ------------------- */}
            <div className="flex justify-between items-center font-mono text-xs pt-2">
              {/* 1. 循环模式切换 */}
              <button
                type="button"
                onClick={toggleLoopMode}
                style={{ color: themeColor }}
                className="font-bold hover:underline"
              >
                [ {loopMode} ]
              </button>

              {/* 2. 上一首 */}
              <button type="button" onClick={playPrev} className="hover:underline opacity-80">
                [ PREV ]
              </button>

              {/* 3. 播放/暂停 */}
              <button
                type="button"
                onClick={togglePlay}
                style={{ color: themeColor }}
                className="font-bold text-sm hover:underline"
              >
                [ {isPlaying ? 'PAUSE' : 'PLAY'} ]
              </button>

              {/* 4. 下一首 */}
              <button type="button" onClick={playNext} className="hover:underline opacity-80">
                [ NEXT ]
              </button>

              {/* 5. 播放列表弹窗触发 */}
              <button
   