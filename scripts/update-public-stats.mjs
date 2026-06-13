import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function parseServiceAccount(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
      throw new Error('service account JSON lacks client_email/private_key/project_id');
    }
    return parsed;
  } catch (error) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT is invalid JSON: ${error.message}`);
  }
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

async function countQuery(query) {
  const snapshot = await query.count().get();
  return snapshot.data().count;
}

async function main() {
  const serviceAccount = parseServiceAccount(requiredEnv('FIREBASE_SERVICE_ACCOUNT'));
  const propertyId = requiredEnv('GA4_PROPERTY_ID').replace(/^properties\//, '');

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  }

  const db = getFirestore();
  const analyticsClient = new BetaAnalyticsDataClient({
    credentials: {
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key
    },
    projectId: serviceAccount.project_id
  });

  const [registeredPlayers, level10Players, level20Players] = await Promise.all([
    countQuery(db.collection('players')),
    countQuery(db.collection('milestones').where('milestone', '==', 10)),
    countQuery(db.collection('milestones').where('milestone', '==', 20))
  ]);

  const [totalPageViews, todayPageViews] = await Promise.all([
    queryPageViews(analyticsClient, propertyId, '2020-01-01', 'today'),
    queryPageViews(analyticsClient, propertyId, 'today', 'today')
  ]);

  const summary = {
    registeredPlayers,
    totalPageViews,
    todayPageViews,
    level10Players,
    level20Players,
    updatedAt: FieldValue.serverTimestamp(),
    gaStatus: 'ok',
    source: 'github-actions',
    schemaVersion: 1,
    gameVersion: 'V2.2.0'
  };

  await db.collection('public_stats').doc('summary').set(summary, { merge: true });

  console.log('Public stats updated successfully:', {
    registeredPlayers,
    totalPageViews,
    todayPageViews,
    level10Players,
    level20Players
  });
}

main().catch((error) => {
  console.error('Public stats update failed:', error?.stack || error);
  process.exitCode = 1;
});
