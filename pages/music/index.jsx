import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function MusicPage() {
  const [tracks, setTracks] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🔍 搜索与专辑筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('ALL');

  // 歌词语言 Tab: 'jp' | 'cn'
  const [lyricTab, setLyricTab] = useState('jp');
  // 视图模式: 'cover' (封面) | 'mv' (MV模式)
  const [viewMode, setViewMode] = useState('cover');

  const audioRef = useRef(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('music')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTracks(data || []);
    } catch (err) {
      console.error('获取音乐列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 提取所有不重复的专辑列表
  const allAlbums = ['ALL', ...Array.from(new Set(tracks.map(t => t.album).filter(Boolean)))];

  // 根据搜索词和选择的专辑进行过滤
  const filteredTracks = tracks.filter((track) => {
    const matchesSearch = 
      (track.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.album || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.artist || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAlbum = selectedAlbum === 'ALL' || track.album === selectedAlbum;

    return matchesSearch && matchesAlbum;
  });

  const currentTrack = filteredTracks[currentTrackIndex] || filteredTracks[0] || null;

  // 播放器事件绑定
  const handlePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const playTrack = (track) => {
    const idx = filteredTracks.findIndex((t) => t.id === track.id);
    if (idx !== -1) {
      setCurrentTrackIndex(idx);
      setIsPlaying(true);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(console.error);
        }
      }, 50);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 🎬 智能视频/MV 解析组件
  const renderMvPlayer = (url) => {
    if (!url) return null;

    const bvidMatch = url.match(/BV[a-zA-Z0-9]+/i);
    if (bvidMatch) {
      return (
        <iframe
          src={`//player.bilibili.com/player.html?bvid=${bvidMatch[0]}&page=1&high_quality=1&danmaku=0`}
          scrolling="no"
          border="0"
          frameBorder="no"
          framespacing="0"
          allowFullScreen={true}
          className="w-full h-full rounded-2xl"
        ></iframe>
      );
    }

    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          title="YouTube Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-2xl"
        ></iframe>
      );
    }

    return (
      <video controls className="w-full h-full object-cover rounded-2xl">
        <source src={url} />
      </video>
    );
  };

  return (
    <Layout>
      <Head>
        <title>音乐馆 | Yorushika FanSite</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* 页头 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-100 pb-4">
          <div>
            <h1 className="text-2xl font-serif text-zinc-900 tracking-wide">ヨルシカ 音轨全集</h1>
            <p className="text-xs font-mono text-zinc-400 mt-1">按专辑分类检索与双语歌词试听</p>
          </div>
          <Link
            href="/music/submit"
            className="inline-flex items-center justify-center px-4 py-2 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-xl text-xs font-mono shadow-sm transition-all"
          >
            🎵 贡献新音轨 / MV
          </Link>
        </div>

        {/* 🔍 搜索与专辑筛选控制栏 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          {/* 实时搜索框 */}
          <div className="md:col-span-1 relative">
            <input
              type="text"
              placeholder="🔍 搜索歌名 / 专辑 / 词曲..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentTrackIndex(0);
              }}
              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#88abac] shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* 专辑分类列表横向滚动 */}
          <div className="md:col-span-2 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {allAlbums.map((album) => (
              <button
                key={album}
                onClick={() => {
                  setSelectedAlbum(album);
                  setCurrentTrackIndex(0);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-mono whitespace-nowrap border transition-all ${
                  selectedAlbum === album
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                {album === 'ALL' ? '💿 全部专辑' : `《${album}》`}
              </button>
            ))}
          </div>

        </div>

        {/* 主内容区域 */}
        {loading ? (
          <div className="py-24 text-center font-mono text-xs text-zinc-400 animate-pulse">
            Loading tracks...
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="py-20 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-xs font-mono text-zinc-400">未找到符合条件的歌曲</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* 左侧：音频/MV播放器与歌词显示卡片 (8 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* 播放器与主卡片 */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-100 shadow-sm relative">
                
                {/* 封面 / MV 视图切换栏 */}
                {currentTrack?.mv_url && (
                  <div className="flex justify-end mb-4 gap-2">
                    <button
                      onClick={() => setViewMode('cover')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-mono border transition ${
                        viewMode === 'cover'
                          ? 'bg-zinc-800 text-white border-zinc-800'
                          : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                      }`}
                    >
                      🖼️ 封面
                    </button>
                    <button
                      onClick={() => setViewMode('mv')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-mono border transition ${
                        viewMode === 'mv'
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                      }`}
                    >
                      🎬 MV 模式
                    </button>
                  </div>
                )}

                {/* 1. 封面展示 / MV播放展示 */}
                {viewMode === 'mv' && currentTrack?.mv_url ? (
                  <div className="aspect-video w-full mb-6">
                    {renderMvPlayer(currentTrack.mv_url)}
                  </div>
                ) : (
                  <div className="aspect-square max-w-xs mx-auto mb-6 rounded-2xl overflow-hidden shadow-md border border-zinc-100 relative group">
                    <img
                      src={currentTrack?.cover_url || '/01.jpg'}
                      alt={currentTrack?.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}

                {/* 歌曲信息 */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-serif text-zinc-900">{currentTrack?.title}</h2>
                  <p className="text-xs font-mono text-zinc-400 mt-1">
                    {currentTrack?.artist || 'ヨルシカ'} · 《{currentTrack?.album || '未知专辑'}》
                  </p>
                </div>

                {/* 音频标签 */}
                <audio
                  ref={audioRef}
                  src={currentTrack?.audio_url}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => {
                    if (currentTrackIndex < filteredTracks.length - 1) {
                      setCurrentTrackIndex((prev) => prev + 1);
                    } else {
                      setIsPlaying(false);
                    }
                  }}
                />

                {/* 进度条 */}
                <div className="space-y-1 mb-6">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-[#88abac]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* 播放控制按钮 */}
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => setCurrentTrackIndex((p) => Math.max(0, p - 1))}
                    disabled={currentTrackIndex === 0}
                    className="p-2 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 transition"
                  >
                    ⏮️
                  </button>

                  <button
                    onClick={handlePlayPause}
                    className="w-12 h-12 rounded-full bg-[#88abac] text-white flex items-center justify-center shadow-md hover:bg-[#789b9c] transition-all"
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>

                  <button
                    onClick={() => setCurrentTrackIndex((p) => Math.min(filteredTracks.length - 1, p + 1))}
                    disabled={currentTrackIndex === filteredTracks.length - 1}
                    className="p-2 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 transition"
                  >
                    ⏭️
                  </button>
                </div>

              </div>

              {/* 歌词卡片 */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                  <span className="text-xs font-serif text-zinc-800 font-medium">📝 歌词文本</span>
                  <div className="flex gap-2 font-mono text-xs">
                    <button
                      onClick={() => setLyricTab('jp')}
                      className={`px-3 py-1 rounded-lg border transition ${
                        lyricTab === 'jp'
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                      }`}
                    >
                      日文原文
                    </button>
                    <button
                      onClick={() => setLyricTab('cn')}
                      className={`px-3 py-1 rounded-lg border transition ${
                        lyricTab === 'cn'
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                      }`}
                    >
                      中文翻译
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto text-xs leading-relaxed text-zinc-600 font-sans whitespace-pre-wrap pr-2">
                  {lyricTab === 'jp'
                    ? currentTrack?.lyrics_jp || '暂无日文歌词'
                    : currentTrack?.lyrics_cn || '暂无中文歌词'}
                </div>
              </div>

            </div>

            {/* 右侧：播放列表与版权说明 (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* 歌曲列表 */}
              <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
                  <h3 className="text-xs font-serif text-zinc-800 font-semibold">
                    📋 歌单曲目 ({filteredTracks.length})
                  </h3>
                  {selectedAlbum !== 'ALL' && (
                    <span className="text-[10px] font-mono text-[#88abac] bg-teal-50 px-2 py-0.5 rounded">
                      《{selectedAlbum}》
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {filteredTracks.map((track, idx) => {
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <div
                        key={track.id || idx}
                        onClick={() => playTrack(track)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isCurrent
                            ? 'bg-[#88abac]/10 border-[#88abac] shadow-sm'
                            : 'bg-zinc-50/50 hover:bg-zinc-100/80 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={track.cover_url || '/01.jpg'}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover shrink-0 border border-zinc-200"
                          />
                          <div className="min-w-0">
                            <p className={`text-xs font-serif truncate ${isCurrent ? 'text-[#88abac] font-bold' : 'text-zinc-800'}`}>
                              {track.title}
                            </p>
                            <p className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                              《{track.album || '未知专辑'}》
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {track.mv_url && (
                            <span className="text-[9px] font-mono bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded border border-rose-100">
                              MV
                            </span>
                          )}
                          {isCurrent && isPlaying && (
                            <span className="text-xs animate-pulse">🎵</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 版权声明 */}
              <div className="bg-zinc-50/80 rounded-2xl p-5 border border-zinc-200/60 text-[11px] text-zinc-500 leading-relaxed space-y-2 font-sans">
                <div className="flex items-center gap-1.5 font-serif text-zinc-700 font-medium text-xs">
                  <span>🛡️</span>
                  <span>版权与免责说明</span>
                </div>
                <p>
                  1. 本站音频与歌词资源均由粉丝鹿友贡献，仅供个人交流学习试听使用。
                </p>
                <p>
                  2. 著作权归属于 <strong>ヨルシカ (Yorushika)</strong> 及所在唱片公司。请前往官方渠道支持正版！
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    </Layout>
  );
}