import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// 将 43 张专辑及有效歌词数据完整静态写入代码
const yorushikaAlbums = [
  {
    id: 1,
    albumName: '夏草が邪魔をする',
    tracks: [
      { name: 'カトレア', quote: '「愛なんていらないよ もう見たくもない」\n（爱什么的不需要了，我已经不想再看到了）' },
      { name: '言って。', quote: '「もっと言ってもっと言って　君の口で　僕を忘れる言葉を言って」\n（再多说一点，多说一点，用你的嘴，说出能让我忘记你的话吧）' },
      { name: 'あの夏に咲け', quote: '「言葉はいらない　ただ君を想おう」\n（不需要言语，只要想念着你）' },
      { name: '飛行', quote: '「空を飛ぶための翼なんていらない」\n（我不需要用来在天空飞翔的羽翼）' },
      { name: '靴の心火', quote: '「夕焼けを背に受けて走る」\n（背对着晚霞奔跑）' },
      { name: '雲と幽霊', quote: '「幽霊になった僕はさ　君の声を待っている」\n（变成了幽灵的我啊，正等待着你的声音）' }
    ]
  },
  {
    id: 2,
    albumName: '負け犬にアンコールはいらない',
    tracks: [
      { name: '負け犬にアンコールはいらない', quote: '「僕らの歌にアンコールはいらない」\n（我们的歌不需要安可）' },
      { name: '爆弾魔', quote: '「頭の中に爆弾がある」\n（脑海里装着一枚炸弹）' },
      { name: 'ヒッチコック', quote: '「先生、人類の歴史は人間が幸せになるためのものですか」\n（老师，人类的历史是为了让人们幸福而存在的吗）' },
      { name: '準透明少年', quote: '「透明な僕たちはどこへ行こうか」\n（透明的我们，该去往何方呢）' },
      { name: 'ただ君に晴れ', quote: '「絶え間なく注ぐ愛の名を　日暮れの風に添えて送る」\n（将那绵绵不绝的爱之名，随同傍晚的风一起送达）' },
      { name: '冬眠', quote: '「春が来るまで眠っていたい」\n（想一直沉睡，直到春天到来）' }
    ]
  },
  {
    id: 3,
    albumName: '藍二乗',
    tracks: [
      { name: '藍二乗', quote: '「変わらないものがあるなら、教えてくれよ」\n（如果有什么是不曾改变的，请告诉我吧）' }
    ]
  },
  {
    id: 4,
    albumName: 'だから僕は音楽を辞めた',
    tracks: [
      { name: '藍二乗', quote: '「ヴィヴァルディを口ずさむように」\n（就像哼唱着维瓦尔第那样）' },
      { name: '八月、某、月明かり', quote: '「最低だ、最低だ、君のいない世界なんて」\n（太糟糕了，太糟糕了，没有你的这个世界）' },
      { name: '詩書きと男', quote: '「僕の言葉を歌にしてくれ」\n（把我的文字变成歌吧）' },
      { name: '夕凪、あるいはおと訪れ', quote: '「夕凪の中に君を探す」\n（在风平浪静的夕阳下寻找你）' },
      { name: '八月、インビジブル', quote: '「見えない僕らはどこへ行く」\n（看不见的我们去向何处）' },
      { name: 'パレード', quote: '「夜の街をパレードがゆく」\n（巡游队伍穿过夜晚的街道）' },
      { name: 'エルマ', quote: '「エルマ、君の書いた歌を聴いているよ」\n（Elma，我正在听着你写的歌呢）' },
      { name: 'だから僕は音楽を辞めた', quote: '「間違ってないと言ってよ」\n（快跟我说“这没有错”啊）' },
      { name: '踊ろうぜ', quote: '「夜が明けるまで踊ろうぜ」\n（在天亮之前，一起来跳舞吧）' },
      { name: '六月は雨上がりの街を書く', quote: '「雨の匂いが残る街で」\n（在残留着雨水气息的街道上）' },
      { name: '五月は花緑青の窓辺から', quote: '「窓の外は緑が揺れている」\n（窗外繁绿摇曳）' },
      { name: '夜紛い', quote: '「夜の真ん中で君を思う」\n（在深夜的中央思念着你）' }
    ]
  },
  {
    id: 5,
    albumName: '心に穴が空いた',
    tracks: [
      { name: '心に穴が空いた', quote: '「心に穴が空いたから　埋めるための歌を書く」\n（因为心里空了一块，所以写下填补它的歌）' }
    ]
  },
  {
    id: 6,
    albumName: 'エルマ (Elma)',
    tracks: [
      { name: '憂一乗', quote: '「憂鬱の数だけ歌を歌おう」\n（有多少忧郁，就唱多少歌）' },
      { name: '雨とカプチーノ', quote: '「苦いカプチーノを飲み干して」\n（喝干苦涩的卡布奇诺）' },
      { name: '神様のダンス', quote: '「神様、僕らに踊りを教えて」\n（神啊，请教会我们跳舞吧）' },
      { name: '歩く', quote: '「歩いて、歩いて、どこまでも」\n（一步一步，走下去，走向永恒）' },
      { name: '心に穴が空いた', quote: '「穴の空いた心で生きていく」\n（怀着空洞的心继续生活）' },
      { name: '声', quote: '「君の声が遠く聞こえる」\n（遥远地听到你的声音）' },
      { name: 'エイミー', quote: '「エイミー、君に手紙を書くよ」\n（Amy，我写信给你）' },
      { name: 'ノーチラス', quote: '「さよなら、僕のノーチラス」\n（再见，我的鹦鹉螺号）' }
    ]
  },
  {
    id: 7,
    albumName: '夜行',
    tracks: [{ name: '夜行', quote: '「夜を行く僕らの足音」\n（我们穿行于夜晚的脚步声）' }]
  },
  {
    id: 8,
    albumName: '花に亡霊',
    tracks: [{ name: '花に亡霊', quote: '「もう忘れてしまったかな　夏の匂いも　君のことも」\n（是不是已经忘记了呢，关于夏天的气息，还有关于你的记忆）' }]
  },
  {
    id: 9,
    albumName: '春ひさぎ',
    tracks: [{ name: '春ひさぎ', quote: '「春を売る店で君を見た」\n（在卖春的店铺里见到了你）' }]
  },
  {
    id: 10,
    albumName: '思想犯',
    tracks: [{ name: '思想犯', quote: '「思考を止めるな、歌を止めないで」\n（不要停止思考，不要停下歌唱）' }]
  },
  {
    id: 11,
    albumName: '盗作 (单曲)',
    tracks: [{ name: '盗作', quote: '「音楽の盗作をする男の話」\n（一个抄袭音乐的人的故事）' }]
  },
  {
    id: 12,
    albumName: '盗作',
    tracks: [
      { name: '昼鳶', quote: '「昼の空に舞う鳶のように」\n（宛如在白昼天空飞舞的鸢）' },
      { name: '春ひさぎ', quote: '「花を売る少女の歌」\n（贩卖鲜花的少女之歌）' },
      { name: '爆弾魔 (Re-recording)', quote: '「心に仕掛けた爆弾」\n（在心里设下的炸弹）' },
      { name: '思想犯', quote: '「月明かりの夜に歌う」\n（在月光下歌唱）' },
      { name: '逃亡', quote: '「遠くへ逃げよう、君の手を引いて」\n（逃往遥远的地方吧，牵着你的手）' },
      { name: '夜行', quote: '「夜の深さに消えていく」\n（消逝在深夜之中）' },
      { name: '花に亡霊', quote: '「夏の終わりに咲く花」\n（夏末绽放的花朵）' },
      { name: '盗作', quote: '「音を盗む男の孤独」\n（偷窃声音之人的孤独）' },
      { name: '花人局', quote: '「美しい嘘で僕を騙して」\n（用美丽的谎言来欺骗我吧）' }
    ]
  },
  {
    id: 13,
    albumName: '風を食む',
    tracks: [{ name: '風を食む', quote: '「風を食んで生きていく」\n（啃食着微风生存下去）' }]
  },
  {
    id: 14,
    albumName: '春泥棒',
    tracks: [{ name: '春泥棒', quote: '「春を盗んだ泥棒は誰だ」\n（偷走春天的贼到底是谁呢）' }]
  },
  {
    id: 15,
    albumName: '創作',
    tracks: [
      { name: '強盗と花束', quote: '「花束を持って走る強盗」\n（拿着花束奔跑的强盗）' },
      { name: '春泥棒', quote: '「桜の舞い散る春の日に」\n（樱花纷飞的春日里）' },
      { name: '嘘月', quote: '「月に嘘をつく夜」\n（向月亮撒谎的夜晚）' },
      { name: '風を食む', quote: '「言葉を食べて生きていく」\n（吞食着语言生存下去）' }
    ]
  },
  {
    id: 16,
    albumName: '又三郎',
    tracks: [{ name: '又三郎', quote: '「どっかと吹いてくる風のように」\n（如呼啸而来的疾风般）' }]
  },
  {
    id: 17,
    albumName: '老人と海',
    tracks: [{ name: '老人と海', quote: '「海を見つめる老人のように」\n（宛如凝视大海的老人）' }]
  },
  {
    id: 18,
    albumName: '月に吠える',
    tracks: [{ name: '月に吠える', quote: '「月に吠える犬の遠吠え」\n（如向月亮咆哮的远方犬吠）' }]
  },
  {
    id: 19,
    albumName: 'ヨルシカ LIVE「月光」',
    tracks: [
      { name: '藍二乗 (Live)', quote: '现场演唱版本' },
      { name: '八月、某、月明かり (Live)', quote: '现场演唱版本' },
      { name: 'ウロボロス (Live)', quote: '「終わりと始まりの輪」\n（终结与始源之环）' },
      { name: '拝啓、少年よ (Live)', quote: '「拝啓、あの頃の僕へ」\n（敬启，给那时的我）' },
      { name: '莫 (Live)', quote: '「言葉の莫大な波」\n（语言的巨浪）' }
    ]
  },
  {
    id: 20,
    albumName: 'ブレーメン',
    tracks: [{ name: 'ブレーメン', quote: '「僕らはブレーメンへ向かう」\n（我们向着不来梅进发）' }]
  },
  {
    id: 21,
    albumName: '左右盲',
    tracks: [{ name: '左右盲', quote: '「左右盲の僕らは、君の顔から忘れていく」\n（左右盲的我们，正从你的容颜开始遗忘）' }]
  },
  {
    id: 22,
    albumName: 'チノカテ',
    tracks: [{ name: 'チノカテ', quote: '「知の果実を食はむ」\n（品尝知识的果实）' }]
  },
  {
    id: 23,
    albumName: 'テレパス',
    tracks: [{ name: 'テレパス', quote: '「言葉がなくても伝わるかい」\n（即便没有言语也能传达吗）' }]
  },
  {
    id: 24,
    albumName: 'アルジャーノン',
    tracks: [{ name: 'アルジャーノン', quote: '「ゆっくりと優しく咲く花」\n（缓缓地、温柔绽放的花朵）' }]
  },
  {
    id: 25,
    albumName: '451',
    tracks: [{ name: '451', quote: '「華氏451度で燃える紙」\n（在华氏451度下燃烧的纸张）' }]
  },
  {
    id: 26,
    albumName: '幻燈',
    tracks: [
      { name: '又三郎', quote: '「風の又三郎のように」\n（宛如风之又三郎）' },
      { name: '老人と海', quote: '「波の音を聞きながら」\n（倾听着波涛之声）' },
      { name: '月に吠える', quote: '「夜のしじまに叫ぶ」\n（在夜晚的寂静中呐喊）' },
      { name: 'ブレーメン', quote: '「靴を鳴らして歩こう」\n（踏响鞋履向前走吧）' },
      { name: '左右盲', quote: '「右と左の区別もつかない」\n（连左右都分不清）' },
      { name: 'チノカテ', quote: '「本を開いて旅に出る」\n（翻开书本踏上旅途）' },
      { name: '都落ち', quote: '「都を落ちて旅に出る」\n（离开京城，踏上旅途）' },
      { name: 'さよならモルテン', quote: '「さよなら、僕のモルテン」\n（再见，我的摩尔藤）' },
      { name: '451', quote: '「活字が消えていく世界」\n（文字渐渐消逝的世界）' },
      { name: 'アルジャーノン', quote: '「忘れないでいてほしい」\n（希望你不要忘记）' }
    ]
  },
  {
    id: 27,
    albumName: '幻燈 (画集版)',
    tracks: [
      { name: '又三郎', quote: '「吹き抜ける夏の風」\n（吹过的夏日之风）' },
      { name: '老人と海', quote: '「果てしない海へ」\n（走向无尽的大海）' },
      { name: '月に吠える', quote: '「青い月が見える」\n（看见蓝色的月亮）' },
      { name: '華美', quote: '「華やかに咲いて散る」\n（华丽地绽放然后凋零）' },
      { name: 'ブレーメン', quote: '「愉快な仲間たちと」\n（与愉快的伙伴们）' },
      { name: '左右盲', quote: '「記憶の彼方へ」\n（走向记忆的彼岸）' },
      { name: 'チノカテ', quote: '「静かな夜の読書」\n（安静夜晚的阅读）' },
      { name: '都落ち', quote: '「西へ向かう旅人」\n（向西前行的旅人）' },
      { name: 'さよならモルテン', quote: '「空を飛ぶ鳥のように」\n（宛如在天空飞翔的鸟儿）' },
      { name: '451', quote: '「火花が散る夜」\n（火花四溅的夜晚）' },
      { name: 'アルジャーノン', quote: '「優しさに包まれて」\n（被温柔包围）' }
    ]
  },
  {
    id: 28,
    albumName: '斜陽',
    tracks: [{ name: '斜陽', quote: '「夕暮れの斜陽に影が伸びる」\n（夕阳斜照，影子拉长）' }]
  },
  {
        id: 29,
    albumName: '月光浴',
    tracks: [{ name: '月光浴', quote: '「月光を浴びて踊る」\n（沐浴着月光舞蹈）' }]
  },
  {
    id: 30,
    albumName: '晴る',
    tracks: [{ name: '晴る', quote: '「晴れ渡る空を見上げて」\n（仰望晴空万里）' }]
  },
  {
    id: 31,
    albumName: 'ルバート',
    tracks: [{ name: 'ルバート', quote: '「自由なテンポで揺れる心」\n（以自由的节奏摇曳的心）' }]
  },
  {
    id: 32,
    albumName: '忘れてください',
    tracks: [{ name: '忘れてください', quote: '「どうか私のことを忘れてください」\n（请无论如何把我忘记吧）' }]
  },
  {
    id: 33,
    albumName: '憂、燦々',
    tracks: [{ name: '憂、燦々', quote: '「憂鬱さえも燦々と輝く」\n（连忧郁也灿烂发光）' }]
  },
  {
    id: 34,
    albumName: 'アポリア',
    tracks: [{ name: 'アポリア', quote: '「解けない問いを抱えて」\n（怀揣着无法解答的疑问）' }]
  },
  {
    id: 35,
    albumName: '太陽',
    tracks: [{ name: '太陽', quote: '「沈まない太陽を追いかけて」\n（追逐着不落的太阳）' }]
  },
  {
    id: 36,
    albumName: 'へび',
    tracks: [{ name: 'へび', quote: '「静かに滑り出す蛇のように」\n（像静静滑行的蛇）' }]
  },
  {
    id: 37,
    albumName: '火星人',
    tracks: [{ name: '火星人', quote: '「遠い星から来た火星人」\n（来自遥远星球的火星人）' }]
  },
  {
    id: 38,
    albumName: '修羅',
    tracks: [{ name: '修羅', quote: '「修羅の道を行く」\n（走在修罗之道上）' }]
  },
  {
    id: 39,
    albumName: 'DARMA GRAND PRIX',
    tracks: [{ name: 'DARMA GRAND PRIX', quote: '「勝ち負けを超えたゲーム」\n（超越胜负的游戏）' }]
  },
  {
    id: 40,
    albumName: 'Play Sick',
    tracks: [{ name: 'Play Sick', quote: '「病める戯れ」\n（病态的戏谑）' }]
  },
  {
    id: 41,
    albumName: '茜',
    tracks: [{ name: '茜', quote: '「茜色に染まる空」\n（被染成茜红色的天空）' }]
  },
  {
    id: 42,
    albumName: '二人称',
    tracks: [
      { name: '斜陽', quote: '「二人の影が重なる夕暮れ」\n（两人影子重叠的黄昏）' },
      { name: '月光浴', quote: '「夜の静寂を分け合う」\n（分担着夜晚的寂静）' },
      { name: '晴る', quote: '「雲の隙間から差し込む光」\n（从云缝间洒进的光芒）' },
      { name: 'ルバート', quote: '「心音のテンポに合わせて」\n（配合心跳的节奏）' },
      { name: '忘れてください', quote: '「さよならの代わりに」\n（作为告别的替代）' },
      { name: '憂、燦々', quote: '「太陽の下で叫ぶ」\n（在太阳下呼喊）' },
      { name: 'アポリア', quote: '「答えのない二人」\n（没有答案的两人）' },
      { name: '太陽', quote: '「光と影の物語」\n（光与影的故事）' },
      { name: 'へび', quote: '「静寂を破る音」\n（打破寂静的声音）' },
      { name: '火星人', quote: '「未知の世界へ」\n（走向未知的世界）' },
      { name: '修羅', quote: '「戦いの果てに」\n（战斗的尽头）' },
      { name: 'DARMA GRAND PRIX', quote: '「倒れても起きて走る」\n（倒下也站起来奔跑）' },
      { name: 'Play Sick', quote: '「狂気と愛の狭間で」\n（在狂气与爱意之间）' },
      { name: '茜', quote: '「茜空に誓う」\n（向着茜色天空发誓）' }
    ]
  },
  {
    id: 43,
    albumName: 'あぶく',
    tracks: [{ name: 'あぶく', quote: '「消えていくあぶくのように」\n（宛如渐渐消散的水泡）' }]
  }
];

