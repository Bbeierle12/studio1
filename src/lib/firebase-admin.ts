
import admin from 'firebase-admin';

// Ensure idempotency in a serverless environment
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The following line is crucial for parsing the private key from an environment variable
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  } as admin.ServiceAccount;

  // Validate the service account credentials
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    // In a production environment, you might want to log this error more robustly
    console.error('Firebase Admin SDK Service Account credentials are not defined in environment variables.');
  } else {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error: any) {
        console.error('Firebase Admin SDK initialization error:', error.message);
    }
  }
}

let authInstance: admin.auth.Auth;

// Check if the app was initialized before trying to use its services
if (admin.apps.length > 0) {
    authInstance = admin.auth();
} else {
    // Provide a dummy object or throw an error if the app is not initialized
    // This prevents the app from crashing if firebase-admin fails to initialize
    console.error("Firebase Admin SDK not initialized. Auth functionality will not work.");
    authInstance = {
        verifySessionCookie: () => Promise.reject(new Error('Firebase not initialized')),
        createSessionCookie: () => Promise.reject(new Error('Firebase not initialized')),
    } as unknown as admin.auth.Auth;
}

export const auth = authInstance;
