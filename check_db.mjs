import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAGiJrWnwbdY4PrI-YHMf7DWOS9wFlsY3c",
  authDomain: "print-shop-os-f8092.firebaseapp.com",
  projectId: "print-shop-os-f8092",
  storageBucket: "print-shop-os-f8092.firebasestorage.app",
  messagingSenderId: "637868552650",
  appId: "1:637868552650:web:40efe47e1396a627c7df33",
  measurementId: "G-811MRPRVFP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkDb() {
  const palletsSnap = await getDocs(collection(db, 'pallets'));
  console.log(`Pallets count: ${palletsSnap.size}`);
  
  const eventsSnap = await getDocs(collection(db, 'event_items'));
  console.log(`Event items count: ${eventsSnap.size}`);
  process.exit(0);
}

checkDb().catch(console.error);
