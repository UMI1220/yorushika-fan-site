import { getFastMediaUrl } from '../../lib/media';

export const runtime = 'edge';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const albumId = searchParams.get('albumId');

  try {
    let tracks = [];

    // 1. 如果配置了 D1 数据库
    if (process.env.DB && albumId) {
      const { results } = await process.env.DB.prepare(
        `SELECT * FROM music_tracks WHERE album_id = ? AND status = 'approved' ORDER BY track_number ASC`
      ).bind(albumId).all();
      
      tracks = results;
    }

    // 2. 补全 CDN 高速播放链接
    const formattedTracks = tracks.map((track) => ({
      ...track,
      audioUrl: getFastMediaUrl(track.audio_path || `music/${track.id}.mp3`),
      coverUrl: getFastMediaUrl(track.cover_path),
    }));

    return new Response(JSON.stringify({ success: true, tracks: formattedTracks }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
