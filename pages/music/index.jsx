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

  // 歌词语言 Tab: 'jp' | 'cn'
  const [lyricTab, setLyricTab] = useState('jp');
  // 视图模式: 'cover' (封面/MV) | 'mv' (全屏/大窗口MV)
  const [viewMode, setViewMode] = useState('cover');

  const audioRef = useRef(null);
  const currentTrack = tracks[currentTrackIndex] || null;

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
      console.error('读取音乐列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSelectTrack = (index) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setViewMode('cover'); // 换歌时重置视图
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play();
      }
    }, 100);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleDownloadLyric = (track) => {
    const textContent = `Title: ${track.title}\nArtist: ${track.artist}\nContributor: ${track.contributor}\n\n--- 日文歌词 ---\n${track.lyric_jp || '暂无'}\n\n--- 中文翻译 ---\n${track.lyric_cn || '暂无'}`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.title} - 歌词.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 处理 Bilibili 或 YouTube 嵌入 URL 转化
  const getEmbedMvUrl = (url) => {
    if (!url) return null;
    // 如果是 Bilibili BV 号或链接
    if (url.includes('bilibili.com')) {
      const match = url.match(/BV[a-zA-Z0-9]+/);
      if (match) {
        return `//player.bilibili.com/player.html?bvid=${match[0]}&page=1&high_quality=1&as_wide=1`;
      }
    }
    // 如果是 YouTube 链接
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
      }
    }
    return url;
  };

  return (
    <Layout>
      <Head>
        <title>DISCOGRAPHY & MUSIC | ヨルシカ FanSite</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {/* 页头 */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-serif text-zinc-800 tracking-widest mb-2">
                音乐试听 / DISCOGRAPHY
              </h1>
              <p className="text-xs font-serif italic text-[#88abac] tracking-wider">
                「心に咲いた花の名を、音色に乗せて」
              </p>
            </div>

            <Link
              href="/music/submit"
              className="px-6 py-2.5 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-full text-xs tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <span>🎵</span>
              <span>贡献音频 / MV / 歌词</span>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20 text-zinc-400 font-serif tracking-widest">
              音频库调取中...
            </div>
          ) : tracks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-zinc-400 font-serif border border-zinc-100 shadow-sm">
              暂无可试听曲目，快来贡献第一首吧！
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* 左侧：播放器与歌词 (占 7 列) */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-zinc-100 shadow-sm flex flex-col justify-between space-y-6">
                
                {/* 封面与 MV 嵌入展示 */}
                <div className="flex flex-col items-center text-center space-y-4">
                  
                  {/* 视图切换 (封面 vs MV) */}
                  {currentTrack.mv_url && (
                    <div className="flex bg-zinc-100 p-1 rounded-lg text-[11px] gap-1 font-serif">
                      <button
                        onClick={() => setViewMode('cover')}
                        className={`px-3 py-1 rounded-md transition-all ${
                          viewMode === 'cover' ? 'bg-white shadow-sm text-zinc-800' : 'text-zinc-500'
                        }`}
                      >
                        📷 专辑封面
                      </button>
                      <button
                        onClick={() => setViewMode('mv')}
                        className={`px-3 py-1 rounded-md transition-all ${
                          viewMode === 'mv' ? 'bg-white shadow-sm text-zinc-800' : 'text-zinc-500'
                        }`}
                      >
                        🎬 观看 MV / 视频
                      </button>
                    </div>
                  )}

                  {/* 核心展示区 */}
                  <div className="w-full max-w-sm h-52 sm:h-60 rounded-2xl overflow-hidden shadow-md border border-zinc-100 bg-zinc-50 flex items-center justify-center relative">
                    {viewMode === 'mv' && currentTrack.mv_url ? (
                      <iframe
                        src={getEmbedMvUrl(currentTrack.mv_url)}
                        title="MV Player"
                        className="w-full h-full border-0"
                        allowFullScreen
                      />
                    ) : currentTrack.cover_url ? (
                      <img src={currentTrack.cover_url} alt={currentTrack.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-zinc-300 font-serif text-4xl">🎼</div>
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif text-zinc-800 tracking-wide mb-1">
                      {currentTrack.title}
                    </h2>
                    <p className="text-xs text-zinc-400 font-sans">
                      {currentTrack.artist} • 《{currentTrack.album}》
                    </p>
                    <p className="text-[11px] text-[#88abac] font-serif mt-1">
                      贡献者：{currentTrack.contributor || '匿名鹿友'}
                    </p>
                  </div>
                </div>

                {/* 音频标签 */}
                <audio
                  ref={audioRef}
                  src={currentTrack.audio_url}
                  onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
                  onLoadedMetadata={() => setDuration(audioRef.current.duration)}
                  onEnded={() => {
                    if (currentTrackIndex < tracks.length - 1) {
                      handleSelectTrack(currentTrackIndex + 1);
                    } else {
                      setIsPlaying(false);
                    }
                  }}
                />

                {/* 进度条 */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) => {
                      const newTime = Number(e.target.value);
                      audioRef.current.currentTime = newTime;
                      setCurrentTime(newTime);
                    }}
                    className="w-full h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-[#88abac]"
                  />
                  <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* 播放与下载 */}
                <div className="flex items-center justify-between pt-2 border-b border-zinc-100 pb-4">
                  <div className="flex items-center gap-3">
                    <a
                      href={currentTrack.audio_url}
                      download={`${currentTrack.title}.mp3`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-zinc-400 hover:text-[#88abac] text-xs transition-colors flex items-center gap-1"
                      title="下载音频文件"
                    >
                      💾 音频下载
                    </a>

                    <button
                      onClick={() => handleDownloadLyric(currentTrack)}
                      className="p-1.5 text-zinc-400 hover:text-[#88abac] text-xs transition-colors flex items-center gap-1"
                      title="下载歌词"
                    >
                      📄 歌词下载
                    </button>
                  </div>

                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-full flex items-center justify-center shadow-md transition-all text-lg"
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                </div>

                {/* 歌词 Switcher Tab 区域 (中日文切换) */}
                <div className="space-y-4">
                  <div className="flex justify-center border-b border-zinc-100 pb-2">
                    <div className="inline-flex rounded-lg p-0.5 bg-zinc-50 border border-zinc-100 text-xs">
                      <button
                        onClick={() => setLyricTab('jp')}
                        className={`px-4 py-1 rounded-md font-serif transition-all ${
                          lyricTab === 'jp'
                            ? 'bg-white text-[#88abac] shadow-sm font-medium'
                            : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                      >
                        🇯🇵 日文原版
                      </button>
                      <button
                        onClick={() => setLyricTab('cn')}
                        className={`px-4 py-1 rounded-md font-sans transition-all ${
                          lyricTab === 'cn'
                            ? 'bg-white text-[#88abac] shadow-sm font-medium'
                            : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                      >
                        🇨🇳 中文翻译
                      </button>
                    </div>
                  </div>

                  {/* 歌词内容滚动容器 */}
                  <div className="max-h-52 overflow-y-auto pr-2 text-center">
                    {lyricTab === 'jp' ? (
                      <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap font-serif">
                        {currentTrack.lyric_jp || '暂无日文原歌词'}
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap font-sans">
                        {currentTrack.lyric_cn || '暂无中文翻译歌词'}
                      </p>
                    )}
                  </div>
                </div>

              </div>

              {/* 右侧：播放列表与版权 */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
                  <h3 className="text-base font-serif text-zinc-800 tracking-widest border-b border-zinc-100 pb-3">
                    曲目列表 ({tracks.length})
                  </h3>

                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {tracks.map((track, idx) => (
                      <button
                        key={track.id}
                        onClick={() => handleSelectTrack(idx)}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                          currentTrackIndex === idx
                            ? 'bg-sky-50/60 border border-[#88abac]/40 text-[#88abac]'
                            : 'hover:bg-zinc-50 border border-transparent text-zinc-700'
                        }`}
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <p className="text-xs font-serif truncate font-medium flex items-center gap-1.5">
                            <span>{idx + 1}. {track.title}</span>
                            {track.mv_url && (
                              <span className="text-[10px] px-1 bg-rose-50 text-rose-500 rounded border border-rose-100">
                                MV
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {track.artist} • 《{track.album}》
                          </p>
                        </div>
                        {currentTrackIndex === idx && isPlaying && (
                          <span className="text-xs animate-pulse">🎵</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 版权声明 */}
                <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200/60 text-[11px] text-zinc-500 leading-relaxed space-y-2 font-sans">
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
      </div>
    </Layout>
  );
}