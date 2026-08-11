export const runtime = 'edge';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const summary = searchParams.get('summary');

  // 1. 修复：兼容获取 D1 数据库绑定，防止 undefined 导致 500 报错
  const db = req.env?.DB || process.env.DB || globalThis.DB;

  if (!db) {
    return new Response(
      JSON.stringify({ success: false, message: 'D1 数据库绑定 [DB] 未找到，请检查配置' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    if (req.method === 'GET') {
      // 2. 获取单张专辑全量详情及包含的歌曲列表
      if (id) {
        const album = await db
          .prepare('SELECT * FROM albums WHERE id = ?')
          .bind(id)
          .first();

        if (!album) {
          return new Response(
            JSON.stringify({ success: false, message: '专辑不存在' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // 查询该专辑下的所有歌曲
        const songs = await db
          .prepare('SELECT * FROM songs WHERE album_id = ? ORDER BY id ASC')
          .bind(id)
          .all();

        // 尝试安全解析 song_list JSON 字符串
        let parsedSongList = [];
        try {
          parsedSongList = typeof album.song_list === 'string' ? JSON.parse(album.song_list || '[]') : album.song_list;
        } catch (e) {
          parsedSongList = [];
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: { 
              ...album, 
              song_list: parsedSongList,
              songs: songs.results || [] 
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 3. 磁贴专用轻量摘要拉取 (用于 index 和 music 页面不重复抽尽逻辑)
      if (summary === 'true') {
        const { results } = await db
          .prepare(
            'SELECT id, name, track_count, cover_url, quote, release_date, song_list, contributor FROM albums ORDER BY id DESC'
          )
          .all();

        // 格式化解析数据，供前端磁贴无缝提取代表歌词与发行年份
        const formattedResults = (results || []).map((album) => {
          let parsedList = [];
          try {
            parsedList = typeof album.song_list === 'string' ? JSON.parse(album.song_list || '[]') : album.song_list;
          } catch (e) {
            parsedList = [];
          }
          return {
            ...album,
            song_list: parsedList,
          };
        });

        return new Response(
          JSON.stringify({ success: true, data: formattedResults }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 4. 默认：获取所有专辑列表
      const { results } = await db
        .prepare('SELECT * FROM albums ORDER BY id DESC')
        .all();

      const formattedAlbums = (results || []).map((album) => {
        let parsedList = [];
        try {
          parsedList = typeof album.song_list === 'string' ? JSON.parse(album.song_list || '[]') : album.song_list;
        } catch (e) {
          parsedList = [];
        }
        return {
          ...album,
          song_list: parsedList,
        };
      });

      return new Response(
        JSON.stringify({ success: true, data: formattedAlbums }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // POST/创建专辑逻辑保持
    if (req.method === 'POST') {
      const body = await req.json();
      const {
        name,
        track_count = 0,
        artist = 'ヨルシカ',
        cover_url = '',
        quote = '',
        song_list = '[]',
        release_date = '',
        contributor = 'UMI1220',
        extra_contributors = '',
      } = body;

      if (!name) {
        return new Response(
          JSON.stringify({ success: false, message: '专辑名称不能为空' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const res = await db
        .prepare(
          `INSERT INTO albums (name, track_count, artist, cover_url, quote, song_list, release_date, contributor, extra_contributors)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          name,
          track_count,
          artist,
          cover_url,
          quote,
          typeof song_list === 'string' ? song_list : JSON.stringify(song_list),
          release_date,
          contributor,
          extra_contributors
        )
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          message: '专辑创建成功',
          album_id: res.meta?.last_row_id,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Method Not Allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
