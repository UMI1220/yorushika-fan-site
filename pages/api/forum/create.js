export const runtime = 'edge';
import { createClient } from '@supabase/supabase-js';

// 敏感词屏蔽列表
const SENSITIVE_WORDS = ['政治敏感词1', '垃圾广告刷屏', '非法链接'];

// IP 频控（5秒防刷屏）
const ipMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const lastTime = ipMap.get(ip) || 0;
  if (now - lastTime < 5000) return false;
  ipMap.set(ip, now);
  return true;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = getSupabase();
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 防刷屏验证
    if (!checkRateLimit(clientIp)) {
      return new Response(JSON.stringify({ error: '操作太频繁，请 5 秒后再试' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const {
      title,
      author,
      category,
      content,
      image_url,
      image_urls,
      video_url,
      location_name,
      delete_password,
    } = await req.json();

    // 必填项校验
    if (!title?.trim() || !content?.trim()) {
      return new Response(JSON.stringify({ error: '标题和内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 🔒【新增逻辑】如果是官方公告，验证 delete_password 是否匹配 admin_users 表
    if (category === 'ANNOUNCEMENT') {
      if (!delete_password || !delete_password.trim()) {
        return new Response(JSON.stringify({ error: '发布官方公告必须填写管理员密码' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { data: adminUser, error: adminErr } = await supabase
        .from('admin_users')
        .select('*')
        .eq('password', delete_password.trim())
        .single();

      if (adminErr || !adminUser) {
        return new Response(JSON.stringify({ error: '管理员密码错误，无法发布官方公告' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 敏感词过滤
    const fullText = `${title} ${content} ${author || ''}`;
    for (const word of SENSITIVE_WORDS) {
      if (fullText.includes(word)) {
        return new Response(JSON.stringify({ error: '内容包含敏感词汇，请修改后重试' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 拼接多图格式（用逗号分隔）
    let finalImages = '';
    if (Array.isArray(image_urls) && image_urls.length > 0) {
      finalImages = image_urls.filter(Boolean).join(',');
    } else if (image_url) {
      finalImages = image_url;
    }

    // 写入 supabase 的 forum_posts 表
    const { data, error } = await supabase
      .from('forum_posts')
      .insert([
        {
          title: title.trim(),
          author: author?.trim() || '匿名鹿友',
          category: category || 'ABSTRACT',
          content: content.trim(),
          image_url: finalImages,
          video_url: video_url?.trim() || '',
          location_name: location_name?.trim() || '',
          delete_password: delete_password?.trim() || '',
          likes: 0,
          views: 0,
          is_pinned: false,
          is_featured: false,
          stamps_detail: { flower: 0, moon: 0, ghost: 0, coffee: 0, blue: 0 },
        },
      ])
      .select();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data: data?.[0] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('发帖请求出错:', err);
    return new Response(JSON.stringify({ error: err.message || '服务器内部错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}