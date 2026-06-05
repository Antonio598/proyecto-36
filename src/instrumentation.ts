export async function register() {
  // Only run in Node.js runtime (not in Edge runtime)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const cron = await import('node-cron');
  const { processReminders } = await import('@/lib/processReminders');
  const { processFollowUps } = await import('@/lib/processFollowUps');

  // Run immediately on server start to catch any missed windows
  processReminders().catch(console.error);
  processFollowUps().catch(console.error);

  // Then run every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    processReminders().catch(console.error);
    processFollowUps().catch(console.error);
  });

  console.log('[reminders] Cron iniciado — revisando cada 15 minutos');
}
