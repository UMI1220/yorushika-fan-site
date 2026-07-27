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
      {/* 💡 关键修复：
        原视频是 9:16 竖屏，中间只有约 35% 区域是白底 Logo 画面，上下全是原生的黑色填充带。
        将 scale 调整为 scale-[2.7]，精准将原视频上下黑边彻底裁切在 overflow-hidden 之外！
      */}
      <div className="relative w-80 h-52 sm:w-96 sm:h-64 overflow-hidden flex items-center justify-center bg-[#fdfbf7]">
        <video
          ref={videoRef}
          src="/intro.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleFinish}
          className="w-full h-full object-cover scale-[2.7] filter grayscale contrast-200 brightness-95 mix-blend-multiply"
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