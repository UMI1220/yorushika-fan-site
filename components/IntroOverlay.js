import { useState, useEffect, useRef } from 'react';

export default function IntroOverlay({ onComplete }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // 检查 Session 记录，本次访问仅播放一次
    const hasSeenIntro = sessionStorage.getItem('has_seen_intro');
    if (hasSeenIntro) {
      setVisible(false);
      if (onComplete) onComplete();
      return;
    }

    // 自动播放超时兜底 (3.8 秒)
    const timer = setTimeout(() => {
      handleFinish();
    }, 3800);

    return () => clearTimeout(timer);
  }, []);

  const handleFinish = () => {
    setFading(true);
    sessionStorage.setItem('has_seen_intro', 'true');
    setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 600);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#fdfbf7] transition-opacity duration-700 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 🔑 关键修复：
        1. 移除了导致底色变黑的 filter invert
        2. 背景设定为与视频原背景完全一致的暖白纸质色 (#fdfbf7)
        3. 使用 filter grayscale contrast-200 提升对比度，将蓝色 Line Art 变纯黑线稿
        4. 使用 mix-blend-multiply（正片叠底）抹除视频背景边缘缝隙
      */}
      <div className="relative w-80 h-60 sm:w-96 sm:h-72 overflow-hidden flex items-center justify-center bg-[#fdfbf7]">
        <video
          ref={videoRef}
          src="/intro.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleFinish}
          className="w-full h-full object-cover scale-150 filter grayscale contrast-200 brightness-95 mix-blend-multiply"
        />
      </div>

      {/* 右上角 SKIP 按钮 */}
      <button
        onClick={handleFinish}
        type="button"
        className="absolute top-6 right-6 px-3.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-800 border border-zinc-200/80 rounded-full transition bg-white/80 backdrop-blur-sm"
      >
        SKIP ➔
      </button>
    </div>
  );
}