import React, { useState, useEffect } from 'react';

export default function OnboardingOverlay({ onFinish }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // 检查是否已经登录过
  useEffect(() => {
    const savedEmail = localStorage.getItem('yorusend_user_email');
    if (savedEmail) {
      // 如果已经登录过，直接跳过引导
      if (onFinish) onFinish(savedEmail);
    } else {
      setIsVisible(true);
    }
  }, [onFinish]);

  if (!isVisible) return null;

  // 五页的内容配置（文学感文案 + 对应图片）
  const pages = [
    {
      img: '/yorusend1.jpg',
      title: '守护秘密的夜色',
      desc: '在这深夜里，文字是唯一的行踪。我们以绝对的隐私构建这座中转站，你的每一句倾诉，唯有夜风知晓，绝不向外界多泄露一分。'
    },
    {
      img: '/yorusend2.jpg',
      title: '初识的友人',
      desc: '我们精心审核每一位愿意倾听的“初识的友人”。根据他们流出的时间与心绪，将你的投信恰如其分地交托给某一个同样在深夜醒着的人。'
    },
    {
      img: '/yorusend3.jpg',
      title: '月光下的回响',
      desc: '当信件落入无人回应的静谧，或者当你选择直接寄给深夜。由 DeepSeek 与 Gemini 组成的 AI 倾听者，将化作月光下的笔友，为你写下独一无二的回音。'
    },
    {
      img: '/yorusend4.jpg',
      title: 'もっと もっと しゃべれ',
      desc: '“更多更多地说吧。”把那些哽咽在喉咙里、无处安放的白日阴影，全部毫无保留地倾倒在这个深夜里。',
      isLoginStep: true
    },
    {
      img: '/yorusend5.jpg',
      title: '黎明前的信箱',
      desc: '当信件随着夜风寄出，远方的回声便已经在路上。欢迎来到夜邮，愿你的孤独在这里找到回响。',
      isLastStep: true
    }
  ];

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // 第五页的 → 按钮：点击退出引导
      finishOnboarding();
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      alert('请输入有效的邮箱地址');
      return;
    }
    localStorage.setItem('yorusend_user_email', email);
    // 登录成功后自动跳到第五页（尾声页）
    setStep(5);
  };

  const finishOnboarding = () => {
    setIsVisible(false);
    const saved = localStorage.getItem('yorusend_user_email') || '';
    if (onFinish) onFinish(saved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md overflow-hidden transition-all duration-700">
      {/* 核心卡片容器：模拟 Google Material You 风格 */}
      <div className="relative w-full max-w-md h-[85vh] max-h-[700px] bg-[#F8F9FA] dark:bg-[#121212] text-[#202124] dark:text-[#E8EAED] rounded-3xl shadow-2xl flex flex-col justify-between p-8 overflow-hidden border border-gray-200 dark:border-zinc-800">
        
        {/* 上半部分：图片与文本（带有阻尼感平移效果） */}
        <div className="relative flex-1 overflow-hidden">
          <div 
            className="absolute inset-0 flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${(step - 1) * 100}%)` }}
          >
            {pages.map((p, index) => (
              <div key={index} className="w-full h-full flex-shrink-0 flex flex-col justify-center px-2">
                {/* 图片区域 */}
                <div className="w-full h-56 rounded-2xl overflow-hidden shadow-inner mb-6 bg-gray-200 dark:bg-zinc-800">
                  <img src={p.img} alt={`page-${index + 1}`} className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105" />
                </div>
                
                {/* 文本区域 */}
                <h3 className="text-xl font-medium tracking-wide mb-3 text-[#202124] dark:text-white">
                  {p.title}
                </h3>
                
                {index === 3 ? (
                  // 第四页特殊的登录输入框
                  <form onSubmit={handleLogin} className="mt-2 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">
                      {p.desc}
                    </p>
                    <div className="relative flex items-center border-b border-gray-400 dark:border-zinc-600 pb-1">
                      <span className="text-[#73C991] font-medium mr-3 select-none">邮箱:</span>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="在此输入您的邮箱..."
                        className="w-full bg-transparent outline-none text-sm text-[#202124] dark:text-white placeholder-gray-400"
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full mt-3 py-2.5 bg-[#73C991] text-white font-medium rounded-full shadow-md hover:opacity-90 transition-opacity text-sm"
                    >
                      登入
                    </button>
                  </form>
                ) : (
                  // 普通页文本
                  <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                    {p.desc}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 底部：进度提示与胶囊按钮（绝对静止不动） */}
        <div className="pt-6 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between select-none">
          
          {/* 左侧：三点式进度提示 (前三页展示，第四五页适配) */}
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((s) => (
              <span 
                key={s}
                className={`transition-all duration-300 rounded-full ${
                  step === s 
                    ? 'w-6 h-2 bg-[#73C991]' 
                    : 'w-2 h-2 bg-gray-300 dark:bg-zinc-700'
                }`}
              />
            ))}
            {step >= 4 && (
              <span className="text-xs text-gray-400 dark:text-zinc-500 font-mono">
                {step === 4 ? '4 / 5 登入' : '5 / 5 尾声'}
              </span>
            )}
          </div>

          {/* 右侧：月光青色胶囊按钮（统一规范：两边半圆，中间长方形） */}
          <div className="flex items-center space-x-2">
            {step === 5 && (
              <button 
                onClick={() => setStep(4)}
                className="px-4 py-2.5 text-xs text-gray-500 dark:text-zinc-400 hover:text-[#73C991] transition-colors"
              >
                返回
              </button>
            )}
            
            <button 
              onClick={handleNext}
              className="w-12 h-12 bg-[#73C991] text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all active:scale-95"
              title="下一页"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