export default function Home() {
  const [selectedStamp, setSelectedStamp] = useState(null);
  const [cardOpacity, setCardOpacity] = useState('100');

  useEffect(() => {
    // 1. 随机挑选一张专辑（1 - 43）
    const randomAlbumIndex = Math.floor(Math.random() * yorushikaAlbums.length);
    const album = yorushikaAlbums[randomAlbumIndex];

    // 2. 在该专辑中随机挑选一首有效歌曲
    const randomTrackIndex = Math.floor(Math.random() * album.tracks.length);
    const track = album.tracks[randomTrackIndex];

    setSelectedStamp({
      albumId: album.id,
      albumName: album.albumName,
      trackName: track.name,
      quote: track.quote
    });

    // 3. 读取本地设置中的卡片透明度
    const savedOpacity = localStorage.getItem('yorusend_card_opacity');
    if (savedOpacity) setCardOpacity(savedOpacity);
  }, []);

  if (!selectedStamp) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <Head>
        <title>夜邮 YORUSEND - 邮票册与深夜回响</title>
      </Head>

      {/* 邮票盲盒卡片 */}
      <div 
        className="w-full max-w-md rounded-3xl p-8 shadow-2xl border border-gray-200/60 dark:border-zinc-800 transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center"
        style={{ 
          backgroundColor: `rgba(255, 255, 255, ${cardOpacity / 100})`,
        }}
      >
        {/* 邮票编号标记 */}
        <div className="absolute top-4 left-6 text-xs font-mono text-gray-400 dark:text-zinc-500 tracking-widest">
          STAMP NO. {selectedStamp.albumId} / 43
        </div>

        {/* 静态专辑邮票图片 (对应 public/1.jpg 到 public/43.jpg) */}
        <div className="w-48 h-48 mt-6 mb-8 rounded-2xl overflow-hidden shadow-md border-4 border-white dark:border-zinc-800 relative group bg-gray-100 dark:bg-zinc-800">
          <img 
            src={`/${selectedStamp.albumId}.jpg`} 
            alt={`Album ${selectedStamp.albumId}`}
            onError={(e) => { e.target.src = '/yoursend.jpg'; }} // 容错备用
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* 莫奈青绿色微光滤镜 */}
          <div className="absolute inset-0 bg-[#73C991]/10 mix-blend-color pointer-events-none" />
        </div>

        {/* 歌词与出处展示区域 */}
        <div className="space-y-4 mb-8 w-full">
          <span className="inline-block px-3 py-1 bg-[#73C991]/10 text-[#73C991] text-xs font-medium rounded-full">
            《{selectedStamp.albumName}》
          </span>
          
          {/* 中日双语歌词 */}
          <p className="text-sm md:text-base text-gray-700 dark:text-zinc-200 font-serif leading-relaxed whitespace-pre-line px-4">
            {selectedStamp.quote}
          </p>

          {/* 出处标注：一一《歌曲名》 */}
          <p className="text-xs font-mono text-gray-400 dark:text-zinc-500 tracking-wider pt-2">
            ――《{selectedStamp.trackName}》
          </p>
        </div>

        {/* 底部按钮：通往过渡页 */}
        <div className="w-full pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            将思绪寄往夜空
          </span>

          <Link 
            href="/transition"
            className="px-6 py-2.5 bg-[#73C991] text-white text-xs font-medium rounded-full shadow-md hover:opacity-90 transition-all flex items-center space-x-2"
          >
            <span>写信</span>
            <span>→</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
