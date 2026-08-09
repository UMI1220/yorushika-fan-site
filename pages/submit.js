import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function SubmitPage() {
  const [mode, setMode] = useState('supplement'); // 'supplement' (补充新曲) | 'modify' (修正已知)
  
  // 表单状态
  const [albumId, setAlbumId] = useState('1');
  const [trackTitle, setTrackTitle] = useState('');
  const [contributorEmail, setContributorEmail] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [mvUrl, setMvUrl] = useState('');
  const [lrcJa, setLrcJa] = useState('');
  const [lrcZh, setLrcZh] = useState('');
  const [coverFileName, setCoverFileName] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trackTitle.trim() || !contributorEmail.trim()) {
      setMsg({ type: 'error', text: '请填写曲目名称与贡献者邮箱！' });
      return;
    }

    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      // 提交给后台/管理员审核队列 API
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_contribution',
          data: {
            id: `sub_${Date.now()}`,
            mode,
            albumId: parseInt(albumId, 10),
            trackTitle: trackTitle.trim(),
            contributorEmail: contributorEmail.trim(),
            audioUrl: audioUrl.trim(),
            mvUrl: mvUrl.trim(),
            lrcJa: lrcJa.trim(),
            lrcZh: lrcZh.trim(),
            coverFileName: coverFileName.trim(),
            notes: notes.trim(),
          },
        }),
      });

      if (!res.ok) throw new Error('提交失败');

      setMsg({
        type: 'success',
        text: '贡献内容已送达审核队列！超级管理员 (UMI1220) 审核通过后将正式合并上线。',
      });

      // 重置表单
      setTrackTitle('');
      setAudioUrl('');
      setMvUrl('');
      setLrcJa('');
      setLrcZh('');
      setCoverFileName('');
      setNotes('');
    } catch (err) {
      setMsg({ type: 'error', text: '提交发生错误，请稍后重试。' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>CONTRIBUTE / 社区贡献 · ヨルシカ Fan Site</title>
      </Head>

      <div className="max-w-3xl mx-auto px-4 py-8 font-serif text-zinc-200 space-y-8">
        {/* 顶部标题 */}
        <div className="border-b border-[#88abac]/20 pb-4">
          <span className="text-[10px] font-mono text-[#a5c9ca] tracking-widest block uppercase mb-1">
            COMMUNITY CONTRIBUTION / 音楽泥棒の庭
          </span>
          <h1 className="text-2xl font-medium tracking-wide text-white">社区曲目与歌词贡献</h1>
        </div>

        {/* 模式选择切换栏 */}
        <div className="flex border border-[#88abac]/30 p-1 bg-zinc-900/60 font-mono text-xs">
          <button
            type="button"
            onClick={() => setMode('supplement')}
            className={`flex-1 py-2 text-center transition ${
              mode === 'supplement'
                ? 'bg-[#88abac] text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ＋ 补充新曲 / 歌词
          </button>
          <button
            type="button"
            onClick={() => setMode('modify')}
            className={`flex-1 py-2 text-center transition ${
              mode === 'modify'
                ? 'bg-[#88abac] text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ✏️ 修正已知曲目 / 错误校对
          </button>
        </div>

        {/* 提示消息 */}
        {msg.text && (
          <div
            className={`p-4 font-mono text-xs border ${
              msg.type === 'success'
                ? 'bg-[#88abac]/10 border-[#88abac] text-[#a5c9ca]'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* 贡献表单 */}
        <form onSubmit={handleSubmit} className="bg-zinc-900/80 border border-white/5 p-6 sm:p-8 space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">所属专辑 *</label>
              <select
                value={albumId}
                onChange={(e) => setAlbumId(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 p-2.5 text-zinc-200 focus:outline-none focus:border-[#88abac]"
              >
                <option value="1">1. 夏草が邪魔をする (夏草旁骛)</option>
                <option value="2">2. 負け犬にアンコールはいらない (败犬重奏)</option>
                <option value="3">3. だから僕は音楽を辞めた (所以放弃音乐)</option>
                <option value="4">4. エルマ (Elma)</option>
                <option value="5">5. 盗作 (盗作)</option>
                <option value="6">6. 幻燈 (Magic Lantern)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">曲目名称 (日/中) *</label>
              <input
                type="text"
                placeholder="例如: 言の葉 / 言之叶"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 p-2.5 text-zinc-200 focus:outline-none focus:border-[#88abac]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">贡献者邮箱 * (用于审核通过通知)</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={contributorEmail}
              onChange={(e) => setContributorEmail(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 p-2.5 text-zinc-200 focus:outline-none focus:border-[#88abac]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">音频 CDN 路径 / 链接 (选填)</label>
              <input
                type="text"
                placeholder="music/song.mp3 或外链"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 p-2.5 text-zinc-200 focus:outline-none font-mono focus:border-[#88abac]"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">MV / Bilibili 嵌入链接 (选填)</label>
              <input
                type="text"
                placeholder="https://www.bilibili.com/video/..."
                value={mvUrl}
                onChange={(e) => setMvUrl(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 p-2.5 text-zinc-200 focus:outline-none font-mono focus:border-[#88abac]"
              />
            </div>
          </div>

          {/* LRC 歌词输入区 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">日文 LRC 歌词 (含时间轴)</label>
              <textarea
                rows={6}
                placeholder="[00:12.00]音楽の盗作をして生きていた..."
                value={lrcJa}
                onChange={(e) => setLrcJa(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 p-2.5 text-zinc-200 focus:outline-none font-mono text-[11px] leading-relaxed focus:border-[#88abac]"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">中文 LRC 歌词 (含时间轴)</label>
              <textarea
                rows={6}
                placeholder="[00:12.00]我靠着盗作别人的音乐度过了半生..."
                value={lrcZh}
                onChange={(e) => setLrcZh(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 p-2.5 text-zinc-200 focus:outline-none font-mono text-[11px] leading-relaxed focus:border-[#88abac]"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">补充说明 / 备注校对原因</label>
            <textarea
              rows={3}
              placeholder="例如: 修正了第2节歌词中日翻译偏差..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 p-2.5 text-zinc-200 focus:outline-none focus:border-[#88abac]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#88abac] hover:bg-[#789b9c] text-zinc-950 font-bold text-xs tracking-widest transition uppercase font-mono"
          >
            {submitting ? 'SUBMITTING...' : '确认并发送贡献申请 / SUBMIT'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
