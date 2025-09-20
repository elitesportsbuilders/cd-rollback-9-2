// Utility to seed leads mock data to Firestore
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';
import { mockLeads } from '@/data';

export async function seedLeadsGlobal(appId: string, userId: string) {
  const db = getFirestore();
  for (const lead of mockLeads) {
    await setDoc(doc(collection(db, `artifacts/${appId}/users/${userId}/prospects`), lead.id.toString()), lead);
  }
}
