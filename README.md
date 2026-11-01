# Detent

premium React components: the prompt box, the plan, the model picker, the file tree and
the small pieces between them, each with its motion and states already worked out.

[detentui.com](https://detentui.com)

## Use a component

Each free component installs with the shadcn CLI, its source landing in `components/detent`:

```bash
npx shadcn add https://detentui.com/r/prompt
```

Or the whole agent kit at once:

```bash
npx shadcn add https://detentui.com/r/agent-kit
```

To respect reduced motion, wrap your app once in `<MotionConfig reducedMotion="user">` from `motion/react`, around everything in your root layout.

## What's here

- `src/lab` holds the 16 free components, the 5 free blocks, their demos, and the motion and UI they share.
- `src/catalog` says what every component, block and template is, and builds the public registry from the source.
- `src/site` is the website around them: the gallery, the exhibit and the code browser.
- `src/app` is its routes.

## Detent Pro

19 more components, 14 blocks and 3 templates are [Detent Pro](https://detentui.com/pro). Their
source lives in a private repository, checked out at `src/pro` when it's there. Without it, `@pro`
resolves to `src/locked` and each Pro preview builds as a locked stand-in, so the site runs from
this repository alone.

## Run it

```bash
npm install
npm run dev
```

## Licence

MIT. See [LICENSE](LICENSE).
