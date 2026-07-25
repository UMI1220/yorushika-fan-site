import Head from 'next/head';
import { useState } from 'react';

export default function About() {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="site-wrapper">
      <Head>
        <title>关于本站 - Yorushika Fan Site</title>
      </Head>

      <div className="main-content">
        <h1 className="page-title">ABOUT</h1>
        
        {/* 1. 关于本站板块 */}
        <div className="glass-card">
          <h2>• 关于本站</h2>
          <p>这是一个由夜鹿（Yorushika）同好自发建立的非官方粉丝网站。怀揣着对 n-buna 的吉他和曲风、suis 清澈嗓音的无限喜爱，以及藏在歌词里的雨、夏与文学故事的感动，我们搭建了这个属于所有“听众”的小小避难所。</p>
        </div>

        {/* 2. 本站技术栈 */}
        <div className="glass-card">
          <h2>• 本站技术栈</h2>
          <ul className="tech-list">
            <li><strong>前端架构</strong>：现代化高性能响应式设计</li>
            <li><strong>托管与加速</strong>：Cloudflare Pages 全球边缘网络</li>
            <li><strong>互动与通知</strong>：Twikoo 评论系统 + Resend API 邮件提醒</li>
            <li><strong>专属域名</strong>：yorushika-fan.top</li>
          </ul>
        </div>

        {/* 3. 传送门 */}
        <div className="glass-card">
          <h2>• 传送门</h2>
          <div className="social-links">
            <a href="https://github.com/UMI1229" target="_blank" rel="noreferrer">GitHub (UMI1229)</a>
            <a href="https://space.bilibili.com/3546934872640225" target="_blank" rel="noreferrer">哔哩哔哩空间</a>
            <a href="mailto:hongboyao18@gmail.com">联系邮箱</a>
            <span className="uid-tag">UID: 3546934872640225</span>
          </div>
        </div>

        {/* 4. 支持站长（要饭模块 - 抽象图标 + 弹窗交互） */}
        <div className="glass-card support-section">
          <h2>• 支持站长</h2>
          <p>如果这个小站曾触动了你，欢迎请站长喝杯冰可乐或咖啡！毕竟站长建站主要为了支付域名费用，纯靠“要饭”维持，你的每一分支持都是站点续命的动力：</p>
          
          <div className="support-action">
            <button className="support-btn" onClick={() => setShowQR(true)}>
              <span className="icon-abstract">☕</span> 请站长喝杯咖啡 / 赞助域名
            </button>
          </div>

          {/* 模态弹窗 */}
          {showQR && (
            <div className="modal-overlay" onClick={() => setShowQR(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={() => setShowQR(false)}>×</button>
                <h3>支付宝扫一扫</h3>
                <p className="modal-desc">感谢你的支持，让小站能够继续存活下去！</p>
                <div className="qr-container">
                  <img src="/alipay-qr.png" alt="支付宝赞赏码" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .site-wrapper {
          min-height: 100vh;
          background-color: #FFFFFF;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #2D3748;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .main-content {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 24px;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          color: #2D3748;
          margin-bottom: 30px;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(163, 190, 190, 0.25);
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .glass-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(163, 190, 190, 0.15);
        }

        .glass-card h2 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #799898;
          letter-spacing: 0.05em;
          margin-bottom: 14px;
        }

        .glass-card p, .glass-card li {
          font-size: 0.95rem;
          line-height: 1.8;
          color: #4A5568;
        }

        .tech-list {
          list-style: none;
          padding-left: 0;
        }

        .tech-list li {
          position: relative;
          padding-left: 16px;
          margin-bottom: 6px;
        }

        .tech-list li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #799898;
        }

        .social-links {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          align-items: center;
          margin-top: 12px;
        }

        .social-links a {
          display: inline-block;
          padding: 8px 18px;
          background: rgba(121, 152, 152, 0.1);
          color: #5E7A7A;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .social-links a:hover {
          background: #799898;
          color: #FFFFFF;
        }

        .uid-tag {
          font-size: 0.85rem;
          color: #A0AEC0;
          padding: 8px 0;
        }

        /* 赞赏按钮与抽象图标样式 */
        .support-action {
          margin-top: 20px;
          display: flex;
          justify-content: flex-start;
        }

        .support-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: rgba(121, 152, 152, 0.12);
          color: #5E7A7A;
          border: 1px solid rgba(121, 152, 152, 0.3);
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .support-btn:hover {
          background: #799898;
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(121, 152, 152, 0.3);
        }

        /* 模态弹窗样式 */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999;
          animation: fadeIn 0.2s ease;
        }

        .modal-content {
          background: #FFFFFF;
          padding: 30px 40px;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          text-align: center;
          position: relative;
          max-width: 340px;
          width: 90%;
          animation: scaleUp 0.2s ease;
        }

        .close-btn {
          position: absolute;
          top: 12px;
          right: 16px;
          background: transparent;
          border: none;
          font-size: 1.5rem;
          color: #A0AEC0;
          cursor: pointer;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #2D3748;
        }

        .modal-content h3 {
          font-size: 1.1rem;
          color: #2D3748;
          margin-bottom: 6px;
        }

        .modal-desc {
          font-size: 0.85rem;
          color: #718096;
          margin-bottom: 20px;
        }

        .qr-container img {
          width: 180px;
          height: 180px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 8px;
          background: #FFFFFF;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
