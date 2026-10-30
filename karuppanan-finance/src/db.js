import Dexie from 'dexie';
export const db = new Dexie('FinanceLocalDB');
db.version(1).stores({
  clients: 'id, userId, day, name, phone, village, principal, interest, totalPaid, isPendingSync'
});