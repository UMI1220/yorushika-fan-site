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
      {/* 💡 极致比例 scale-[1.56] */}
      <div className="relative w-72 h-44 sm:w-80 sm:h-52 overflow-hidden flex items-center justify-center bg-[#fdfbf7]">
        <video
          ref={videoRef}
          src="/intro.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleFinish}
          className="w-full h-full object-cover scale-[1.56] filter grayscale contrast-200 brightness-95 mix-blend-multiply"
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