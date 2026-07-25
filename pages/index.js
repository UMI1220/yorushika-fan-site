import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const allAlbums = [
  { id: 1, name: '夏草が邪魔をする', date: '2017.06.28', tracks: '7首', cover: '/covers/1.jpg', quote: '「言葉に出来ないから、歌を歌うことにした」' },
  { id: 2, name: '負け犬にアンコールはいらない', date: '2018.05.09', tracks: '9首', cover: '/covers/2.jpg', quote: '「ただ君に晴れ。夏の匂いがした」' },
  { id: 3, name: '藍二乗', date: '2018.12.27', tracks: '1首', cover: '/covers/3.jpg', quote: '「人生は人生のまま、藍色の空に消えていく」' },
  { id: 4, name: 'だから僕は音楽を辞めた', date: '2019.04.10', tracks: '14首', cover: '/covers/4.jpg', quote: '「エルマ、君へ。僕の音楽をすべてあげる」' },
  { id: 5, name: '心に穴が空いた', date: '2019.06.24', tracks: '1首', cover: '/covers/5.jpg', quote: '「音楽なんて要らなかった、君がいればよかった」' },
  { id: 6, name: 'エルマ', date: '2019.08.28', tracks: '14首', cover: '/covers/6.jpg', quote: '「雨とカプチーノ。心に降る雨が止まない」' },
  { id: 7, name: '夜行', date: '2020.03.04', tracks: '1首', cover: '/covers/7.jpg', quote: '「夜を行く列車、僕らの秘密を乗せて」' },
  { id: 8, name: '花に亡霊', date: '2020.04.22', tracks: '1首', cover: '/covers/8.jpg', quote: '「もう忘れてしまったかな、夏の匂いは」' },
  { id: 9, name: '春ひさぎ', date: '2020.06.03', tracks: '1首', cover: '/covers/9.jpg', quote: '「売春の街に咲く、一輪の徒花」' },
  { id: 10, name: '思想犯', date: '2020.06.24', tracks: '1首', cover: '/covers/10.jpg', quote: '「思考を止めるな、言葉を盗み出せ」' },
  { id: 11, name: '盗作 (先行Single)', date: '2020.07.22', tracks: '1首', cover: '/covers/11.jpg', quote: '「音を奪う。その響きだけが僕の救いだった」' },
  { id: 12, name: '盗作 (Full Album)', date: '2020.07.29', tracks: '14首', cover: '/covers/12.jpg', quote: '「音楽の盗作をする男の、破滅と美学の全貌」' },
  { id: 13, name: '風を食む', date: '2020.10.07', tracks: '1首', cover: '/covers/13.jpg', quote: '「流れる雲のように、風を食べて生きていく」' },
  { id: 14, name: '春泥棒', date: '2021.01.09', tracks: '1首', cover: '/covers/14.jpg', quote: '「桜の散る速さで、春が通り過ぎていく」' },
  { id: 15, name: '創作', date: '2021.01.26', tracks: '5首', cover: '/covers/15.jpg', quote: '「春泥棒。貴方の目に映る春を盗む」' },
  { id: 16, name: '又三郎', date: '2021.06.07', tracks: '1首', cover: '/covers/16.jpg', quote: '「どっどど どどうど、風を呼ぶ少年」' },
  { id: 17, name: '老人と海', date: '2021.08.18', tracks: '1首', cover: '/covers/17.jpg', quote: '「大きな海と、静かな波の音を聞いた」' },
  { id: 18, name: '月に吠える', date: '2021.10.06', tracks: '1首', cover: '/covers/18.jpg', quote: '「夜空に浮かぶ月、孤独な遠吠え」' },
  { id: 19, name: 'LIVE「月光」', date: '2022.06.29', tracks: '23首', cover: '/covers/19.jpg', quote: '「月明かりの下、再現されるあの夏と物語」' },
  { id: 20, name: 'ブレーメン', date: '2022.07.04', tracks: '1首', cover: '/covers/20.jpg', quote: '「音楽隊は行く、どこまでも遠い場所へ」' },
  { id: 21, name: '左右盲', date: '2022.07.25', tracks: '1首', cover: '/covers/21.jpg', quote: '「右と左も分からないまま、君の手を握る」' },
  { id: 22, name: 'チノカテ', date: '2022.08.29', tracks: '1首', cover: '/covers/22.jpg', quote: '「地の糧を食み、静かな生活を愛す」' },
  { id: 23, name: 'テレパス', date: '2023.01.12', tracks: '1首', cover: '/covers/23.jpg', quote: '「言葉を交わさずとも、心で繋がる瞬間」' },
  { id: 24, name: 'アルジャーノン', date: '2023.02.06', tracks: '1首', cover: '/covers/24.jpg', quote: '「ステップを踏む、迷路の中で君を探す」' },
  { id: 25, name: '451', date: '2023.03.08', tracks: '1首', cover: '/covers/25.jpg', quote: '「華氏451度、本が燃える夜の温度」' },
  { id: 26, name: '幻燈 (10曲選集)', date: '2023.04.05', tracks: '10首', cover: '/covers/26.jpg', quote: '「画集と巡る、新章への扉」' },
  { id: 27, name: '幻燈 (全25曲画集盤)', date: '2023.04.05', tracks: '25首', cover: '/covers/27.jpg', quote: '「聴く画集。絵画と音楽が織利なす壮大な世界」' },
  { id: 28, name: '斜陽', date: '2023.05.08', tracks: '1首', cover: '/covers/28.jpg', quote: '「斜陽の光が、二人の影を長く伸ばす」' },
  { id: 29, name: '月光浴', date: '2023.10.13', tracks: '1首', cover: '/covers/29.jpg', quote: '「静かに降り注ぐ月光を浴びて」' },
  { id: 30, name: '晴る', date: '2024.01.05', tracks: '1首', cover: '/covers/30.jpg', quote: '「晴れ渡る空、新しい季節の始まり」' },
  { id: 31, name: 'ルバート', date: '2024.05.29', tracks: '1首', cover: '/covers/31.jpg', quote: '「自由なテンポで、心動くままに奏でる」' },
  { id: 32, name: '忘れてください', date: '2024.07.13', tracks: '1首', cover: '/covers/32.jpg', quote: '「どうか私のことを、綺麗な思い出のまま」' },
  { id: 33, name: '憂、燦々', date: '2024.08.28', tracks: '1首', cover: '/covers/33.jpg', quote: '「憂鬱な日々に降り注ぐ、燦々たる光」' },
  { id: 34, name: 'アポリア', date: '2024.10.07', tracks: '1首', cover: '/covers/34.jpg', quote: '「解けない問いを抱えて、空を見上げる」' },
  { id: 35, name: '太陽', date: '2024.11.22', tracks: '1首', cover: '/covers/35.jpg', quote: '「光の射す方へ、歩き続ける」' },
  { id: 36, name: 'へび', date: '2025.01.17', tracks: '1首', cover: '/covers/36.jpg', quote: '「脱皮を繰り返す心、脱ぎ捨てた過去」' },
  { id: 37, name: '火星人', date: '2025.05.09', tracks: '1首', cover: '/covers/37.jpg', quote: '「遠い星からの視線、不思議なシグナル」' },
  { id: 38, name: '修羅', date: '2025.08.08', tracks: '1首', cover: '/covers/38.jpg', quote: '「修羅の道を往く、静かな決意」' },
  { id: 39, name: 'DARMA GRAND PRIX', date: '2025.11.19', tracks: '1首', cover: '/covers/39.jpg', quote: '「疾走するリフレイン、加速する鼓動」' },
  { id: 40, name: 'Play Sick', date: '2025.12.22', tracks: '1首', cover: '/covers/40.jpg', quote: '「旋律の病に侵されて、夢を奏でる」' },
  { id: 41, name: '茜', date: '2026.02.04', tracks: '1首', cover: '/covers/41.jpg', quote: '「茜色に染まる夕空、過ぎ去りし日々」' },
  { id: 42, name: '二人称', date: '2026.03.04', tracks: '22首', cover: '/covers/42.jpg', quote: '「君と僕、二人だけの世界を紡ぐ集大成」' },
  { id: 43, name: 'あぶく', date: '2026.04.22', tracks: '1首', cover: '/covers/43.jpg', quote: '「水面に消える泡沫のように、儚く愛しい」' },
];

