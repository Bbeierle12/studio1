import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: 'studio-5182661874-6b3b7',
  appId: '1:382448659100:web:74c9f9327ef1fd6a175b59',
  storageBucket: 'studio-5182661874-6b3b7.firebasestorage.app',
  apiKey: 'AIzaSyAZ-_rV2KMDipKVJV_E9b2rKzvPXNJyuaI',
  authDomain: 'studio-5182661874-6b3b7.firebaseapp.com',
  messagingSenderId: '382448659100',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
