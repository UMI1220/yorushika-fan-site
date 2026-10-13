import React, { useState, useEffect } from 'react';
import BackgroundLayer from './BackgroundLayer';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('yorusend_user_email');
    if (email) setUserEmail(email);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-[#73C991]/30 text-[#202124] dark:text-[#E8EAED]">
      {/* 1. 常驻最底层的背景页 */}
      <BackgroundLayer />

      {/* 2. 毛玻璃顶栏（含ヨルセンド Logo 与 7 行非线性菜单） */}
      <Navbar userEmail={userEmail} />

      {/* 3. 全局页面主体内容区 */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* 4. 月光青工作室底栏 */}
      <Footer />
    </div>
  );
}
