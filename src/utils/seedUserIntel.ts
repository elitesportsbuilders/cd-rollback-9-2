// Utility to seed user intel mock data to Firestore
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';
import { mockUserIntel } from '@/data';

export async function seedUserIntelGlobal(appId: string, userId: string) {
  const db = getFirestore();
  for (const intel of mockUserIntel) {
    await setDoc(doc(collection(db, `artifacts/${appId}/users/${userId}/intel`), intel.id.toString()), intel);
  }
}
