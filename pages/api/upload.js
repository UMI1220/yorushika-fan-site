export const runtime = 'edge';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { fileName, fileBase64, folder = 'music', albumId, trackTitle, contributorEmail } = body;

    if (!fileName || !fileBase64 || !contributorEmail) {
      return new Response(JSON.stringify({ error: '缺少必填字段' }), { status: 400 });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'UMI1220';
    const repo = process.env.GITHUB_REPO || 'yorushika-assets';
    const branch = process.env.GITHUB_BRANCH || 'main';

    const filePath = `${folder}/${fileName}`;
    const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    // 推送到 GitHub 资源仓库 (UMI1220/yorushika-assets)
    const ghRes = await fetch(githubUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Yorushika-App',
      },
      body: JSON.stringify({
        message: `upload: ${filePath} by ${contributorEmail}`,
        content: fileBase64.replace(/^data:.*;base64,/, ''),
        branch,
      }),
    });

    if (!ghRes.ok) {
      const err = await ghRes.json();
      throw new Error(`GitHub Upload Failed: ${err.message}`);
    }

    // 写入 D1 数据库记录
    if (process.env.DB) {
      await process.env.DB.prepare(
        `INSERT INTO music_tracks (album_id, track_number, title, audio_path, contributor_email, status)
         VALUES (?, ?, ?, ?, ?, 'approved')`
      ).bind(albumId || 1, 99, trackTitle || fileName, filePath, contributorEmail).run();
    }

    return new Response(JSON.stringify({ success: true, filePath }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
