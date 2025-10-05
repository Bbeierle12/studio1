# Family Recipes

A Next.js application for managing and sharing family recipes with AI-powered features.

## Features

- 🍳 Recipe management with rich metadata (prep time, servings, difficulty, cuisine)
- 🧑‍🍳 User authentication with NextAuth.js
- 🤖 AI-powered recipe summarization and generation (OpenAI)
- 📅 **Meal Planning Calendar**: Plan meals with weather-based suggestions
- 📱 Responsive design with Tailwind CSS and Radix UI
- 🗃️ Database with Prisma and PostgreSQL
- 🔍 Recipe search and filtering
- 🌍 Geographic origin tracking
- 📝 Recipe variations and family lineage
- 🛒 Shopping list generation

### Meal Planning Calendar

Plan your meals ahead with our integrated calendar system:

- **Calendar Views**: Month, Week, and Day views for flexible planning
- **Weather Integration**: See weather forecasts alongside your meal plans
- **Meal Organization**: Organize by meal type (Breakfast, Lunch, Dinner, Snack)
- **Color-Coded Interface**: Easy visual distinction between meal types
- **Quick Actions**: Add, edit, and organize meals with intuitive dialogs

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your environment variables:
   - `DATABASE_URL`: SQLite database path (default: `file:./dev.db`)
   - `NEXTAUTH_SECRET`: Random string for NextAuth.js session encryption
   - `OPENAI_API_KEY`: OpenAI API key for AI features (optional)
   - `NEXT_PUBLIC_OPENWEATHER_API_KEY`: OpenWeatherMap API key for weather features (optional)
   
   **Getting an OpenWeatherMap API Key:**
   1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
   2. Subscribe to the free plan (1,000 calls/day)
   3. Copy your API key to `NEXT_PUBLIC_OPENWEATHER_API_KEY`
   4. The app will work without this key but won't show weather-based recommendations

4. Set up the database:
   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:9002](http://localhost:9002) in your browser.

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:reset` - Reset database and run migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm run backfill:slugs` - Backfill slugs for existing recipes

### CI/CD

The project includes GitHub Actions workflows for:

- **CI Pipeline** (`.github/workflows/ci.yml`):
  - Runs on every push and PR
  - Type checking with TypeScript
  - Code linting with ESLint
  - Code formatting check with Prettier
  - Production build verification

- **Security Audit** (`.github/workflows/security.yml`):
  - Dependency vulnerability scanning
  - Runs on push/PR and weekly schedule

### Code Quality

The project enforces code quality through:

- **TypeScript** for type safety
- **ESLint** for code linting (extends Next.js and Prettier configs)
- **Prettier** for consistent code formatting
- **Husky** for pre-commit hooks (optional)

## Architecture

- **Framework**: Next.js 15 with App Router
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **AI**: Vercel AI SDK with OpenAI
- **UI**: Tailwind CSS + Radix UI components
- **Deployment**: Vercel (recommended)

To get started, take a look at `src/app/page.tsx`.
