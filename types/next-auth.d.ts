import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role?: 'USER' | 'SUPPORT_ADMIN' | 'CONTENT_ADMIN' | 'SUPER_ADMIN' | string;
    isActive?: boolean;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: 'USER' | 'SUPPORT_ADMIN' | 'CONTENT_ADMIN' | 'SUPER_ADMIN' | string;
    isActive?: boolean;
  }
}
