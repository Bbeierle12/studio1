import admin from 'firebase-admin';
import { config } from 'dotenv';

config();

if (!admin.apps.length) {
  try {
    // When deployed, this will use the service account from the environment
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    } else {
        // For local development, use the service account key from .env
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const auth = admin.auth();
