/**
 * Shared Utilities - Test-Safe Exports
 * 
 * This barrel file ONLY exports utilities safe for testing.
 * NO server-side code (routes, auth, database) should be exported here.
 */

export * from './math-utils';
export * from './conversion-constants';
