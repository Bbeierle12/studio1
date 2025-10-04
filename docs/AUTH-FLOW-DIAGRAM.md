# Authentication Flow Diagram

## Application Access Flow

```
                            ┌─────────────────────┐
                            │   User Visits Any   │
                            │        URL          │
                            └──────────┬──────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │   Is User Logged    │
                            │       In?           │
                            └──────────┬──────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         │                           │
                    NO   ▼                           ▼   YES
            ┌────────────────────┐        ┌─────────────────────┐
            │  Redirect to       │        │  Show Requested     │
            │  /login            │        │  Page               │
            └─────────┬──────────┘        └──────────┬──────────┘
                      │                              │
                      ▼                              ▼
            ┌────────────────────┐        ┌─────────────────────┐
            │  Login Form        │        │  Full Navigation    │
            │  (No Nav Tabs)     │        │  Tabs Visible       │
            └─────────┬──────────┘        └─────────────────────┘
                      │                    │ Home │ Browse │
                      │                    │ Collections │ Saved │
            ┌─────────┴──────────┐         │ Add Recipe │
            │                    │         
            ▼                    ▼         
    ┌──────────────┐    ┌──────────────┐
    │   Sign In    │    │   Register   │
    └──────┬───────┘    └──────┬───────┘
           │                   │
           └─────────┬─────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │  Authentication     │
          │  Successful         │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │  Redirect to Home   │
          │  Show All Nav Tabs  │
          └─────────────────────┘
```

## Navigation Visibility States

### 🔴 Not Authenticated:
```
┌────────────────────────────────────────────────────────────────┐
│  [🍳] Our Family Table              [🛒] [☀️] [📏] [Sign In]  │
└────────────────────────────────────────────────────────────────┘
│                                                                  │
│                         Login Form                              │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

### 🟢 Authenticated:
```
┌────────────────────────────────────────────────────────────────┐
│  [🍳] Our Family Table                                         │
│  [Home] [Browse] [Collections] [Saved] [Add Recipe]            │
│                                      [🛒] [☀️] [📏] [👤 User] │
└────────────────────────────────────────────────────────────────┘
│                                                                  │
│                      Dashboard Content                          │
│                      Voice Assistant                            │
│                      Recipe Tabs                                │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

## Middleware Protection Flow

```
                    ┌─────────────────────┐
                    │  Incoming Request   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  NextAuth           │
                    │  Middleware         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Check Route        │
                    │  /login or          │
                    │  /register?         │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
               YES  ▼                     ▼  NO
        ┌──────────────────┐   ┌──────────────────┐
        │  Allow Access    │   │  Check Auth      │
        │  (Public Route)  │   │  Token           │
        └──────────────────┘   └─────────┬────────┘
                                          │
                               ┌──────────┴──────────┐
                               │                     │
                          YES  ▼                     ▼  NO
                   ┌──────────────────┐   ┌──────────────────┐
                   │  Allow Access    │   │  Redirect to     │
                   │  Show Page       │   │  /login          │
                   └──────────────────┘   └──────────────────┘
```

## Component Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                           Header Component                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                  ┌──────────────────────────┐
                  │   const { user } =       │
                  │   useAuth()              │
                  └─────────────┬────────────┘
                                │
                                ▼
                  ┌──────────────────────────┐
                  │   user exists?           │
                  └─────────────┬────────────┘
                                │
                  ┌─────────────┴─────────────┐
                  │                           │
             YES  ▼                           ▼  NO
    ┌───────────────────────┐    ┌───────────────────────┐
    │  Show Navigation:     │    │  Show Only:           │
    │  - Home               │    │  - Logo               │
    │  - Browse             │    │  - Theme Toggle       │
    │  - Collections        │    │  - Unit Toggle        │
    │  - Saved              │    │  - Sign In Button     │
    │  - Add Recipe         │    │                       │
    │  - User Menu          │    │  navLinks = []        │
    └───────────────────────┘    └───────────────────────┘
```

## Page Load Sequence

```
1. User navigates to URL
   │
   ▼
2. Middleware intercepts request
   │
   ▼
3. Checks if route is /login or /register
   │
   ├─ YES → Allow access
   │
   └─ NO → Check authentication token
      │
      ├─ Token exists → Allow access to page
      │
      └─ No token → Redirect to /login
         │
         ▼
4. Page Component Mounts
   │
   ▼
5. useAuth() hook checks authentication
   │
   ▼
6. If authenticated:
   │  - Render page content
   │  - Show navigation tabs
   │  - Enable all features
   │
   └─ If not authenticated:
      - Show loading spinner
      - Redirect to /login
```

## Route Access Matrix

```
┌───────────────────────┬─────────────┬─────────────┐
│       Route           │  Not Auth   │  Authenticated │
├───────────────────────┼─────────────┼─────────────┤
│  /                    │   ❌ → 🔐   │      ✅      │
│  /login               │     ✅      │   ✅ → 🏠   │
│  /register            │     ✅      │   ✅ → 🏠   │
│  /recipes             │   ❌ → 🔐   │      ✅      │
│  /recipes/[id]        │   ❌ → 🔐   │      ✅      │
│  /recipes/new         │   ❌ → 🔐   │      ✅      │
│  /recipes/[id]/edit   │   ❌ → 🔐   │      ✅      │
│  /collections         │   ❌ → 🔐   │      ✅      │
│  /saved               │   ❌ → 🔐   │      ✅      │
│  /api/*               │     ✅      │      ✅      │
└───────────────────────┴─────────────┴─────────────┘

Legend:
  ✅ = Accessible
  ❌ = Blocked
  🔐 = Redirects to /login
  🏠 = Redirects to home
```

## Security Layers

```
┌──────────────────────────────────────────────────────┐
│                   Layer 1: Middleware                │
│         Server-side route protection at             │
│         Next.js middleware level                     │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│              Layer 2: Page Components                │
│         Client-side authentication checks            │
│         with useAuth() and redirects                 │
└────────────────────┬─────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────┐
│              Layer 3: UI Components                  │
│         Conditional rendering based on              │
│         authentication state                         │
└──────────────────────────────────────────────────────┘
```

## Authentication State Management

```
                    ┌─────────────────────┐
                    │   NextAuth Session  │
                    │   (Server)          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   useAuth Hook      │
                    │   (Client)          │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
    ┌──────────────────────┐      ┌──────────────────────┐
    │  Header Component    │      │  Page Components     │
    │  - Navigation        │      │  - Access Control    │
    │  - User Menu         │      │  - Redirects         │
    └──────────────────────┘      └──────────────────────┘
```

## Summary

This authentication system ensures:
1. ✅ All content protected behind login
2. ✅ Navigation only visible to authenticated users
3. ✅ Multiple security layers (middleware + client)
4. ✅ Automatic redirects for unauthorized access
5. ✅ Clean separation between public and protected routes
