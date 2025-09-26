# Copilot Instructions for VinylRichtea

## Project Overview

- **VinylRichtea** is a React + Vite web application with a Node.js/Express backend (see `server/`).
- The frontend lives in `src/` and uses modern React (function components, hooks, JSX, CSS modules).
- The backend is in `server/index.js` and is started separately from the frontend.

## Key Workflows

- **Frontend development:**
  - Start with `npm run dev` from the project root. This uses Vite for fast refresh and HMR.
  - Main entry: `src/main.jsx`, root component: `src/App.jsx`.
  - API calls are made to the backend (see `src/api/`).
- **Backend development:**
  - Start with `npm start` from `server/`.
  - Main entry: `server/index.js`.
- **Linting:**
  - Run `npx eslint .` from the root. Config: `eslint.config.js`.

## Architecture & Patterns

- **Frontend:**
  - Components are in `src/components/` and `src/pages/`.
  - API logic is in `src/api/`.
  - Assets (images, SVGs) are in `src/assets/` and `public/`.
  - Uses Vite plugins for React (see `vite.config.js`).
- **Backend:**
  - Node.js/Express server (see `server/index.js`).
  - Backend dependencies managed in `server/package.json`.

## Conventions & Integration

- **API communication:**
  - Frontend expects backend to run on a separate port (configure proxy in `vite.config.js` if needed).
  - Use fetch/axios for API calls; endpoints are defined in the backend.
- **Styling:**
  - Use CSS modules (`.css` files imported into components).
- **Project structure:**
  - Keep frontend and backend code separated.
  - Place new React components in `src/components/`.
  - Place new backend routes or logic in `server/`.

## Examples

- See `src/components/DiscogsLoginAndCollection.jsx` for a typical React component.
- See `server/index.js` for backend API route patterns.

## Tips for AI Agents

- Always check both frontend and backend for cross-cutting features (e.g., API changes).
- When adding new features, update both the frontend (React) and backend (Express) as needed.
- Follow the existing file/folder structure for new code.
- Use Vite and ESLint commands for local testing and linting.
