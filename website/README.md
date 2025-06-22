# RailboundSolver Website

> This is the web frontend for RailboundSolver, built with React, TypeScript, and Vite.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Setup Instructions

1. **Clone the repository** (if you haven't already):

   ```sh
   git clone <your-repo-url>
   cd RailboundSolver/website
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

## Running the Development Server

Start the Vite development server with hot module reloading:

```sh
npm run dev
```

The app will be available at the URL printed in your terminal (usually http://localhost:5173/).

## Building for Production

To build the optimized production bundle:

```sh
npm run build
```

The output will be in the `dist/` folder.

## Previewing the Production Build

To locally preview the production build:

```sh
npm run preview
```

## Linting and Formatting

This project uses ESLint for linting. To check for lint errors:

```sh
npm run lint
```

To fix lint errors automatically:

```sh
npm run lint:fix
```

## Customizing ESLint

For advanced type-aware or React-specific linting, see the comments in `eslint.config.js` and the [official Vite + React documentation](https://vitejs.dev/guide/).

## Project Structure

- `src/` — Main React source code
- `public/` — Static assets
- `eslint.config.js` — ESLint configuration
- `tsconfig*.json` — TypeScript configuration

---

For more details, see the main project README or open an issue if you have questions.
