import { Firestore, FieldValue, Timestamp } from '@google-cloud/firestore';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function metricValue(response) {
  const raw = response?.[0]?.rows?.[0]?.metricValues?.[0]?.value;
  const value = Number(raw ?? 0);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

async function queryPageViews(client, propertyId, startDate, endDate) {
  const response = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [{ name: 'screenPageViews' }],
    keepEmptyRows: true
  });
  return metricValue(response);
}

async function countQuery(query, label = 'collection') {
  try {
    const snapshot = await query.count().get();
    return Number(snapshot.data().count || 0);
  } catch (error) {
    console.error(`Firestore count failed [${label}]:`, error?.message || error);
    throw error;
  }
}

async function countTodayUsageEvents(usageEvents, todayStart) {
  const snapshot = await usageEvents
    .where('occurredAt', '>=', todayStart)
    .select('eventType')
    .get();

  let pageLaunches = 0;
  let loginPlays = 0;

  for (const document of snapshot.docs) {
    const eventType = document.get('eventType');
    if (eventType === 'page_launch') pageLaunches += 1;
    if (eventType === 'player_login_play') loginPlays += 1;
  }

  return { pageLaunches, loginPlays, scannedDocuments: snapshot.size };
}


function safeInteger(value, minimum = 0, maximum = 2147483647) {
  const number = Math.floor(Number(value ?? 0));
  if (!Number.isFinite(number)) return minimum;
  return Math.min(maximum, Math.max(minimum, number));
}

function safeText(value, fallback = '', maxLength = 80) {
  const text = String(value ?? fallback).trim();
  return (text || fallback).slice(0, maxLength);
}

function worldCupSort(a, b) {
  return (
    b.bestScore - a.bestScore ||
    b.highestLevel - a.highestLevel ||
    b.lines - a.lines ||
    a.achievedAtLocal - b.achievedAtLocal ||
    a.nickname.localeCompare(b.nickname, 'zh-Hant')
  );
}

function sanitizeWorldCupCandidate(snapshot) {
  const data = snapshot.data() || {};
  return {
    nickname: safeText(data.nickname, '玩家', 24),
    avatar: safeText(data.avatar, '🎮', 16),
    color: safeText(data.color, 'cyan', 32),
    bestScore: safeInteger(data.bestScore),
    highestLevel: safeInteger(data.highestLevel, 1, 9999),
    lines: safeInteger(data.lines, 0, 999999),
    achievedAtLocal: safeInteger(
      data.achievedAtLocal ||
        data.updatedAt?.toMillis?.() ||
        Date.now(),
      0,
      Number.MAX_SAFE_INTEGER
    ),
    gameVersion: safeText(data.gameVersion, '', 24)
  };
}

