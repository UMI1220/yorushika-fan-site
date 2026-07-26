export const runtime = 'edge';

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 返回演示用的初始化列表
  const dbData = {
    magazines: [
      {
        id: 'echo-issue-01',
        title: '【回声】群刊第一期',
        period: '2026 盛夏号 · 赛博存档特刊',
        description: '收录了本期社区所有优秀的访谈、诗歌、考据及视觉艺术作品。',
        totalPages: 52,
        coverImg: '/magazine-pages/page-1.jpg',
      },
    ],
    annotations: [],
  };

  return new Response(JSON.stringify(dbData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}