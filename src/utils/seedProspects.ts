// Utility to seed prospects mock data to Firestore
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';
import { mockProspects } from '@/data';

export async function seedProspectsGlobal(appId: string, userId: string) {
  const db = getFirestore();
  for (const prospect of mockProspects) {
    await setDoc(doc(collection(db, `artifacts/${appId}/users/${userId}/prospects`), prospect.id.toString()), prospect);
  }
}
