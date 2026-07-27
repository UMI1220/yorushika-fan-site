import { useState, useEffect, useRef } from 'react';

export default function IntroOverlay({ onComplete }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // 检查本次访问 Session 是否已播放过开场动画
    const hasSeenIntro = sessionStorage.getItem('has_seen_intro');
    if (hasSeenIntro) {
      setVisible(false);
      if (onComplete) onComplete();
      return;
    }

    // 自动播放兜底：防止视频加载异常导致一直卡住，3.8秒后自动淡出
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
    }, 600); // 600ms 淡出过程
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-700 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 视频容器：通过 overflow-hidden 和 scale 裁剪外层黑色边框，同时应用 CSS 反色 filter */}
      <div className="relative w-80 h-60 sm:w-96 sm:h-72 overflow-hidden flex items-center justify-center bg-white">
        <video
          ref={videoRef}
          src="/intro.mp4"
          autoPlay
          muted
          playsInline
          onEnded={handleFinish}
          className="w-full h-full object-cover scale-150 filter invert grayscale contrast-150 mix-blend-multiply"
        />
      </div>

      {/* 右上角跳过按钮 */}
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