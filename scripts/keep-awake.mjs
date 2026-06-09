const siteUrl = process.env.RENDER_EXTERNAL_URL || process.env.SITE_URL;

if (!siteUrl) {
  console.error('Set SITE_URL or RENDER_EXTERNAL_URL before running the keep-awake script.');
  process.exit(1);
}

try {
  const response = await fetch(siteUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'dodgeball-reunion-keep-awake/1.0'
    }
  });

  console.log(`[keep-awake] ${new Date().toISOString()} ${response.status} ${siteUrl}`);
  if (!response.ok) process.exit(1);
} catch (error) {
  console.error(`[keep-awake] failed: ${error.message}`);
  process.exit(1);
}
