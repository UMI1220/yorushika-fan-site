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
      type = 'track',          // 'track' 或 'album'
      track_id,                // 修改现有歌曲时的歌曲 id
      album_id,                // 关联专辑 id
      title,
      artist = 'ヨルシカ',
      fileBase64,              // 上传文件的 Base64 编码
      fileName,                // 文件名 (含后缀)
      fileType = 'audio',      // 'audio', 'cover', 'lyric', 'mv'
      mv_url = '',             // 如果是 MV 链接
      contributor_email = '',  // 贡献者/修改者邮箱
    } = body;

    let targetUrl = '';

    // 1. 如果有上传文件，先根据逻辑存入 GitHub
    if (fileBase64 && fileName) {
      let folder = 'music';
      if (fileType === 'cover') folder = 'covers';
      if (fileType === 'lyric') folder = 'lyrics';

      // 预检查目标歌曲/专辑字段是否已经有数据
      let isExisting = false;
      if (track_id) {
        const existingTrack = await db
          .prepare('SELECT * FROM tracks WHERE id = ?')
          .bind(track_id)
          .first();

        if (existingTrack) {
          if (fileType === 'audio' && existingTrack.audio_url) isExisting = true;
          if (fileType === 'cover' && existingTrack.cover_url) isExisting = true;
          if (fileType === 'lyric' && existingTrack.lyric_url) isExisting = true;
          if (fileType === 'mv' && existingTrack.mv_url) isExisting = true;
        }
      }

      // 如果数据已存在，暂存至 GitHub 'admin/' 目录
      const destFolder = isExisting ? 'admin' : folder;
      targetUrl = await uploadToGitHub(destFolder, fileName, fileBase64);

      // 2.【已存在信息 ➔ 暂存审核】写入 pending_tracks 表
      if (isExisting) {
        await db
          .prepare(
            `INSERT INTO pending_tracks (title, cover_url, artist, audio_url, lyric_url, mv_url, album_id, contributor)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            title || '未命名曲目',
            fileType === 'cover' ? targetUrl : '',
            artist,
            fileType === 'audio' ? targetUrl : '',
            fileType === 'lyric' ? targetUrl : '',
            fileType === 'mv' ? mv_url : '',
            album_id || 1,
            contributor_email
          )
          .run();

        return new Response(
          JSON.stringify({
            success: true,
            isPending: true,
            message: '该歌曲/专辑已存在原信息，已提交至后台管理员审核暂存！',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3.【未存在信息 / 空数据 ➔ 直接写入】更新或新增到 tracks 表
    if (track_id) {
      // 补全现有歌曲的空缺字段
      let updateCol = 'audio_url';
      if (fileType === 'cover') updateCol = 'cover_url';
      if (fileType === 'lyric') updateCol = 'lyric_url';
      if (fileType === 'mv') updateCol = 'mv_url';

      const finalVal = fileType === 'mv' ? mv_url : targetUrl;

      await db
        .prepare(
          `UPDATE tracks SET ${updateCol} = ?, contributor = COALESCE(NULLIF(contributor, ''), ?) WHERE id = ?`
        )
        .bind(finalVal, contributor_email, track_id)
        .run();
    } else {
      // 新增全新歌曲记录
      await db
        .prepare(
          `INSERT INTO tracks (title, cover_url, artist, audio_url, lyric_url, mv_url, album_id, contributor)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          title,
          fileType === 'cover' ? targetUrl : '',
          artist,
          fileType === 'audio' ? targetUrl : '',
          fileType === 'lyric' ? targetUrl : '',
          fileType === 'mv' ? mv_url : '',
          album_id || 1,
          contributor_email
        )
        .run();
    }

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
