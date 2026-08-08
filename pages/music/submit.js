import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { YORUSHIKA_DISCOGRAPHY } from '../../lib/discography';

export default function MusicSubmitPage() {
  // 模式选择: 'supplement' (补充) | 'modify' (修改)
  const [submitMode, setSubmitMode] = useState('supplement');
  
  // 表单状态
  const [selectedAlbumId, setSelectedAlbumId] = useState(1);
  const [trackTitle, setTrackTitle] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [mvUrl, setMvUrl] = useState('');
  const [lrcJa, setLrcJa] = useState('');
  const [lrcZh, setLrcZh] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [notes, setNotes] = useState('');
  
  // 状态反馈
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // 模拟自动计算下一张新封面的重命名序号 (例如 47.jpg)
  const nextCoverIndex = 47; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contributorEmail || !contributorEmail.includes('@')) {
      setMessage('请填写有效的贡献者邮箱，该邮箱将作为歌词区贡献人标记。');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      // 提交 API Payload
      const payload = {
        mode: submitMode,
        albumId: selectedAlbumId,
        trackTitle,
        contributorEmail,
        audioUrl,
        mvUrl,
        lrcJa,
        lrcZh,
        coverFileName: coverFile ? `${nextCoverIndex}.jpg` : null,
        notes
      };

      const res = await fetch('/api/music/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMessage(`提交成功！感谢你的贡献。新封面将自动归档为 ${nextCoverIndex}.jpg，贡献者信息已记录。`);
        // 重置表单
        setTrackTitle('');
        setAudioUrl('');
        setMvUrl('');
        setLrcJa('');
        setLrcZh('');
        setCoverFile(null);
      } else {
        setMessage('提交失败，请检查网络或配置。');
      }
    } catch (err) {
      setMessage('提交过程遇到错误：' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>曲目贡献与修改 - ヨルシカ</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 font-sans">
        
        {/* 页头面包屑与标题 */}
        <div className="border-b border-zinc-800 pb-4 mb-8 flex justify-between items-end">
          <div>
            <Link href="/music" className="text-xs font-mono text-[#a5c9ca] hover:underline block mb-1">
              ← RETURN TO MUSIC
            </Link>
            <h1 className="text-xl sm:text-2xl font-serif tracking-widest font-medium">
              音楽資料の補充と修正
            </h1>
          </div>
          <span className="text-[10px] font-mono opacity-50 uppercase hidden sm:block">
            CONTRIBUTE & EDIT MODULE
          </span>
        </div>

        {/* 主体卡片 (毛玻璃直角卡片) */}
        <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-6 sm:p-8 space-y-6">
          
          {/* 1. 模式切换按钮 (补充 vs 修改) */}
          <div className="flex border border-zinc-800 bg-zinc-950/80 font-mono text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSubmitMode('supplement')}
              className={`flex-1 sm:flex-none px-6 py-2.5 transition ${
                submitMode === 'supplement'
                  ? 'bg-[#a5c9ca] text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              补充模式 (ADD MEDIA)
            </button>
            <button
              type="button"
              onClick={() => setSubmitMode('modify')}
              className={`flex-1 sm:flex-none px-6 py-2.5 transition ${
                submitMode === 'modify'
                  ? 'bg-[#a5c9ca] text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              修改模式 (CORRECT INFO)
            </button>
          </div>

          <p className="text-xs font-serif text-zinc-400 italic">
            {submitMode === 'supplement'
              ? '「补充模式」：为已有缺项的曲目补充音源链接、Bilibili MV 嵌入地址、中日 LRC 歌词或封面图。'
              : '「修改模式」：修正曲目名称、曲序、作者标注或修正错误的歌词。'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs font-serif">
            
            {/* 关联专辑与曲目 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] text-zinc-400 mb-1.5 uppercase">
                  选择关联专辑 / ALBUM
                </label>
                <select
                  value={selectedAlbumId}
                  onChange={(e) => setSelectedAlbumId(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200 focus:border-[#a5c9ca] focus:outline-none rounded-none"
                >
                  {YORUSHIKA_DISCOGRAPHY.map((album) => (
                    <option key={album.id} value={album.id}>
                      [{album.date}] {album.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-zinc-400 mb-1.5 uppercase">
                  曲目标题 / TRACK TITLE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="如: 言って。"
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200 focus:border-[#a5c9ca] focus:outline-none rounded-none"
                />
              </div>
            </div>

            {/* 贡献人有效邮箱 (必填，显示在歌词区) */}
            <div>
              <label className="block font-mono text-[10px] text-[#a5c9ca] mb-1.5 uppercase">
                贡献者邮箱 / CONTRIBUTOR EMAIL * (将在歌词页底端署名)
              </label>
              <input
                type="email"
                required
                placeholder="your-name@example.com"
                value={contributorEmail}
                onChange={(e) => setContributorEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200 focus:border-[#a5c9ca] focus:outline-none rounded-none"
              />
            </div>

            {/* 音频与 MV 链接 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] text-zinc-400 mb-1.5 uppercase">
                  音频文件 URL (AUDIO FILE URL)
                </label>
                <input
                  type="url"
                  placeholder="https://.../song.mp3"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200 focus:border-[#a5c9ca] focus:outline-none rounded-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-zinc-400 mb-1.5 uppercase">
                  MV Bilibili BV号 / EMBED URL
                </label>
                <input
                  type="text"
                  placeholder="BV134411c7A2"
                  value={mvUrl}
                  onChange={(e) => setMvUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200 focus:border-[#a5c9ca] focus:outline-none rounded-none"
                />
              </div>
            </div>

            {/* 自动重命名封面上传 */}
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 mb-1.5 uppercase">
                上传新封面 (自动命名归档为 {nextCoverIndex}.jpg 并存入 public/covers/)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => setCoverFile(e.target.files[0])}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs text-zinc-400 rounded-none file:mr-4 file:py-1 file:px-3 file:border-0 file:bg-zinc-800 file:text-zinc-200 hover:file:bg-[#a5c9ca] hover:file:text-zinc-950"
              />
            </div>

            {/* 中日双语 LRC 歌词输入 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] text-zinc-400 mb-1.5 uppercase">
                  日文 LRC 歌词 (JAPANESE LYRICS)
                </label>
                <textarea
                  rows={5}
                  placeholder="[00:12.00] 音楽の盗作をして生きていた..."
                  value={lrcJa}
                  onChange={(e) => setLrcJa(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200 font-mono text-[11px] focus:border-[#a5c9ca] focus:outline-none rounded-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-zinc-400 mb-1.5 uppercase">
                  中文 LRC 翻译 (CHINESE TRANSLATION)
                </label>
                <textarea
                  rows={5}
                  placeholder="[00:12.00] 我靠着盗作别人的音乐度过了半生..."
                  value={lrcZh}
                  onChange={(e) => setLrcZh(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200 font-mono text-[11px] focus:border-[#a5c9ca] focus:outline-none rounded-none"
                />
              </div>
            </div>

            {/* 补充说明 */}
            <div>
              <label className="block font-mono text-[10px] text-zinc-400 mb-1.5 uppercase">
                备注与来源说明 (NOTES)
              </label>
              <input
                type="text"
                placeholder="例如：歌词译者为鹿友A，音源来源于自购 CD 转录"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-zinc-200 focus:border-[#a5c9ca] focus:outline-none rounded-none"
              />
            </div>

            {/* 信息提示 */}
            {message && (
              <div className="p-3 bg-zinc-950 border border-[#a5c9ca]/40 text-[#a5c9ca] font-mono text-xs">
                {message}
              </div>
            )}

            {/* 提交按钮 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-[#a5c9ca] text-zinc-950 font-mono font-bold text-xs hover:bg-[#88abac] transition disabled:opacity-50 rounded-none"
              >
                {isSubmitting ? 'SUBMITTING...' : '确认并提交贡献'}
              </button>
            </div>

          </form>

        </div>
      </div>
    </Layout>
  );
}
