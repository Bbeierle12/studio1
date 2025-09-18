'use server';

import admin from 'firebase-admin';
import { config } from 'dotenv';

config();

if (!admin.apps.length) {
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
      } as admin.ServiceAccount;

      if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        throw new Error('Firebase Admin SDK Service Account credentials are not defined in .env file. Please add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
      }
      
      admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
      });
  }
}

export const auth = admin.auth();
