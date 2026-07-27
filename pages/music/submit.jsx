import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function MusicSubmitPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('ヨルシカ');
  const [album, setAlbum] = useState('');
  const [mvUrl, setMvUrl] = useState('');
  const [contributor, setContributor] = useState('');
  const [lyricJp, setLyricJp] = useState('');
  const [lyricCn, setLyricCn] = useState('');

  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !audioFile) {
      setErrorMsg('请填写曲名并选择上传音频文件 (.mp3)');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      // 1. 上传音频
      const audioExt = audioFile.name.split('.').pop();
      const audioFileName = `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${audioExt}`;

      const { error: audioErr } = await supabase.storage
        .from('music')
        .upload(audioFileName, audioFile, { upsert: true });

      if (audioErr) throw new Error(`音频上传失败: ${audioErr.message}`);

      const { data: audioPublic } = supabase.storage
        .from('music')
        .getPublicUrl(audioFileName);

      let coverUrl = null;

      // 2. 上传封面 (可选)
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
          coverUrl = coverPublic.publicUrl;
        }
      }

      // 3. 写入数据库
      const { error: dbErr } = await supabase
        .from('music')
        .insert([
          {
            title: title.trim(),
            artist: artist.trim() || 'ヨルシカ',
            album: album.trim() || 'Single',
            audio_url: audioPublic.publicUrl,
            cover_url: coverUrl,
            mv_url: mvUrl.trim() || null,
            lyric_jp: lyricJp.trim(),
            lyric_cn: lyricCn.trim(),
            contributor: contributor.trim() || '匿名鹿友',
          },
        ]);

      if (dbErr) throw dbErr;

      router.push('/music');
    } catch (err) {
      console.error('贡献失败:', err);
      setErrorMsg(err.message || '上传贡献失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>贡献音频/MV/歌词 | MUSIC | ヨルシカ FanSite</title>
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
                贡献音乐与 MV / CONTRIBUTE
              </h1>
              <p className="text-xs font-serif italic text-zinc-400 tracking-wider">
                共同完善夜鹿的音乐角落
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-serif text-zinc-700 mb-2">曲名 / Song Title *</label>
                <input
                  type="text"
                  placeholder="如：花に風"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif text-zinc-700 mb-2">演唱/演奏者</label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-serif text-zinc-700 mb-2">所属专辑</label>
                  <input
                    type="text"
                    placeholder="如：盗作"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac]"
                  />
                </div>
              </div>

              {/* MV 视频网页链接 */}
              <div>
                <label className="block text-xs font-serif text-zinc-700 mb-2">
                  MV / 视频链接 (可选，支持 Bilibili / YouTube 网址)
                </label>
                <input
                  type="text"
                  placeholder="如：https://www.bilibili.com/video/BV1xx411c7mD"
                  value={mvUrl}
                  onChange={(e) => setMvUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-[#88abac]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-serif text-zinc-700 mb-2">音频文件 (.mp3) *</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files[0])}
                    className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-serif text-zinc-700 mb-2">专辑/单曲封面 (可选)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files[0])}
                    className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                  />
                </div>
              </div>

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

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3.5 rounded-xl text-white text-xs tracking-widest transition-all ${
                  submitting ? 'bg-zinc-300' : 'bg-[#88abac] hover:bg-[#789b9c]'
                }`}
              >
                {submitting ? '提交中...' : '提交贡献 / SUBMIT'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </Layout>
  );
}