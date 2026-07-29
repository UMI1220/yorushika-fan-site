import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function MusicSubmitPage() {
  const router = useRouter();

  // 贡献模式: 'new' (全新上传) | 'supplement' (补充现有歌曲)
  const [mode, setMode] = useState('new');

  // 现有歌曲列表 (供补充模式选择)
  const [existingTracks, setExistingTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState('');

  // 表单状态
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('ヨルシカ');
  const [album, setAlbum] = useState('');
  const [mvUrl, setMvUrl] = useState('');
  const [contributor, setContributor] = useState('');
  const [supplementContributor, setSupplementContributor] = useState('');
  const [lyricJp, setLyricJp] = useState('');
  const [lyricCn, setLyricCn] = useState('');

  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 挂载时拉取所有已存在音乐供补充选择
  useEffect(() => {
    fetchExistingTracks();
  }, []);

  const fetchExistingTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('music')
        .select('*')
        .order('title', { ascending: true });

      if (!error && data) {
        setExistingTracks(data);
      }
    } catch (err) {
      console.error('获取现有歌曲列表失败:', err);
    }
  };

  // 选择补充特定歌曲时，自动回显现有数据
  const handleSelectTrackToSupplement = (trackId) => {
    setSelectedTrackId(trackId);
    const target = existingTracks.find((t) => String(t.id) === String(trackId));
    if (target) {
      setTitle(target.title || '');
      setArtist(target.artist || 'ヨルシカ');
      setAlbum(target.album || '');
      setMvUrl(target.mv_url || '');
      setLyricJp(target.lyric_jp || target.lyrics_jp || target.lyrics || '');
      setLyricCn(target.lyric_cn || target.lyrics_cn || target.lyrics_zh || target.lyric_zh || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'new' && (!title.trim() || !audioFile)) {
      setErrorMsg('新建音乐请务必填写曲名并上传音频文件 (.mp3)');
      return;
    }

    if (mode === 'supplement' && !selectedTrackId) {
      setErrorMsg('请先选择需要补充信息的歌曲');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      let audioPublicUrl = null;
      let coverPublicUrl = null;

      // 1. 若有上传新音频
      if (audioFile) {
        const audioExt = audioFile.name.split('.').pop();
        const audioFileName = `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${audioExt}`;

        const { error: audioErr } = await supabase.storage
          .from('music')
          .upload(audioFileName, audioFile, { upsert: true });

        if (audioErr) throw new Error(`音频上传失败: ${audioErr.message}`);

        const { data: audioPublic } = supabase.storage
          .from('music')
          .getPublicUrl(audioFileName);

        audioPublicUrl = audioPublic.publicUrl;
      }

      // 2. 若有上传新封面
      if (coverFile) {
        const coverExt = coverFile.name.split('.').pop();
        const coverFileName = `cover-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${coverExt}`;

        const { error: coverErr } = await supabase.storage
          .from('music')
          .upload(coverFileName, coverFile, { upsert: true });

        if (!coverErr) {
          const { data: coverPublic } = supabase.storage
            .from('music')
            .getPublicUrl(coverFileName);
          coverPublicUrl = coverPublic.publicUrl;
        }
      }

      // 3. 执行写入操作
      if (mode === 'new') {
        // 新增逻辑
        const { error: dbErr } = await supabase.from('music').insert([
          {
            title: title.trim(),
            artist: artist.trim() || 'ヨルシカ',
            album: album.trim() || 'Single',
            audio_url: audioPublicUrl,
            cover_url: coverPublicUrl,
            mv_url: mvUrl.trim() || null,
            lyric_jp: lyricJp.trim(),
            lyric_cn: lyricCn.trim(),
            contributor: contributor.trim() || '匿名鹿友',
          },
        ]);

        if (dbErr) throw dbErr;
      } else {
        // 补充逻辑
        const updateData = {
          mv_url: mvUrl.trim() || null,
          lyric_jp: lyricJp.trim(),
          lyric_cn: lyricCn.trim(),
          supplement_contributor: supplementContributor.trim() || '匿名鹿友',
        };

        if (audioPublicUrl) updateData.audio_url = audioPublicUrl;
        if (coverPublicUrl) updateData.cover_url = coverPublicUrl;

        const { error: updateErr } = await supabase
          .from('music')
          .update(updateData)
          .eq('id', selectedTrackId);

        if (updateErr) throw updateErr;
      }

      router.push('/music');
    } catch (err) {
      console.error('贡献失败:', err);
      setErrorMsg(err.message || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>贡献/补充音频与MV | MUSIC | ヨルシカ FanSite</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-2xl mx-auto">
          
          <div className="mb-8 flex items-center justify-between">
            <Link href="/music" className="text-xs tracking-widest text-[#88abac] hover:underline">
              ← 返回音乐列表
            </Link>
            <span className="text-xs text-zinc-400 font-serif">CONTRIBUTE MUSIC</span>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-zinc-100 space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-serif text-zinc-800 tracking-widest mb-2">
                贡献与补充音乐 / CONTRIBUTE
              </h1>
              <p className="text-xs font-serif italic text-[#88abac] tracking-wider">
                「共同完善夜鹿的音乐角落」
              </p>
            </div>

            {/* 模式选择切换：全新上传 vs 补充信息 */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-zinc-100/80 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('new');
                  setErrorMsg('');
                }}
                className={`py-2.5 rounded-lg text-xs font-medium transition-all ${
                  mode === 'new'
                    ? 'bg-[#88abac] text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                🎵 上传全新歌曲
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('supplement');
                  setErrorMsg('');
                }}
                className={`py-2.5 rounded-lg text-xs font-medium transition-all ${
                  mode === 'supplement'
                    ? 'bg-[#88abac] text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                ✍️ 补充现有歌曲信息
              </button>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 补充模式：下拉选择现有歌曲 */}
              {mode === 'supplement' && (
                <div className="p-4 bg-[#88abac]/5 border border-[#88abac]/20 rounded-xl space-y-2">
                  <label className="block text-xs font-serif text-zinc-800 font-medium">
                    选择要补充信息的歌曲 *
                  </label>
                  <select
                    value={selectedTrackId}
                    onChange={(e) => handleSelectTrackToSupplement(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] bg-white"
                    required
                  >
                    <option value="">-- 请选择歌曲 --</option>
                    {existingTracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} - {t.artist} 《{t.album}》
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-zinc-400">
                    选择歌曲后将自动显示已有信息，你可以修改或补充歌词、MV、更清晰的音频等。
                  </p>
                </div>
              )}

              {/* 歌曲基本信息 (新建模式必填，补充模式只读/预览) */}
              <div>
                <label className="block text-xs font-serif text-zinc-700 mb-2">
                  曲名 / Song Title {mode === 'new' ? '*' : ''}
                </label>
                <input
                  type="text"
                  placeholder="如：花に風"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={mode === 'supplement'}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac] disabled:bg-zinc-50 disabled:text-zinc-500"
                  required={mode === 'new'}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif text-zinc-700 mb-2">演唱/演奏者</label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    disabled={mode === 'supplement'}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac] disabled:bg-zinc-50 disabled:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-serif text-zinc-700 mb-2">所属专辑</label>
                  <input
                    type="text"
                    placeholder="如：盗作"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    disabled={mode === 'supplement'}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac] disabled:bg-zinc-50 disabled:text-zinc-500"
                  />
                </div>
              </div>

              {/* MV 视频网页链接 */}
              <div>
                <label className="block text-xs font-serif text-zinc-700 mb-2">
                  MV / 视频链接 (支持 Bilibili / YouTube 网址)
                </label>
                <input
                  type="text"
                  placeholder="如：https://www.bilibili.com/video/BV1xx411c7mD"
                  value={mvUrl}
                  onChange={(e) => setMvUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac]"
                />
              </div>

              {/* 文件上传 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif text-zinc-700 mb-2">
                    音频文件 (.mp3) {mode === 'new' ? '*' : '(可选替换)'}
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files[0])}
                    className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:bg-[#88abac]/10 file:text-[#88abac] hover:file:bg-[#88abac]/20"
                    required={mode === 'new'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-serif text-zinc-700 mb-2">专辑/单曲封面 (可选)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files[0])}
                    className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:bg-[#88abac]/10 file:text-[#88abac] hover:file:bg-[#88abac]/20"
                  />
                </div>
              </div>

              {/* 歌词区域 */}
              <div>
                <label className="block text-xs font-serif text-zinc-700 mb-2">日文原版歌词</label>
                <textarea
                  rows={4}
                  placeholder="粘贴日文歌词..."
                  value={lyricJp}
                  onChange={(e) => setLyricJp(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-serif text-zinc-700 mb-2">中文翻译歌词</label>
                <textarea
                  rows={4}
                  placeholder="粘贴中文翻译..."
                  value={lyricCn}
                  onChange={(e) => setLyricCn(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] resize-none"
                />
              </div>

              {/* 贡献者昵称 */}
              {mode === 'new' ? (
                <div>
                  <label className="block text-xs font-serif text-zinc-700 mb-2">你的贡献者昵称</label>
                  <input
                    type="text"
                    placeholder="默认：匿名鹿友"
                    value={contributor}
                    onChange={(e) => setContributor(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac]"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-serif text-zinc-700 mb-2">你的补充贡献者昵称</label>
                  <input
                    type="text"
                    placeholder="默认：匿名鹿友"
                    value={supplementContributor}
                    onChange={(e) => setSupplementContributor(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac]"
                  />
                </div>
              )}

              {/* 月光青提交按钮 */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3.5 rounded-xl text-white text-xs tracking-widest transition-all font-medium ${
                  submitting ? 'bg-zinc-300 cursor-not-allowed' : 'bg-[#88abac] hover:bg-[#789b9c] shadow-sm hover:shadow-md'
                }`}
              >
                {submitting ? '提交处理中...' : mode === 'new' ? '提交新音轨 / SUBMIT' : '提交补充信息 / UPDATE'}
              </button>

            </form>
          </div>

        </div>
      </div>
    </Layout>
  );
}