const slots = [
  { rotate: '-rotate-3 sm:-rotate-6', offset: 'translate-y-1 sm:translate-y-2' },
  { rotate: 'rotate-2 sm:rotate-3', offset: '-translate-y-2 sm:-translate-y-3' },
  { rotate: '-rotate-2 sm:-rotate-3', offset: 'translate-y-2 sm:translate-y-4' },
  { rotate: 'rotate-3 sm:rotate-6', offset: '-translate-y-1 sm:-translate-y-2' },
  { rotate: '-rotate-6 sm:-rotate-12', offset: 'translate-y-2 sm:translate-y-3' },
  { rotate: 'rotate-3 sm:rotate-6', offset: '-translate-y-1' },
];

const watercolorShapes = [
  'polygon(12% 8%, 88% 2%, 96% 78%, 78% 98%, 22% 92%, 4% 65%, 2% 28%)',
  'polygon(8% 15%, 82% 4%, 98% 62%, 85% 95%, 15% 98%, 2% 72%, 0% 32%)',
  'polygon(15% 4%, 95% 12%, 92% 85%, 68% 96%, 8% 90%, 2% 50%, 5% 20%)',
  'polygon(5% 10%, 92% 5%, 98% 70%, 82% 92%, 18% 96%, 0% 60%, 2% 25%)',
  'polygon(10% 2%, 85% 10%, 95% 82%, 72% 98%, 10% 88%, 4% 45%, 0% 20%)',
  'polygon(18% 6%, 98% 18%, 88% 90%, 60% 98%, 5% 85%, 0% 40%, 8% 15%)',
];

