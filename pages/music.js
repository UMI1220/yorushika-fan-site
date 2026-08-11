import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout, { useAudio } from '../components/Layout';

export default function MusicPage() {
  const router = useRouter();
  const { album: queryAlbumId } = router.query;

  // 全局 Audio & UI 上下文
  const {
    theme,
    themeColor,
    shadowStyle,
    setThemeColor,
    currentTrack,
    currentAlbum,
    isPlaying,
    togglePlay,
    playTrack,
    playNext,
    playPrev,
    progress,
    currentTime,
    duration,
    seek,
  } = useAudio();

  // ---------------------------------------------------------------------------
  // 1. 页面核心状态管理 (State Management)
  // ---------------------------------------------------------------------------
  // 自白卡片 Modal (首次进播放器或切换专辑时显示)
  const [showConfession, setShowConfession] = useState(false);

  // 移动端三页 Swiper 索引 (0: 详情页 | 1: 播放器页 | 2: 评论页)
  const [activePageIndex, setActivePageIndex] = useState(1);

  // 数据列表状态
  const [albums, setAlbums] = useState([]);               // 导航菜单进入时的全量专辑磁贴
  const [selectedAlbum, setSelectedAlbum] = useState(null); // 当前选中的专辑对象
  const [songList, setSongList] = useState([]);           // 选中的专辑歌曲列表
  const [comments, setComments] = useState([]);           // 当前歌曲的评论列表
  const [expandedCommentId, setExpandedCommentId] = useState(null); // 当前展开回复的评论ID
  const [replies, setReplies] = useState([]);             // 当前展开的回复列表

  // 播放器状态
  const [mediaMode, setMediaMode] = useState('audio');    // 'audio' | 'mv'
  const [coverMode, setCoverMode] = useState(1);          // 1: 方形光影 | 2: 静态唱片 | 3: 旋转唱片
  const [isImmersive, setIsImmersive] = useState(false);  // 全屏沉浸歌词模式
  const [lyrics, setLyrics] = useState([]);               // 解析后的歌词数组 [{ time, jp, cn }]
  const [lyricContributor, setLyricContributor] = useState(''); // 歌词贡献者

  // 评论提交表单
  const [commentInput, setCommentInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // ---------------------------------------------------------------------------
  // 2. Swiper 触摸手势防御 (彻底防御纵向/横向滑动冲突与手势失效)
  // ---------------------------------------------------------------------------
  const touchStartPos = useRef({ x: 0, y: 0 });
  const isSwiping = useRef(false);

  const handleTouchStart = (e) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    isSwiping.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isSwiping.current) return;
    const deltaX = e.touches[0].clientX - touchStartPos.current.x;
    const deltaY = e.touches[0].clientY - touchStartPos.current.y;

    // 手势矢量判定：当水平位移明显大于垂直位移，判定为切页手势
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      // 阻止浏览器默认橡胶回弹与页面下拉刷新，确保 Swiper 切页丝滑
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = (e) => {
    if (!isSwiping.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartPos.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartPos.current.y;

    // 水平划动阈值 > 50px 且垂直偏离小，触发 Swiper 切页
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0 && activePageIndex < 2) {
        setActivePageIndex((prev) => prev + 1); // 划向右侧页面
      } else if (deltaX > 0 && activePageIndex > 0) {
        setActivePageIndex((prev) => prev - 1); // 划向左侧页面
      }
    }
    isSwiping.current = false;
  };

  // ---------------------------------------------------------------------------
  // 3. 数据拉取与自白 Modal 触发逻辑 (符合《拉取上传删除逻辑规范》)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function initPageData() {
      if (queryAlbumId) {
        // 情况二：从首页专辑进入 -> 展示自白 Modal，拉取专辑与全量歌曲，并自动开始播放
        setShowConfession(true);
        try {
          const albumRes = await fetch(`/api/albums/${queryAlbumId}`);
          const albumData = await albumRes.json();
          if (albumData && albumData.album) {
            setSelectedAlbum(albumData.album);
            setSongList(albumData.songs || []);
            // 若包含音源，默认选第一首开始播放
            const playableTracks = (albumData.songs || []).filter((s) => s.audio_url);
            if (playableTracks.length > 0) {
              playTrack(playableTracks[0], albumData.album, playableTracks);
            }
          }
        } catch (e) {
          console.error('Failed to load album from query:', e);
        }
      } else {
        // 情况一：从导航菜单 [ MUSIC ] 进入 -> 初始不显示详情卡片，背景呈白色，拉取专辑磁贴列表
        try {
          const res = await fetch('/api/albums?summary=true');
          const data = await res.json();
          if (data && Array.isArray(data.albums)) {
            setAlbums(data.albums);
          }
        } catch (e) {
          console.error('Failed to load albums summary:', e);
        }
      }
    }
    initPageData();
  }, [queryAlbumId]);

  // 当当前播放歌曲改变时，拉取评论列表与 LRC 歌词
  useEffect(() => {
    if (!currentTrack) return;

    // 1. 拉取评论列表
    fetch(`/api/comments?song_id=${currentTrack.id}`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .catch((e) => console.error(e));

    // 2. 拉取与解析 .lrc 歌词文件
    if (currentTrack.lrc_url) {
      fetch(currentTrack.lrc_url)
        .then((res) => res.text())
        .then((text) => parseLrc(text))
        .catch(() => setLyrics([]));
    } else {
      setLyrics([]);
    }
  }, [currentTrack]);

  // 解析中日双语 LRC 歌词算法 ({ time, jp, cn })
  const parseLrc = (lrcText) => {
    const lines = lrcText.split('\n');
    const result = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    lines.forEach((line) => {
      const match = timeRegex.exec(line);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const time = minutes * 60 + seconds;
        const text = line.replace(timeRegex, '').trim();

        // 中日双语同行或双行解构
        const parts = text.split('/');
        result.push({
          time,
          jp: parts[0] || text,
          cn: parts[1] || '',
        });
      }
    });
    setLyrics(result.sort((a, b) => a.time - b.time));
  };

  return (
    <Layout>
      {/* --------------------------------------------------------------------- */}
      {/* 📜 1. 《音楽泥棒の自白》版权/申诉书信 Modal (支持多端四周滑动/解开)      */}
      {/* --------------------------------------------------------------------- */}
      {showConfession && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={() => setShowConfession(false)} // 移动端向任意方向划动即解开
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
        >
          <div
            style={{ boxShadow: shadowStyle }}
            className={`max-w-lg w-full p-6 relative border transition-all duration-300 ${
              theme === 'gekko'
                ? 'bg-[#12181a] border-white/20 text-white'
                : 'bg-[#faf8f5] border-black/10 text-[#2c3e50]'
            }`}
          >
            {/* PC 端右上角关闭按钮 */}
            <button
              type="button"
              onClick={() => setShowConfession(false)}
              className="absolute top-4 right-4 text-xs font-bold tracking-widest cursor-pointer hover:opacity-70"
            >
              [ × ]
            </button>

            <h2 className="text-sm font-bold tracking-widest uppercase mb-4 border-b border-current/10 pb-2">
              [ 音楽泥棒の自白 / COPYRIGHT STATEMENT ]
            </h2>

            <div className="text-xs leading-relaxed space-y-3 font-serif opacity-90 my-4">
              <p>「僕らはただ、夏の間じゅうずっと、あの人の歌を盗み続けていた。」</p>
              <p>
                本站为ヨルシカ（Yorushika）非商业粉丝集会切片。全站音频、歌词及视觉影像版权均归属于原作者、所属唱片公司及官方团队所有。
              </p>
              <p className="text-[10px] opacity-70">
                若本站收录内容侵犯了您的合法权益，请联系权利申诉通道 (yhb1220@outlook.com)。
              </p>
            </div>

            <div className="mt-6 flex justify-between items-center text-[10px] font-mono opacity-70">
              <span>DESIGNED BY UMI1220</span>
              <span className="animate-pulse">[ SWIPE OR CLICK TO ENTER ]</span>
            </div>
          </div>
        </div>
      )}
    </Layout>   {/* 👈 加这行 */}
  );            {/* 👈 加这行 */}
}               {/* 👈 加这行 */}      
// -----------------------------------------------------------------------------
// 4. 播放器中栏 (Player Center Column)
// -----------------------------------------------------------------------------
export function MusicPlayerCenter({
  mediaMode,
  setMediaMode,
  coverMode,
  setCoverMode,
  isImmersive,
  setIsImmersive,
  lyrics,
  lyricContributor,
  playlistModalOpen,
  setPlaylistModalOpen,
}) {
  const {
    theme,
    themeColor,
    shadowStyle,
    currentTrack,
    currentAlbum,
    isPlaying,
    togglePlay,
    playNext,
    playPrev,
    progress,
    currentTime,
    duration,
    seek,
    playlist,
    playTrack,
  } = useAudio();

  // 循环模式状态 (0: LOOP | 1: RANDOM | 2: SINGLE | 3: NONE)
  const [loopMode, setLoopMode] = useState(0);
  const loopModeLabels = ['[ LOOP ]', '[ RANDOM ]', '[ SINGLE ]', '[ NONE ]'];

  // 切换循环模式
  const cycleLoopMode = () => {
    setLoopMode((prev) => (prev + 1) % 4);
  };

  // 获取封面 URL (优先歌曲独立封面，为空时拉取专辑封面)
  const coverUrl = currentTrack?.cover_url || currentAlbum?.cover_url || '/01.jpg';

  return (
    <div className="flex flex-col h-full justify-between space-y-6 relative">
      {/* --------------------------------------------------------------------- */}
      {/* A. 顶部: 音源 / MV 模式切换 & 沉浸按钮 (纯文字 UI)                       */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex items-center justify-between text-xs border-b border-current/10 pb-2">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => setMediaMode('audio')}
            className={`font-bold transition-opacity cursor-pointer ${
              mediaMode === 'audio' ? 'underline' : 'opacity-50 hover:opacity-100'
            }`}
            style={{ color: mediaMode === 'audio' ? themeColor : 'inherit' }}
          >
            [ AUDIO ]
          </button>

          {currentTrack?.mv_url && (
            <button
              type="button"
              onClick={() => setMediaMode('mv')}
              className={`font-bold transition-opacity cursor-pointer ${
                mediaMode === 'mv' ? 'underline' : 'opacity-50 hover:opacity-100'
              }`}
              style={{ color: mediaMode === 'mv' ? themeColor : 'inherit' }}
            >
              [ MV ]
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsImmersive(!isImmersive)}
          className="font-bold tracking-wider opacity-80 hover:opacity-100 cursor-pointer"
        >
          [ IMMERSIVE / 沉浸 ]
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* B. 封面展示区 (支持 3 模式切换，应用 Smartisan OS 斜射物理光影)          */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex-1 flex items-center justify-center my-4 relative group">
        {mediaMode === 'mv' && currentTrack?.mv_url ? (
          // MV 播放模式
          <div className="w-full aspect-video bg-black flex items-center justify-center shadow-lg">
            <iframe
              src={currentTrack.mv_url}
              title="Music Video"
              className="w-full h-full border-none"
              allowFullScreen
            />
          </div>
        ) : (
          // 音频封面 3 模式
          <div
            onClick={() => {
              // 桌面端点击/手机端划动切换封面模式 (1: 方形光影 | 2: 静态唱片 | 3: 旋转唱片)
              setCoverMode((prev) => (prev % 3) + 1);
            }}
            style={{ boxShadow: shadowStyle }}
            className={`relative transition-all duration-500 cursor-pointer overflow-hidden ${
              coverMode === 1
                ? 'w-64 h-64 sm:w-80 sm:h-80 rounded-none' // 模式一：直角方形带坚果OS光影
                : 'w-64 h-64 sm:w-80 sm:h-80 rounded-full' // 模式二/三：圆形唱片
            }`}
          >
            <img
              src={coverUrl}
              alt={currentTrack?.title || 'Album Cover'}
              className={`w-full h-full object-cover ${
                coverMode === 3 && isPlaying ? 'animate-spinSlow' : ''
              }`}
            />

            {/* 模式切换悬停提示文字 */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] tracking-widest uppercase">
              [ MODE {coverMode} : CLICK TO SWITCH ]
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* C. 歌词显示区 (中日双语/混合，2 行滚动，底部显示贡献者署名)            */}
      {/* --------------------------------------------------------------------- */}
      <div
        onClick={() => setIsImmersive(true)}
        className="min-h-[80px] flex flex-col items-center justify-center text-center cursor-pointer px-4 my-2 group"
      >
        {lyrics.length > 0 ? (
          // 获取当前时间戳对应的歌词
          (() => {
            const currentLyric =
              lyrics.slice().reverse().find((l) => currentTime >= l.time) || lyrics[0];
            return (
              <div className="space-y-1 transition-all duration-300">
                {/* 第一行：日文原文 */}
                <p className="text-sm sm:text-base font-serif font-bold tracking-wide">
                  {currentLyric?.jp || '---'}
                </p>
                {/* 第二行：中文翻译 */}
                {currentLyric?.cn && (
                  <p
                    style={{ color: themeColor }}
                    className="text-xs sm:text-sm font-sans opacity-90"
                  >
                    {currentLyric.cn}
                  </p>
                )}
              </div>
            );
          })()
        ) : (
          // 无 LRC 歌词时，在歌词区居中显示贡献者署名
          <div className="text-xs opacity-60 italic font-serif">
            <p>「歌詞はまだ登録されていません」</p>
            <p className="mt-1 text-[10px]">
              贡献人：{currentTrack?.contributor || 'yhb1220@outlook.com'}
            </p>
          </div>
        )}

        {/* 歌词存在时，底部微小淡化显示贡献人邮箱 */}
        {lyrics.length > 0 && (
          <div className="mt-2 text-[9px] opacity-40 font-mono">
            贡献人：{currentTrack?.contributor || 'yhb1220@outlook.com'}
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* D. Google Pixel 风格动态波浪进度条                                     */}
      {/* --------------------------------------------------------------------- */}
      <div className="space-y-1">
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newTime = (clickX / rect.width) * duration;
            seek(newTime);
          }}
          className="h-2 bg-current/10 w-full relative cursor-pointer overflow-hidden rounded-none"
        >
          <div
            className="h-full transition-all duration-100"
            style={{ width: `${progress}%`, backgroundColor: themeColor }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-mono opacity-60">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* E. 播放器底部标准五大控件 (严禁 Emoji, 全量纯文字 UI)                   */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-current/10">
        {/* 控件一: 循环模式切换 */}
        <button
          type="button"
          onClick={cycleLoopMode}
          className="hover:opacity-70 cursor-pointer"
        >
          {loopModeLabels[loopMode]}
        </button>

        {/* 控件二: 上一首 */}
        <button
          type="button"
          onClick={playPrev}
          className="hover:opacity-70 cursor-pointer"
        >
          [ PREV ]
        </button>

        {/* 控件三: 播放 / 暂停 */}
        <button
          type="button"
          onClick={togglePlay}
          style={{ color: themeColor }}
          className="hover:underline text-sm cursor-pointer"
        >
          [ {isPlaying ? 'PAUSE' : 'PLAY'} ]
        </button>

        {/* 控件四: 下一首 */}
        <button
          type="button"
          onClick={playNext}
          className="hover:opacity-70 cursor-pointer"
        >
          [ NEXT ]
        </button>

        {/* 控件五: 播放列表弹窗 */}
        <button
          type="button"
          onClick={() => setPlaylistModalOpen(true)}
          className="hover:opacity-70 cursor-pointer"
        >
          [ PLAYLIST ]
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* F. 唱片旋转 CSS                                                      */}
      {/* --------------------------------------------------------------------- */}
      <style jsx>{`
        @keyframes spinSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spinSlow {
          animation: spinSlow 20s linear infinite;
        }
      `}</style>
    </div>
  );
}

// 时间格式化辅助函数 (秒 -> 00:00)
function formatTime(secs) {
  if (isNaN(secs) || secs === 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}
// -----------------------------------------------------------------------------
// 5. 详情页与歌曲列表 (Left Column: Details & Songs List)
// -----------------------------------------------------------------------------
export function MusicDetailsColumn({
  albums,
  selectedAlbum,
  setSelectedAlbum,
  songList,
  setSongList,
}) {
  const { theme, themeColor, shadowStyle, playTrack, addToPlaylist } = useAudio();
  const router = useRouter();

  // 折叠卡片展开状态
  const [isCardExpanded, setIsCardExpanded] = useState(true);

  // 点击专辑磁贴：拉取专辑详情与歌曲列表 (符合《拉取上传删除逻辑规范》)
  const handleAlbumSelect = async (album) => {
    setSelectedAlbum(album);
    setIsCardExpanded(true);
    try {
      const res = await fetch(`/api/albums/${album.id}`);
      const data = await res.json();
      if (data && data.songs) {
        setSongList(data.songs);
      }
    } catch (e) {
      console.error('Failed to load songs:', e);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-1 select-none">
      {/* 顶部标题 */}
      <div className="text-xs font-bold tracking-widest uppercase border-b border-current/10 pb-2">
        [ DETAILS & ALBUMS / 专辑与曲目 ]
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* A. 选中专辑的折叠详情卡片 (长方形毛玻璃质感，防屏幕溢出)                 */}
      {/* --------------------------------------------------------------------- */}
      {selectedAlbum && (
        <div
          style={{ boxShadow: shadowStyle }}
          className={`backdrop-blur-md transition-all duration-300 p-4 border rounded-none ${
            theme === 'gekko'
              ? 'bg-[#12181a]/80 border-white/10 text-white'
              : 'bg-white/80 border-black/5 text-[#2c3e50]'
          }`}
        >
          {/* 卡片头部 (左侧放大封面，右侧专辑信息) */}
          <div className="flex space-x-4 items-start">
            <img
              src={selectedAlbum.cover_url || '/01.jpg'}
              alt={selectedAlbum.title || selectedAlbum.name}
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0 text-xs space-y-1">
              <h3
                className="font-bold text-sm tracking-wide truncate"
                style={{ color: themeColor }}
              >
                [ {selectedAlbum.title || selectedAlbum.name} ]
              </h3>
              <p className="opacity-70">
                RELEASE: {selectedAlbum.release_date || '2020.07.29'}
              </p>
              <p className="opacity-70">
                TRACKS: {selectedAlbum.song_count || selectedAlbum.track_count || 10}
              </p>
              <button
                type="button"
                onClick={() => setIsCardExpanded(!isCardExpanded)}
                className="text-[10px] underline pt-1 cursor-pointer font-bold"
              >
                [ {isCardExpanded ? 'COLLAPSE / 折叠' : 'EXPAND / 展开'} ]
              </button>
            </div>
          </div>

          {/* 展开的歌曲列表 (带 max-h 高度限制与 e.stopPropagation 内部滚动) */}
          {isCardExpanded && (
            <div
              onTouchMove={(e) => e.stopPropagation()} // 阻止冒泡，防止误切 Swiper 页面
              className="mt-4 pt-3 border-t border-current/10 space-y-2 max-h-[50vh] overflow-y-auto"
            >
              {songList.length > 0 ? (
                songList.map((song, index) => {
                  const hasAudio = Boolean(song.audio_url);
                  return (
                    <div
                      key={song.id || index}
                      className="flex items-center justify-between text-xs p-2 hover:bg-current/5 transition-colors"
                    >
                      {/* 左侧曲号与歌名 (直接点击全量替换播放列表) */}
                      <div
                        onClick={() => {
                          if (hasAudio) {
                            // 规则1：点击带音源歌曲，全量替换播放列表并播放
                            const playableSongs = songList.filter((s) => s.audio_url);
                            playTrack(song, selectedAlbum, playableSongs);
                          }
                        }}
                        className={`flex items-center space-x-2 flex-1 truncate cursor-pointer ${
                          !hasAudio ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      >
                        <span className="font-mono text-[10px] opacity-60">
                          {index + 1 < 10 ? `0${index + 1}` : index + 1}.
                        </span>
                        <span className="font-medium truncate">{song.title}</span>
                      </div>

                      {/* 右侧操作控件 */}
                      <div className="flex items-center space-x-2 text-[10px] font-bold">
                        {hasAudio ? (
                          <>
                            {/* 规则2: 点击 [ NEXT + ] 追加到播放列表 */}
                            <button
                              type="button"
                              onClick={() => addToPlaylist(song)}
                              className="hover:underline cursor-pointer opacity-70 hover:opacity-100"
                            >
                              [ NEXT + ]
                            </button>
                          </>
                        ) : (
                          /* 规则3: 无音源显示补充跳转 */
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/submit?song_id=${song.id}&album_id=${selectedAlbum.id}`
                              )
                            }
                            style={{ color: themeColor }}
                            className="hover:underline cursor-pointer"
                          >
                            [ SUBMIT / 补充 ]
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs opacity-50">
                  [ NO TRACKS AVAILABLE ]
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* B. 未选中/导航进入时的 WP8.1 磁贴列表 (应用 Smartisan OS 斜射光影)      */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        {albums.map((album) => (
          <div
            key={album.id}
            onClick={() => handleAlbumSelect(album)}
            style={{ boxShadow: shadowStyle }}
            className="aspect-square relative cursor-pointer overflow-hidden rounded-none group transition-transform hover:scale-[1.02]"
          >
            <img
              src={album.cover_url || '/01.jpg'}
              alt={album.title || album.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white text-[10px]">
              <p className="font-bold truncate">[ {album.title || album.name} ]</p>
              <p className="opacity-70">TRACKS: {album.song_count || 10}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 6. 播放列表管理弹窗 (Playlist Modal Component)
// -----------------------------------------------------------------------------
export function PlaylistModal({ isOpen, onClose }) {
  const { theme, themeColor, shadowStyle, playlist, currentTrack, playTrack, removeFromPlaylist, clearPlaylist } = useAudio();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        style={{ boxShadow: shadowStyle }}
        className={`max-w-md w-full p-5 border rounded-none relative max-h-[80vh] flex flex-col ${
          theme === 'gekko'
            ? 'bg-[#12181a] border-white/20 text-white'
            : 'bg-[#faf8f5] border-black/10 text-[#2c3e50]'
        }`}
      >
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between pb-3 border-b border-current/10">
          <span className="text-xs font-bold tracking-wider">
            [ PLAYLIST - {playlist.length} TRACKS ]
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold cursor-pointer hover:opacity-70"
          >
            [ CLOSE ]
          </button>
        </div>

        {/* 歌单列表 */}
        <div
          onTouchMove={(e) => e.stopPropagation()}
          className="my-4 space-y-1 overflow-y-auto flex-1 max-h-[50vh] pr-1"
        >
          {playlist.length > 0 ? (
            playlist.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={`${track.id}-${idx}`}
                  className={`flex items-center justify-between text-xs p-2 transition-colors ${
                    isCurrent ? 'bg-current/10 font-bold' : 'hover:bg-current/5'
                  }`}
                >
                  <div
                    onClick={() => playTrack(track)}
                    className="flex items-center space-x-2 truncate cursor-pointer flex-1"
                  >
                    <span className="font-mono text-[10px] opacity-60">{idx + 1}.</span>
                    <span className="truncate" style={{ color: isCurrent ? themeColor : 'inherit' }}>
                      {track.title}
                    </span>
                    {isCurrent && <span className="text-[9px] opacity-70">[ NOW ]</span>}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromPlaylist(idx)}
                    className="text-xs font-bold hover:opacity-70 px-2 cursor-pointer"
                  >
                    [ × ]
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs opacity-50">
              [ PLAYLIST IS EMPTY ]
            </div>
          )}
        </div>

        {/* 弹窗底部操作 */}
        <div className="pt-2 border-t border-current/10 flex justify-between items-center text-xs font-bold">
          <button
            type="button"
            onClick={clearPlaylist}
            className="hover:underline opacity-70 hover:opacity-100 cursor-pointer"
          >
            [ CLEAR ALL ]
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ color: themeColor }}
            className="hover:underline cursor-pointer"
          >
            [ DONE ]
          </button>
        </div>
      </div>
    </div>
  );
}
// -----------------------------------------------------------------------------
// 7. 右栏：评论与回复页面 (Right Column: Comments & Replies)
// -----------------------------------------------------------------------------
export function MusicCommentsColumn({ currentTrack }) {
  const { theme, themeColor, shadowStyle } = useAudio();

  // 状态管理
  const [comments, setComments] = useState([]);
  const [expandedCommentId, setExpandedCommentId] = useState(null); // 当前展开回复的评论ID
  const [replies, setReplies] = useState([]);                       // 回复列表
  const [loadingReplies, setLoadingReplies] = useState(false);

  // 评论/回复表单字段
  const [commentInput, setCommentInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  
  // 回复子表单字段
  const [replyInput, setReplyInput] = useState('');
  const [replyNickname, setReplyNickname] = useState('');
  const [replyPassword, setReplyPassword] = useState('');
  const [replyAttachment, setReplyAttachment] = useState('');

  // 监听当前歌曲变化，拉取评论列表
  useEffect(() => {
    if (!currentTrack) return;
    fetchComments();
  }, [currentTrack]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?song_id=${currentTrack.id}`);
      const data = await res.json();
      if (data && Array.isArray(data.comments)) {
        setComments(data.comments);
      }
    } catch (e) {
      console.error('Failed to fetch comments:', e);
    }
  };

  // 点击评论磁贴：展开回复列表
  const handleCommentClick = async (comment) => {
    if (expandedCommentId === comment.id) {
      setExpandedCommentId(null);
      setReplies([]);
      return;
    }

    setExpandedCommentId(comment.id);
    setLoadingReplies(true);
    try {
      const res = await fetch(`/api/replies?comment_id=${comment.id}`);
      const data = await res.json();
      if (data && Array.isArray(data.replies)) {
        setReplies(data.replies);
      }
    } catch (e) {
      console.error('Failed to fetch replies:', e);
    } finally {
      setLoadingReplies(false);
    }
  };

  // 提交主评论
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !nicknameInput.trim() || !currentTrack) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song_id: currentTrack.id,
          nickname: nicknameInput,
          content: commentInput,
          password: passwordInput,
          attachment_url: attachmentUrl,
        }),
      });
      if (res.ok) {
        setCommentInput('');
        setAttachmentUrl('');
        fetchComments();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  // 提交对评论的回复
  const handlePostReply = async (e, commentId) => {
    e.preventDefault();
    if (!replyInput.trim() || !replyNickname.trim()) return;

    try {
      const res = await fetch('/api/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_id: commentId,
          nickname: replyNickname,
          content: replyInput,
          password: replyPassword,
          attachment_url: replyAttachment,
        }),
      });
      if (res.ok) {
        setReplyInput('');
        setReplyAttachment('');
        // 重新拉取该评论的回复列表
        const replyRes = await fetch(`/api/replies?comment_id=${commentId}`);
        const data = await replyRes.json();
        if (data && Array.isArray(data.replies)) {
          setReplies(data.replies);
        }
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    }
  };

  return (
    <div className="flex flex-col h-full justify-between relative select-none">
      {/* 顶部标题 */}
      <div className="text-xs font-bold tracking-widest uppercase border-b border-current/10 pb-2">
        [ COMMENTS & DIALOGUE / 听众评论与留言 ]
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* A. 评论磁贴滚动列表 (WP8.1 磁贴样式 + 附件标识 + 回复数统计)           */}
      {/* --------------------------------------------------------------------- */}
      <div
        onTouchMove={(e) => e.stopPropagation()}
        className="flex-1 overflow-y-auto space-y-3 my-3 pr-1"
      >
        {comments.length > 0 ? (
          comments.map((comment) => {
            const isExpanded = expandedCommentId === comment.id;
            const hasAttachment = Boolean(comment.attachment_url);
            // 简单判定附件类型是图片还是音频
            const isAudioAttachment = hasAttachment && comment.attachment_url.includes('audio');

            return (
              <div
                key={comment.id}
                style={{ boxShadow: shadowStyle }}
                onClick={() => handleCommentClick(comment)}
                className={`p-3 border rounded-none cursor-pointer transition-all duration-300 backdrop-blur-md ${
                  theme === 'gekko'
                    ? 'bg-[#12181a]/80 border-white/10 text-white'
                    : 'bg-white/80 border-black/5 text-[#2c3e50]'
                }`}
              >
                {/* 评论头部：昵称与附件标识 */}
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold tracking-wide" style={{ color: themeColor }}>
                    [ {comment.nickname} ]
                  </span>
                  <div className="flex items-center space-x-2 text-[9px] font-mono opacity-70">
                    {hasAttachment && (
                      <span className="border px-1 border-current/30">
                        {isAudioAttachment ? '[ AUDIO ]' : '[ IMG ]'}
                      </span>
                    )}
                    <span>[ {comment.reply_count || 0} REPLIES ]</span>
                  </div>
                </div>

                {/* 评论正文 (截断显示) */}
                <p className="text-xs opacity-90 line-clamp-2 font-serif">
                  {comment.content}
                </p>

                {/* 点击展开后的回复列表区域 (长方形毛玻璃卡片) */}
                {isExpanded && (
                  <div
                    onClick={(e) => e.stopPropagation()} // 阻止折叠触发
                    className="mt-3 pt-3 border-t border-current/10 space-y-2 animate-fadeIn"
                  >
                    <div className="text-[10px] font-bold tracking-wider opacity-70 mb-1">
                      [ REPLIES LIST / 回复详情 ]
                    </div>

                    {loadingReplies ? (
                      <div className="text-xs opacity-50 py-2">LOADING REPLIES...</div>
                    ) : replies.length > 0 ? (
                      replies.map((reply) => (
                        <div key={reply.id} className="p-2 bg-current/5 text-xs space-y-1">
                          <div className="flex justify-between font-bold opacity-80">
                            <span>{reply.nickname}</span>
                            <span className="text-[9px] opacity-50">
                              {reply.created_at?.slice(0, 10)}
                            </span>
                          </div>
                          <p className="font-serif text-[11px] opacity-90">{reply.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] opacity-50 py-1">[ NO REPLIES YET ]</div>
                    )}

                    {/* 回复录入表单 */}
                    <form onSubmit={(e) => handlePostReply(e, comment.id)} className="mt-2 space-y-2 pt-2 border-t border-current/10">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="NICKNAME / 昵称"
                          value={replyNickname}
                          onChange={(e) => setReplyNickname(e.target.value)}
                          className="w-1/2 p-1 text-xs bg-current/5 border border-current/20 rounded-none outline-none"
                        />
                        <input
                          type="password"
                          placeholder="PASSWORD / 删密"
                          value={replyPassword}
                          onChange={(e) => setReplyPassword(e.target.value)}
                          className="w-1/2 p-1 text-xs bg-current/5 border border-current/20 rounded-none outline-none"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="REPLY CONTENT / 发表回复..."
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        className="w-full p-1 text-xs bg-current/5 border border-current/20 rounded-none outline-none"
                      />
                      <button
                        type="submit"
                        style={{ color: themeColor }}
                        className="w-full py-1 text-[10px] font-bold border border-current/30 hover:bg-current/10 cursor-pointer"
                      >
                        [ SUBMIT REPLY &gt; ]
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-xs opacity-50 font-mono">
            [ NO COMMENTS FOUND FOR THIS TRACK ]
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* B. 底部悬浮输入区域 (含附件 [+] 上传、昵称、密码框，防键盘冲突)        */}
      {/* --------------------------------------------------------------------- */}
      <form
        onSubmit={handlePostComment}
        className="pt-2 border-t border-current/10 space-y-2 text-xs"
      >
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="NICKNAME / 昵称"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            className="w-1/2 p-1.5 bg-current/5 border border-current/20 rounded-none outline-none text-xs"
          />
          <input
            type="password"
            placeholder="PASSWORD / 删除密码"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-1/2 p-1.5 bg-current/5 border border-current/20 rounded-none outline-none text-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* 左侧 [+] 上传附件按钮 */}
          <button
            type="button"
            onClick={() => {
              const url = prompt('输入附件 URL (图片或音频):');
              if (url) setAttachmentUrl(url);
            }}
            className="px-3 py-1.5 border border-current/30 font-bold hover:bg-current/10 cursor-pointer flex-shrink-0"
            title="Upload Attachment"
          >
            [ + ]
          </button>

          <input
            type="text"
            placeholder={attachmentUrl ? 'ATTACHMENT ATTACHED' : 'ENTER COMMENT / 发表评论...'}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            className="flex-1 p-1.5 bg-current/5 border border-current/20 rounded-none outline-none text-xs"
          />

          <button
            type="submit"
            style={{ color: themeColor }}
            className="px-4 py-1.5 border font-bold border-current/30 hover:bg-current/10 cursor-pointer flex-shrink-0"
          >
            [ SEND ]
          </button>
        </div>
      </form>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 8. 音乐页全量整合导出组件 (MusicPage Container)
// -----------------------------------------------------------------------------
export function MusicPageContainer() {
  const router = useRouter();
  const { theme, themeColor, shadowStyle, currentTrack } = useAudio();

  // 状态绑定
  const [mediaMode, setMediaMode] = useState('audio');
  const [coverMode, setCoverMode] = useState(1);
  const [isImmersive, setIsImmersive] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(1); // 移动端三页索引
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [songList, setSongList] = useState([]);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [lyrics, setLyrics] = useState([]);

  // 初始化拉取
  useEffect(() => {
    async function loadInitial() {
      try {
        const res = await fetch('/api/albums?summary=true');
        const data = await res.json();
        if (data && Array.isArray(data.albums)) {
          setAlbums(data.albums);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadInitial();
  }, []);

  return (
    <div className="relative min-h-[85vh] flex flex-col justify-between">
      {/* --------------------------------------------------------------------- */}
      {/* 电脑端 (PC): 三栏并排展示 (左: 详情 | 中: 播放器 | 右: 评论)           */}
      {/* --------------------------------------------------------------------- */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6 h-[80vh]">
        <div className="h-full overflow-hidden">
          <MusicDetailsColumn
            albums={albums}
            selectedAlbum={selectedAlbum}
            setSelectedAlbum={setSelectedAlbum}
            songList={songList}
            setSongList={setSongList}
          />
        </div>
        <div className="h-full overflow-hidden border-x border-current/10 px-6">
          <MusicPlayerCenter
            mediaMode={mediaMode}
            setMediaMode={setMediaMode}
            coverMode={coverMode}
            setCoverMode={setCoverMode}
            isImmersive={isImmersive}
            setIsImmersive={setIsImmersive}
            lyrics={lyrics}
            playlistModalOpen={playlistModalOpen}
            setPlaylistModalOpen={setPlaylistModalOpen}
          />
        </div>
        <div className="h-full overflow-hidden">
          <MusicCommentsColumn currentTrack={currentTrack} />
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 手机端 (Mobile): 三页丝滑 Swipe 切换 (0: 详情 | 1: 播放器 | 2: 评论)  */}
      {/* --------------------------------------------------------------------- */}
      <div className="lg:hidden relative overflow-hidden min-h-[75vh]">
        {/* 顶部 Mini 播放导航条 (当位于详情或评论页时浮现，点击瞬回中栏) */}
        {activePageIndex !== 1 && (
          <div
            onClick={() => setActivePageIndex(1)}
            style={{ boxShadow: shadowStyle }}
            className="sticky top-0 z-20 mb-3 p-2 bg-current/10 backdrop-blur-md flex items-center justify-between text-xs cursor-pointer"
          >
            <span className="font-bold truncate" style={{ color: themeColor }}>
              [ NOW PLAYING: {currentTrack?.title || 'SELECT A TRACK'} ]
            </span>
            <span className="font-bold">[ BACK TO PLAYER &gt; ]</span>
          </div>
        )}

        {/* 三页横向滚动容器 */}
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activePageIndex * 100}%)` }}
        >
          {/* 页 0: 详情页 */}
          <div className="w-full flex-shrink-0 px-2 h-[75vh]">
            <MusicDetailsColumn
              albums={albums}
              selectedAlbum={selectedAlbum}
              setSelectedAlbum={setSelectedAlbum}
              songList={songList}
              setSongList={setSongList}
            />
          </div>

          {/* 页 1: 播放器中栏 */}
          <div className="w-full flex-shrink-0 px-2 h-[75vh]">
            <MusicPlayerCenter
              mediaMode={mediaMode}
              setMediaMode={setMediaMode}
              coverMode={coverMode}
              setCoverMode={setCoverMode}
              isImmersive={isImmersive}
              setIsImmersive={setIsImmersive}
              lyrics={lyrics}
              playlistModalOpen={playlistModalOpen}
              setPlaylistModalOpen={setPlaylistModalOpen}
            />
          </div>

          {/* 页 2: 评论页 */}
          <div className="w-full flex-shrink-0 px-2 h-[75vh]">
            <MusicCommentsColumn currentTrack={currentTrack} />
          </div>
        </div>

        {/* 移动端页面切换指示器 (纯文字 UI) */}
        <div className="flex justify-center items-center space-x-6 mt-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActivePageIndex(0)}
            className={`cursor-pointer ${activePageIndex === 0 ? 'underline' : 'opacity-40'}`}
            style={{ color: activePageIndex === 0 ? themeColor : 'inherit' }}
          >
            [ 01. DETAILS ]
          </button>
          <button
            type="button"
            onClick={() => setActivePageIndex(1)}
            className={`cursor-pointer ${activePageIndex === 1 ? 'underline' : 'opacity-40'}`}
            style={{ color: activePageIndex === 1 ? themeColor : 'inherit' }}
          >
            [ 02. PLAYER ]
          </button>
          <button
            type="button"
            onClick={() => setActivePageIndex(2)}
            className={`cursor-pointer ${activePageIndex === 2 ? 'underline' : 'opacity-40'}`}
            style={{ color: activePageIndex === 2 ? themeColor : 'inherit' }}
          >
            [ 03. COMMENTS ]
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 播放列表弹窗挂载                                                      */}
      {/* --------------------------------------------------------------------- */}
      <PlaylistModal
        isOpen={playlistModalOpen}
        onClose={() => setPlaylistModalOpen(false)}
      />

      {/* --------------------------------------------------------------------- */}
      {/* 全屏沉浸歌词模式 (Immersive Lyrics Modal)                             */}
      {/* --------------------------------------------------------------------- */}
      {isImmersive && (
        <div
          onClick={() => setIsImmersive(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-white animate-fadeIn cursor-pointer"
        >
          <div className="text-center space-y-6 max-w-2xl">
            <p className="text-xs font-mono tracking-widest opacity-60">
              [ IMMERSIVE LYRICS / 全屏沉浸歌词 ]
            </p>
            <h2 className="text-2xl font-bold font-serif" style={{ color: themeColor }}>
              {currentTrack?.title || 'YORUSHIKA'}
            </h2>
            <div className="py-12 space-y-4">
              <p className="text-xl sm:text-2xl font-serif leading-relaxed">
                「僕らはただ、夏の終わりに歌を盗む。」
              </p>
              <p className="text-base sm:text-lg font-sans opacity-80">
                我们只是，在夏日将尽时盗走了歌曲。
              </p>
            </div>
            <p className="text-xs opacity-50 tracking-widest">[ CLICK ANYWHERE TO EXIT ]</p>
          </div>
        </div>
      )}
    </div>
  );
}

// 默认导出容器组件
export default MusicPageContainer;
