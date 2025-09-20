// src/utils/seedCompetitorIntel.ts
import { getFirestore, collection, setDoc, doc, writeBatch } from 'firebase/firestore';
import { COMPETITOR_INTEL_EVENTS } from '@/data/index';

/**
 * Seeds Firestore with all mock competitor intel events in a user-specific collection.
 * Usage: Call this function from a dev-only admin view or the browser console.
 */
export async function seedCompetitorIntelGlobal(appId: string, userId: string) {
  const db = getFirestore();
  const batch = writeBatch(db);

  // Flatten all events from COMPETITOR_INTEL_EVENTS
  const allEvents = Object.values(COMPETITOR_INTEL_EVENTS).flat();

  console.log(`Preparing to seed ${allEvents.length} competitor intel events...`);

  for (const event of allEvents) {
    const docRef = doc(collection(db, `artifacts/${appId}/users/${userId}/competitorIntel`), event.id.toString());
    batch.set(docRef, event);
  }

  await batch.commit();
  console.log('Competitor intel seeding complete.');
}
