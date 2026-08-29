# useagent Landing (usagent-land)

The marketing / landing page for **useagent**, migrated from a v0-generated
[Next.js](https://nextjs.org) app to a [TanStack Start](https://tanstack.com/start)
full-stack React app. Part of the `agentmon` pnpm/Turborepo monorepo.

## Stack

- [TanStack Start](https://tanstack.com/start) (Vite-based file routing + SSR via Nitro)
- [TanStack Router](https://tanstack.com/router) with a generated `src/routeTree.gen.ts`
- React 19, TypeScript, Tailwind CSS v3 (PostCSS), shadcn/ui, framer-motion

## Layout

```
src/
  routes/           # file-based routes (__root.tsx = document shell, index.tsx = landing)
  router.tsx        # TanStack Router factory
  components/       # landing sections (useagent-page, bento, ui/ shadcn primitives)
  hooks/  lib/      # shared hooks + utils
  styles/globals.css# global + custom landing styles
public/             # static assets
vite.config.ts      # tanstackStart() + react() + nitro() plugins
```

## Development

From the monorepo root:

```sh
pnpm dev:land     # turbo runs `vite dev` → http://localhost:3000
pnpm build:land   # `vite build && tsc --noEmit`
```

Or directly from this directory:

```sh
pnpm dev          # Vite dev server
pnpm build        # production build (client + SSR server)
pnpm start        # serve the build → node .output/server/index.mjs
```