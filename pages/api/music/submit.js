export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mode, albumId, trackTitle, contributorEmail, audioUrl, mvUrl, lrcJa, lrcZh, coverFileName, notes } = req.body;

    if (!trackTitle || !contributorEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 结构化提交日志，存入数据库或日志系统
    const submissionRecord = {
      id: `sub_${Date.now()}`,
      mode,
      albumId,
      trackTitle,
      contributorEmail,
      audioUrl: audioUrl || null,
      mvUrl: mvUrl || null,
      lrcJa: lrcJa || null,
      lrcZh: lrcZh || null,
      coverFileName: coverFileName || null,
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    console.log('[Contribution Submitted]:', submissionRecord);

    return res.status(200).json({ success: true, record: submissionRecord });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
