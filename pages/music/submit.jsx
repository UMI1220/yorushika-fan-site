import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { supabase } from '../../lib/supabase';

export default function MusicSubmitPage() {
  const router = useRouter();

  // 模式切换: 'new' (新建) | 'supplement' (其他人补充) | 'edit' (原上传者修改)
  const [mode, setMode] = useState('new');

  // 歌曲选择与验证
  const [existingTracks, setExistingTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [verifyName, setVerifyName] = useState(''); // 修改模式下校验贡献者昵称
  const [isVerified, setIsVerified] = useState(false);

  // 表单字段
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
  const [successMsg, setSuccessMsg] = useState('');

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
      console.error('获取歌曲列表失败:', err);
    }
  };

  // 重置表单
  const resetForm = () => {
    setTitle('');
    setArtist('ヨルシカ');
    setAlbum('');
    setMvUrl('');
    setContributor('');
    setSupplementContributor('');
    setLyricJp('');
    setLyricCn('');
    setAudioFile(null);
    setCoverFile(null);
    setSelectedTrackId('');
    setVerifyName('');
    setIsVerified(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // 切换 Mode 时重置状态
  const handleModeChange = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  // 校验贡献者昵称（修改模式 key）
  const handleVerifyContributor = () => {
    setErrorMsg('');
    if (!selectedTrackId) {
      setErrorMsg('请先选择要修改的歌曲');
      return;
    }
    if (!verifyName.trim()) {
      setErrorMsg('请输入你的贡献者昵称');
      return;
    }

    const target = existingTracks.find((t) => String(t.id) === String(selectedTrackId));
    if (!target) return;

    const originalContrib = (target.contributor || '').trim();
    const suppContrib = (target.supplement_contributor || '').trim();
    const inputName = verifyName.trim();

    // 校验昵称是否匹配原始贡献者或补充贡献者
    if (inputName === originalContrib || (suppContrib && inputName === suppContrib)) {
      setIsVerified(true);
      setSuccessMsg('身份验证成功！你可以修改该歌曲的信息。');

      // 自动填入已有数据供编辑
      setTitle(target.title || '');
      setArtist(target.artist || 'ヨルシカ');
      setAlbum(target.album || '');
      setMvUrl(target.mv_url || '');
      setLyricJp(target.lyric_jp || '');
      setLyricCn(target.lyric_cn || '');
      setContributor(target.contributor || '');
      setSupplementContributor(target.supplement_contributor || '');
    } else {
      setIsVerified(false);
      setErrorMsg('昵称匹配失败！该歌曲并非由此昵称上传或补充。');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      setSubmitting(true);

      // ------------------------------------
      // 模式 1：上传全新歌曲 (INSERT)
      // ------------------------------------
      if (mode === 'new') {
        if (!title.trim() || !audioFile) {
          setErrorMsg('请填写曲名并选择音频文件 (.mp3)');
          setSubmitting(false);
          return;
        }

        // 1. 上传音频
        const audioExt = audioFile.name.split('.').pop();
        const audioName = `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${audioExt}`;
        const { error: audioErr } = await supabase.storage.from('music').upload(audioName, audioFile);
        if (audioErr) throw audioErr;

        const { data: audioPub } = supabase.storage.from('music').getPublicUrl(audioName);

        // 2. 上传封面 (可选)
        let coverUrl = null;
        if (coverFile) {
          const coverExt = coverFile.name.split('.').pop();
          const coverName = `cover-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${coverExt}`;
          const { error: coverErr } = await supabase.storage.from('music').upload(coverName, coverFile);
          if (!coverErr) {
            const { data: coverPub } = supabase.storage.from('music').getPublicUrl(coverName);
            coverUrl = coverPub.publicUrl;
          }
        }

        // 3. 写入数据库
        const { error: dbErr } = await supabase.from('music').insert([
          {
            title: title.trim(),
            artist: artist.trim() || 'ヨルシカ',
            album: album.trim() || 'Single',
            audio_url: audioPub.publicUrl,
            cover_url: coverUrl,
            mv_url: mvUrl.trim() || null,
            lyric_jp: lyricJp.trim() || null,
            lyric_cn: lyricCn.trim() || null,
            contributor: contributor.trim() || '匿名鹿友',
          },
        ]);

        if (dbErr) throw dbErr;
      }

      // ------------------------------------
      // 模式 2 & 3：补充 / 修改模式 (UPDATE)
      // ------------------------------------
      else {
        if (!selectedTrackId) {
          setErrorMsg('请选择歌曲');
          setSubmitting(false);
          return;
        }

        if (mode === 'edit' && !isVerified) {
          setErrorMsg('请先完成贡献者身份验证！');
          setSubmitting(false);
          return;
        }

        const target = existingTracks.find((t) => String(t.id) === String(selectedTrackId));
        const updates = {};

        // 模式 3：原上传者修改模式（全量覆盖编辑）
        if (mode === 'edit') {
          updates.title = title.trim();
          updates.artist = artist.trim();
          updates.album = album.trim();
          updates.mv_url = mvUrl.trim() || null;
          updates.lyric_jp = lyricJp.trim() || null;
          updates.lyric_cn = lyricCn.trim() || null;
        } 
        // 模式 2：他人补充模式（增量拼接/补充，防止覆盖）
        else {
          if (mvUrl.trim()) updates.mv_url = mvUrl.trim();

          // 歌词补充：采用 追加/拼接 逻辑
          if (lyricJp.trim() && lyricJp.trim() !== target.lyric_jp) {
            updates.lyric_jp = target.lyric_jp
              ? `${target.lyric_jp}\n\n--- 【补充/校对版本】 ---\n${lyricJp.trim()}`
              : lyricJp.trim();
          }
          if (lyricCn.trim() && lyricCn.trim() !== target.lyric_cn) {
            updates.lyric_cn = target.lyric_cn
              ? `${target.lyric_cn}\n\n--- 【补充/校对版本】 ---\n${lyricCn.trim()}`
              : lyricCn.trim();
          }

          if (supplementContributor.trim()) {
            updates.supplement_contributor = supplementContributor.trim();
          }
        }

        // 文件覆盖更新（如重新选择音频或封面）
        if (audioFile) {
          const audioExt = audioFile.name.split('.').pop();
          const audioName = `track-${Date.now()}.${audioExt}`;
          const { error: aErr } = await supabase.storage.from('music').upload(audioName, audioFile);
          if (!aErr) {
            const { data: aPub } = supabase.storage.from('music').getPublicUrl(audioName);
            updates.audio_url = aPub.publicUrl;
          }
        }

        if (coverFile) {
          const coverExt = coverFile.name.split('.').pop();
          const coverName = `cover-${Date.now()}.${coverExt}`;
          const { error: cErr } = await supabase.storage.from('music').upload(coverName, coverFile);
          if (!cErr) {
            const { data: cPub } = supabase.storage.from('music').getPublicUrl(coverName);
            updates.cover_url = cPub.publicUrl;
          }
        }

        const { error: updateErr } = await supabase
          .from('music')
          .update(updates)
          .eq('id', selectedTrackId);

        if (updateErr) throw updateErr;
      }

      router.push('/music');
    } catch (err) {
      console.error('提交失败:', err);
      setErrorMsg(err.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>音乐贡献与修改 | MUSIC | ヨルシカ FanSite</title>
      </Head>

      <div className="min-h-screen bg-[#fafbfc] pt-24 pb-20 px-4 sm:px-8">
        <div className="max-w-2xl mx-auto">
          
          <div className="mb-8 flex items-center justify-between">
            <Link href="/music" className="text-xs tracking-widest text-[#88abac] hover:underline">
              ← 返回音乐列表
            </Link>
            <span className="text-xs text-zinc-400 font-serif">MUSIC ARCHIVE</span>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-zinc-100 space-y-6">
            
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-serif text-zinc-800 tracking-widest mb-2">
                音乐贡献与修改 / CONTRIBUTE
              </h1>
              <p className="text-xs font-serif italic text-zinc-400 tracking-wider">
                共建夜鹿音乐档案馆
              </p>
            </div>

            {/* 3 Mode Tab 切换 */}
            <div className="flex rounded-xl bg-zinc-100 p-1 font-mono text-[11px] sm:text-xs">
              <button
                type="button"
                onClick={() => handleModeChange('new')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  mode === 'new' ? 'bg-[#88abac] text-white shadow-sm' : 'text-zinc-600'
                }`}
              >
                🎵 新增歌曲
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('supplement')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  mode === 'supplement' ? 'bg-[#88abac] text-white shadow-sm' : 'text-zinc-600'
                }`}
              >
                ✍️ 补充翻译/MV
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('edit')}
                className={`flex-1 py-2 rounded-lg transition-all ${
                  mode === 'edit' ? 'bg-[#88abac] text-white shadow-sm' : 'text-zinc-600'
                }`}
              >
                ✏️ 修改我的上传
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs">
                ⚠️ {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs">
                ✅ {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* 选择歌曲（补充/修改模式） */}
              {mode !== 'new' && (
                <div className="p-4 rounded-xl bg-[#88abac]/10 border border-[#88abac]/20 space-y-3">
                  <div>
                    <label className="block text-xs font-serif text-zinc-700 font-medium mb-1.5">
                      选择目标歌曲 *
                    </label>
                    <select
                      value={selectedTrackId}
                      onChange={(e) => {
                        setSelectedTrackId(e.target.value);
                        setIsVerified(false);
                      }}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] bg-white"
                      required
                    >
                      <option value="">-- 请选择需要操作的歌曲 --</option>
                      {existingTracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} (贡献者: {t.contributor || '匿名'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ✏️ 修改模式：身份校验控件 */}
                  {mode === 'edit' && (
                    <div className="pt-2 border-t border-zinc-200/60 space-y-2">
                      <label className="block text-xs font-serif text-zinc-700">
                        验证你的贡献者昵称 *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="输入你上传该曲时填写的昵称"
                          value={verifyName}
                          onChange={(e) => setVerifyName(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac]"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyContributor}
                          className="px-4 py-2 bg-zinc-800 text-white hover:bg-zinc-700 rounded-xl text-xs font-mono shrink-0"
                        >
                          验证身份
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 在修改模式未通过验证时隐藏下方表单 */}
              {(mode !== 'edit' || isVerified) && (
                <>
                  <div>
                    <label className="block text-xs font-serif text-zinc-700 mb-1.5">曲名 *</label>
                    <input
                      type="text"
                      placeholder="如：花に風"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={mode === 'supplement'}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] disabled:bg-zinc-50"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-serif text-zinc-700 mb-1.5">演奏者</label>
                      <input
                        type="text"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        disabled={mode === 'supplement'}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] disabled:bg-zinc-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-serif text-zinc-700 mb-1.5">所属专辑</label>
                      <input
                        type="text"
                        placeholder="如：盗作"
                        value={album}
                        onChange={(e) => setAlbum(e.target.value)}
                        disabled={mode === 'supplement'}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] disabled:bg-zinc-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-serif text-zinc-700 mb-1.5">MV 视频链接</label>
                    <input
                      type="text"
                      placeholder="Bilibili / YouTube 视频链接"
                      value={mvUrl}
                      onChange={(e) => setMvUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac]"
                    />
                  </div>

                  {/* 音频/封面 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-serif text-zinc-700 mb-1.5">
                        {mode === 'new' ? '音频文件 (.mp3) *' : '替换音频 (可选)'}
                      </label>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setAudioFile(e.target.files[0])}
                        className="w-full text-xs text-zinc-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-zinc-100"
                        required={mode === 'new'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-serif text-zinc-700 mb-1.5">
                        {mode === 'new' ? '专辑封面 (可选)' : '替换封面 (可选)'}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCoverFile(e.target.files[0])}
                        className="w-full text-xs text-zinc-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-zinc-100"
                      />
                    </div>
                  </div>

                  {/* 歌词 */}
                  <div>
                    <label className="block text-xs font-serif text-zinc-700 mb-1.5">日文歌词</label>
                    <textarea
                      rows={3}
                      value={lyricJp}
                      onChange={(e) => setLyricJp(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-serif text-zinc-700 mb-1.5">中文翻译歌词</label>
                    <textarea
                      rows={3}
                      value={lyricCn}
                      onChange={(e) => setLyricCn(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac] resize-none"
                    />
                  </div>

                  {/* 署名 */}
                  {mode === 'new' && (
                    <div>
                      <label className="block text-xs font-serif text-zinc-700 mb-1.5">你的贡献者昵称</label>
                      <input
                        type="text"
                        placeholder="默认：匿名鹿友"
                        value={contributor}
                        onChange={(e) => setContributor(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac]"
                      />
                    </div>
                  )}
                  {mode === 'supplement' && (
                    <div>
                      <label className="block text-xs font-serif text-zinc-700 mb-1.5">补充贡献者昵称</label>
                      <input
                        type="text"
                        placeholder="如：校对人昵称"
                        value={supplementContributor}
                        onChange={(e) => setSupplementContributor(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#88abac]"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#88abac] hover:bg-[#789b9c] text-white rounded-xl text-xs font-medium tracking-widest transition-all shadow-sm"
                  >
                    {submitting ? '提交保存中...' : '确认提交 / SUBMIT'}
                  </button>
                </>
              )}

            </form>
          </div>

        </div>
      </div>
    </Layout>
  );
}