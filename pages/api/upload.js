export const runtime = 'edge';

// 推送文件至 GitHub 仓库指定文件夹辅助函数
async function uploadToGitHub(folder, fileName, base64Content) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'UMI1220';
  const repo = process.env.GITHUB_REPO || 'yorushika-assets';
  const branch = process.env.GITHUB_BRANCH || 'main';

  const path = `${folder}/${fileName}`;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Yorushika-App',
    },
    body: JSON.stringify({
      message: `Upload ${path} via Submit API`,
      content: base64Content,
      branch: branch,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub Upload Failed: ${errText}`);
  }

  const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE || 'https://yorushika-assets.pages.dev';
  return `${cdnBase}/${path}`;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method Not Allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const db = process.env.DB;

  try {
    const body = await req.json();
    const {
      mode = 'supplement', // 'supplement' | 'modify'
      fileType, // 'audio' | 'cover' | 'lyric' | 'comment_attachment'
      fileName,
      fileBase64,
      song_id,
      track_id,
      album_id,
      title,
      artist = 'ヨルシカ',
      mv_url = '',
      contributor_email,
    } = body;

    const targetSongId = song_id || track_id;

    if (!contributor_email) {
      return new Response(
        JSON.stringify({ success: false, message: '请输入提交者 Email 方便审核与署名' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. 若上传评论附件 -> 存储至 comment/ 目录
    if (fileType === 'comment_attachment' && fileBase64 && fileName) {
      const folder = 'comment';
      const cleanFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '')}`;
      const targetUrl = await uploadToGitHub(folder, cleanFileName, fileBase64);

      return new Response(
        JSON.stringify({ success: true, url: targetUrl }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. 音乐/歌词/封面推送至 GitHub 资产库
    let targetUrl = '';
    if (fileBase64 && fileName) {
      let folder = 'music';
      if (fileType === 'lyric') folder = 'lyrics';
      if (fileType === 'cover') folder = 'covers';

      const cleanFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '')}`;
      targetUrl = await uploadToGitHub(folder, cleanFileName, fileBase64);
    }

    // 3. 拦截判断：如果是修正模式或信息冲突，写入 pending_songs 审核暂存表
    if (mode === 'modify' || !targetSongId) {
      await db
        .prepare(
          `INSERT INTO pending_songs (title, cover_url, artist, audio_url, lrc_url, mv_url, album_id, contributor, submitter_email, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
        )
        .bind(
          title || '未命名歌曲',
          fileType === 'cover' ? targetUrl : '',
          artist,
          fileType === 'audio' ? targetUrl : '',
          fileType === 'lyric' ? targetUrl : '',
          mv_url,
          album_id || null,
          contributor_email,
          contributor_email
        )
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          isPending: true,
          message: '提交已进入 pending_songs 暂存队列，等待管理员审核！',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. 补充已有歌曲的空缺字段
    let updateCol = 'audio_url';
    if (fileType === 'cover') updateCol = 'cover_url';
    if (fileType === 'lyric') updateCol = 'lrc_url';
    if (fileType === 'mv') updateCol = 'mv_url';

    const finalVal = fileType === 'mv' ? mv_url : targetUrl;

    await db
      .prepare(
        `UPDATE songs SET ${updateCol} = ?, contributor = COALESCE(NULLIF(contributor, ''), ?) WHERE id = ?`
      )
      .bind(finalVal, contributor_email, targetSongId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        isPending: false,
        message: '数据已直接更新录入系统！',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
