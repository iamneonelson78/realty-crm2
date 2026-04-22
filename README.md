# Realty CRM

Realty CRM is a modern, comprehensive Real Estate Customer Relationship Management (CRM) application designed to help real estate agents and administrators manage leads, property listings, and client communications effectively.

## Features

- **Lead Pipeline Management**: A visual, drag-and-drop Kanban board to track leads from initial inquiry to closing.
- **Listing Manager**: Manage property listings and automatically generate professional, customizable social media posts (e.g., Facebook) using templates.
- **Connections Module**: Link external communication channels (Messenger, WhatsApp, Viber) to easily connect with leads and manage outreach.
- **Admin Access Control**: A dedicated administrative dashboard to manage user roles, approve signups, reset passwords, and toggle specific account features.
- **Dark Mode Support**: Seamless toggle between light and dark themes for comfortable viewing.
- **Responsive Design**: Beautiful, mobile-friendly interface built with modern UI principles.

## Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **Backend & Database**: Supabase (PostgreSQL, Authentication)
- **Routing**: React Router DOM
- **Testing**: Playwright (E2E testing), ESLint (Linting)
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- A Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd realty-crm
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPPORT_EMAIL=support@getcoreviatechnologies.com
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Testing & Quality Assurance

This project maintains high code quality and test coverage through automated checks.

### Running Linting

To check for code quality and formatting issues:
```bash
npm run lint
```

### Running End-to-End (E2E) Tests

The application uses Playwright for comprehensive regression testing. To run the test suite:
```bash
npm run test:e2e
```
*Note: Make sure your local development server is running, or adjust the `playwright.config.js` to automatically start it if needed.*

## CI/CD Pipeline

The project includes fully automated Continuous Integration and Continuous Deployment (CI/CD) pipelines powered by **GitHub Actions**. We have split this into two separate workflows:

### 1. Continuous Integration (Pull Requests)
Whenever a Pull Request is opened against the `main` or `master` branch, the CI workflow (`ci-pr.yml`) automatically runs:
1. Installs all dependencies.
2. Runs ESLint to ensure code quality.
3. Builds the production application bundle.
4. Executes the full Playwright E2E regression test suite against the built application.
5. Uploads the Playwright HTML report as a build artifact for review.

### 2. Continuous Deployment (Vercel Production Deploy)
Whenever code is merged or pushed directly to the `main` or `master` branch, the CD workflow (`cd-main.yml`) will automatically deploy the application to **Vercel**. 

**Required GitHub Secrets for Vercel CD:**
To enable the automated Vercel deployment, you must add the following secrets to your GitHub Repository Settings (Settings > Secrets and variables > Actions):
- `VERCEL_TOKEN`: A Vercel Personal Access Token (can be generated in your Vercel Account Settings).
- `VERCEL_ORG_ID`: Your Vercel Organization ID (found in `~/.vercel/project.json` or Vercel dashboard).
- `VERCEL_PROJECT_ID`: Your Vercel Project ID (found in `~/.vercel/project.json` or Vercel dashboard).

## User Documentation

For a comprehensive guide on how to use the platform as an Agent or an Administrator, please refer to the [User Guide](USER_GUIDE.md).
