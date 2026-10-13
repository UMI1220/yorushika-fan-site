import React, { useEffect, useState } from 'react';

export default function BackgroundLayer() {
  const [bgClass, setBgClass] = useState('bg-[#F8F9FA] dark:bg-[#121212]');
  const [customBgImg, setCustomBgImg] = useState(null);

  useEffect(() => {
    // 页面加载时读取 settings 存储的背景设定
    const savedColor = localStorage.getItem('yorusend_bg_color');
    const savedImg = localStorage.getItem('yorusend_bg_image');

    if (savedColor) setBgClass(savedColor);
    if (savedImg) setCustomBgImg(savedImg);

    // 监听来自其他页面（如 settings.js）的背景修改事件
    const handleStorageChange = () => {
      const color = localStorage.getItem('yorusend_bg_color');
      const img = localStorage.getItem('yorusend_bg_image');
      if (color) setBgClass(color);
      if (img) setCustomBgImg(img);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className={`fixed inset-0 -z-10 w-full h-full transition-colors duration-700 ${bgClass}`}>
      {customBgImg ? (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: `url(${customBgImg})` }}
        />
      ) : (
        // 极简文学风格的柔和点阵/噪点底纹，契合 Google & 夜鹿美学
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
      )}
    </div>
  );
}
