export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { albumId } = req.query;

  if (!albumId) {
    return res.status(400).json({ error: 'Missing albumId parameter' });
  }

  try {
    // 1. 如果在 Cloudflare Pages / Workers 绑定了 D1 数据库 (env.DB)
    if (process.env.DB) {
      const { results } = await process.env.DB.prepare(
        `SELECT id, album_id, track_number, title, artist, audio_path, cover_path, lrc_ja, lrc_zh, contributor_email 
         FROM music_tracks 
         WHERE album_id = ? AND status = 'approved'
         ORDER BY track_number ASC`
      ).bind(albumId).all();

      return res.status(200).json({ success: true, tracks: results });
    }

    // 2. 降级回退逻辑（如果 D1 暂未配置完成，返回 Mock/默认数据）
    const fallbackTracks = [
      {
        id: 1,
        album_id: Number(albumId),
        track_number: 1,
        title: "盗作 (Sample)",
        audio_path: `music/sample_${albumId}.mp3`,
        lrc_ja: "[00:00.00] 音楽の盗作をして生きていた",
        lrc_zh: "[00:00.00] 我靠着盗作别人的音乐度过了半生"
      }
    ];

    return res.status(200).json({ success: true, tracks: fallbackTracks });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
