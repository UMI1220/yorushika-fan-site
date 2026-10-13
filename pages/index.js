import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import OnboardingOverlay from '../components/OnboardingOverlay';

// 精简版专辑数据，避免超大的内联文本导致构建解析问题。
const yorushikaAlbums = [
  {
    id: 1,
    albumName: '夏草が邪魔をする',
    tracks: [
      { name: 'カトレア', quote: '「愛なんていらないよ もう見たくもない」\n（爱什么的不需要了，我已经不想再看到了）' },
      { name: '言って。', quote: '「もっと言ってもっと言って　君の口で　僕を忘れる言葉を言って」\n（再多说一点，多说一点，用你的嘴，说出能让我忘记的词）' }
    ]
  },
  {
    id: 2,
    albumName: '負け犬にアンコールはいらない',
    tracks: [
      { name: '負け犬にアンコールはいらない', quote: '「僕らの歌にアンコールはいらない」\n（我们的歌不需要安可）' }
    ]
  },
  {
    id: 3,
    albumName: '藍二乗',
    tracks: [
      { name: '藍二乗', quote: '「変わらないものがあるなら、教えてくれよ」\n（如果有什么是不曾改变的，请告诉我吧）' }
    ]
  }
];

export default function Home() {
  const [selectedStamp, setSelectedStamp] = useState(null);
  const [cardOpacity, setCardOpacity] = useState('100');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('yorusend_user_email') : null;
    if (!savedEmail) setShowOnboarding(true);

    const randomAlbumIndex = Math.floor(Math.random() * yorushikaAlbums.length);
    const album = yorushikaAlbums[randomAlbumIndex] || yorushikaAlbums[0];
    const randomTrackIndex = Math.floor(Math.random() * album.tracks.length);
    const track = album.tracks[randomTrackIndex];

    setSelectedStamp({
      albumId: album.id,
      albumName: album.albumName,
      trackName: track.name,
      quote: track.quote,
    });

    const savedOpacity = typeof window !== 'undefined' ? localStorage.getItem('yorusend_card_opacity') : null;
    if (savedOpacity) setCardOpacity(savedOpacity);
  }, []);

  return (
    <Layout>
      {showOnboarding && <OnboardingOverlay onFinish={() => setShowOnboarding(false)} />}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <Head>
          <title>夜邮 YORUSEND - 邮票册与深夜回响</title>
        </Head>

        {selectedStamp && (
          <div
            className="w-full max-w-md rounded-3xl p-8 shadow-2xl border border-gray-200/60 dark:border-zinc-800 transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center"
            style={{ backgroundColor: `rgba(255, 255, 255, ${cardOpacity / 100})` }}
          >
            <div className="absolute top-4 left-6 text-xs font-mono text-gray-400 dark:text-zinc-500 tracking-widest">
              STAMP NO. {selectedStamp.albumId} / 43
            </div>

            <div className="w-48 h-48 mt-6 mb-8 rounded-2xl overflow-hidden shadow-md border-4 border-white dark:border-zinc-800 relative group bg-gray-100 dark:bg-zinc-800">
              <img
                src={`/${selectedStamp.albumId}.jpg`}
                alt={`Album ${selectedStamp.albumId}`}
                onError={(e) => { e.target.src = '/yorusend.jpg'; }}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[#73C991]/10 mix-blend-color pointer-events-none" />
            </div>

            <div className="space-y-4 mb-8 w-full">
              <span className="inline-block px-3 py-1 bg-[#73C991]/10 text-[#73C991] text-xs font-medium rounded-full">《{selectedStamp.albumName}》</span>

              <p className="text-sm md:text-base text-gray-700 dark:text-zinc-200 font-serif leading-relaxed whitespace-pre-line px-4">{selectedStamp.quote}</p>

              <p className="text-xs font-mono text-gray-400 dark:text-zinc-500 tracking-wider pt-2">――《{selectedStamp.trackName}》</p>
            </div>

            <div className="w-full pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-zinc-500">将思绪寄往夜空</span>

              <Link href="/transition" className="px-6 py-2.5 bg-[#73C991] text-white text-xs font-medium rounded-full shadow-md hover:opacity-90 transition-all flex items-center space-x-2">
                <span>写信</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