export default function Home() {
  const [activeSlot, setActiveSlot] = useState(0);
  const [albumOffsets, setAlbumOffsets] = useState([0, 1, 2, 3, 4, 5]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlot((prevSlot) => {
        const nextSlot = (prevSlot + 1) % slots.length;
        setAlbumOffsets((prevOffsets) => {
          const newOffsets = [...prevOffsets];
          newOffsets[nextSlot] = (newOffsets[nextSlot] + slots.length) % allAlbums.length;
          return newOffsets;
        });
        return nextSlot;
      });
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-20 text-center">
        <h1 className="text-xl sm:text-3xl md:text-4xl font-light text-zinc-900 mb-2 sm:mb-3 tracking-[0.2em] font-serif">
          言の葉と、夏の幻。
        </h1>
        <p className="text-[10px] sm:text-xs text-zinc-400 tracking-[0.3em] uppercase mb-12 sm:mb-20">
          Yorushika Fan Collection
        </p>

        <div className="relative min-h-[300px] sm:min-h-[380px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-8 items-center justify-center px-2 sm:px-4">
          {slots.map((slot, slotIdx) => {
            const albumIndex = albumOffsets[slotIdx];
            const album = allAlbums[albumIndex];
            const isActive = slotIdx === activeSlot;
            const shapeClip = watercolorShapes[slotIdx % watercolorShapes.length];

            return (
              <div
                key={slotIdx}
                onClick={() => setActiveSlot(slotIdx)}
                onMouseEnter={() => setActiveSlot(slotIdx)}
                className={`relative group rounded-md overflow-hidden transition-all duration-700 ease-out transform cursor-pointer ${
                  isActive
                    ? 'scale-105 rotate-0 z-30 translate-y-0 shadow-2xl ring-1 ring-sky-300/50'
                    : `${slot.rotate} ${slot.offset} opacity-85 hover:opacity-100 hover:rotate-0 hover:scale-105 hover:z-20 shadow-md`
                }`}
              >
                <div className="w-full aspect-square bg-zinc-100 relative overflow-hidden">
                  <img
                    key={album.id}
                    src={album.cover}
                    alt={album.name}
                    className="w-full h-full object-cover transition-opacity duration-700 ease-in-out"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="hidden w-full h-full flex-col items-center justify-center p-2 text-center bg-zinc-100">
                    <span className="text-zinc-400 text-[10px] tracking-widest">{album.date}</span>
                    <span className="text-zinc-800 font-medium text-xs mt-1">{album.name}</span>
                  </div>
                </div>

                <div
                  className={`absolute inset-0 flex flex-col justify-center items-center p-2 sm:p-3 text-center transition-all duration-700 ease-out ${
                    isActive
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'
                  }`}
                >
                  <div 
                    className="w-[94%] h-[94%] flex flex-col items-center justify-center p-2 sm:p-3 backdrop-blur-[2px]"
                    style={{
                      clipPath: shapeClip,
                      background: 'radial-gradient(circle at 40% 40%, rgba(186, 230, 253, 0.93) 0%, rgba(125, 211, 252, 0.88) 60%, rgba(56, 189, 248, 0.82) 100%)',
                      boxShadow: 'inset 0 0 15px rgba(255, 255, 255, 0.6)'
                    }}
                  >
                    <p className="text-[10px] sm:text-[11px] font-serif italic leading-snug text-zinc-900 drop-shadow-sm font-medium">
                      {album.quote}
                    </p>
                    
                    <div className="mt-1 sm:mt-2 flex items-center justify-center space-x-1 text-[8px] sm:text-[9px] text-sky-950 font-mono tracking-widest uppercase opacity-85 font-semibold">
                      <span>{album.date}</span>
                      <span>•</span>
                      <span>{album.tracks}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Layout>
  );
}