async function main() {
  const projectId = requiredEnv('GCP_PROJECT_ID');
  const propertyId = requiredEnv('GA4_PROPERTY_ID').replace(/^properties\//, '');

  // google-github-actions/auth creates short-lived Application Default Credentials.
  // Both clients below automatically read those ADC credentials.
  const db = new Firestore({ projectId });
  const analyticsClient = new BetaAnalyticsDataClient();
  const publicSummaryRef = db.collection('public_stats').doc('summary');
  const previousSummarySnapshot = await publicSummaryRef.get();
  const previousSummary = previousSummarySnapshot.exists
    ? previousSummarySnapshot.data() || {}
    : {};

  const now = new Date();
  const taipeiDateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  const taipeiStartUtc = new Date(
    `${taipeiDateParts.year}-${taipeiDateParts.month}-${taipeiDateParts.day}T00:00:00+08:00`
  );
  const todayStart = Timestamp.fromDate(taipeiStartUtc);

  const usageEvents = db.collection('usage_events');

  const worldCupCandidates = db.collection('world_cup_candidates');

  console.log('Starting Firestore aggregation without composite-index queries...');

  const [
    registeredPlayers,
    totalPageLaunches,
    successfulLoginPlays,
    level10Players,
    level20Players,
    worldCupCandidateDevices,
    worldCupCandidateSnapshot,
    todayUsageCounts
  ] = await Promise.all([
    countQuery(db.collection('players'), 'players'),
    countQuery(usageEvents.where('eventType', '==', 'page_launch'), 'usage_events/page_launch'),
    countQuery(usageEvents.where('eventType', '==', 'player_login_play'), 'usage_events/player_login_play'),
    countQuery(db.collection('milestones').where('milestone', '==', 10), 'milestones/level10'),
    countQuery(db.collection('milestones').where('milestone', '==', 20), 'milestones/level20'),
    countQuery(worldCupCandidates, 'world_cup_candidates'),
    worldCupCandidates.orderBy('bestScore', 'desc').limit(100).get(),
    countTodayUsageEvents(usageEvents, todayStart)
  ]);

  const todayPageLaunches = todayUsageCounts.pageLaunches;
  const todaySuccessfulLoginPlays = todayUsageCounts.loginPlays;

  console.log('Today usage scan completed:', {
    scannedDocuments: todayUsageCounts.scannedDocuments,
    todayPageLaunches,
    todaySuccessfulLoginPlays
  });

  const worldCupEntries = worldCupCandidateSnapshot.docs
    .map(sanitizeWorldCupCandidate)
    .filter(entry => entry.bestScore > 0)
    .sort(worldCupSort);

  const worldCupTopTen = worldCupEntries.slice(0, 10).map((entry, index) => ({
    rank: index + 1,
    title: index === 0 ? '世界盃冠軍' : `世界盃第 ${index + 1} 名`,
    ...entry
  }));

  const champion = worldCupTopTen[0] || {
    title: '等待首位挑戰者',
    nickname: '等待首位挑戰者',
    avatar: '🏆',
    color: 'npcGold',
    bestScore: 0,
    highestLevel: 1,
    lines: 0,
    achievedAtLocal: 0,
    gameVersion: ''
  };

  let totalPageViews = safeInteger(previousSummary.totalPageViews || 0);
  let todayPageViews = safeInteger(previousSummary.todayPageViews || 0);
  let gaStatus = 'ok';
  try {
    [totalPageViews, todayPageViews] = await Promise.all([
      queryPageViews(analyticsClient, propertyId, '2020-01-01', 'today'),
      queryPageViews(analyticsClient, propertyId, 'today', 'today')
    ]);
  } catch (error) {
    gaStatus = 'error';
    console.warn('GA4 report temporarily unavailable; keeping previous values:', error?.message || error);
  }

  const summary = {
    registeredPlayers,
    totalPageLaunches,
    todayPageLaunches,
    successfulLoginPlays,
    todaySuccessfulLoginPlays,
    totalPageViews,
    todayPageViews,
    level10Players,
    level20Players,
    worldCupCandidateDevices,
    worldCupChampionTitle: champion.title,
    worldCupChampionName: champion.nickname,
    worldCupChampionAvatar: champion.avatar,
    worldCupChampionColor: champion.color,
    worldCupChampionScore: champion.bestScore,
    worldCupChampionLevel: champion.highestLevel,
    worldCupChampionLines: champion.lines,
    worldCupChampionGameVersion: champion.gameVersion,
    updatedAt: FieldValue.serverTimestamp(),
    worldCupUpdatedAt: FieldValue.serverTimestamp(),
    gaStatus,
    source: 'github-actions-wif',
    schemaVersion: 5,
    gameVersion: 'V2.2.9'
  };

  const worldCupPublic = {
    title: '雲端世界盃',
    champion,
    entries: worldCupTopTen,
    candidateDevices: worldCupCandidateDevices,
    updatedAt: FieldValue.serverTimestamp(),
    gameVersion: 'V2.2.9'
  };

  await Promise.all([
    publicSummaryRef.set(summary, { merge: true }),
    db.collection('world_cup').doc('current').set(worldCupPublic)
  ]);

  console.log('Public stats and World Cup updated successfully:', {
    registeredPlayers,
    totalPageLaunches,
    todayPageLaunches,
    successfulLoginPlays,
    todaySuccessfulLoginPlays,
    totalPageViews,
    todayPageViews,
    level10Players,
    level20Players,
    worldCupCandidateDevices,
    worldCupChampion: champion.nickname,
    worldCupChampionScore: champion.bestScore
  });
}

main().catch((error) => {
  console.error('Public stats update failed.');
  console.error('Error code:', error?.code ?? 'unknown');
  console.error('Error details:', error?.details ?? error?.message ?? 'unknown');
  console.error(error?.stack || error);
  process.exitCode = 1;
});
