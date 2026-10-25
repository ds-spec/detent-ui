// TypeScript's view of `@pro`. The bundler points it at src/pro or src/locked (see next.config.ts);
// both export the same names, so the locked stand-in's types describe either.
declare module '@pro' {
  export * from '@/locked'
}

// And `@pro-server`, Pro's route handlers, the same way.
declare module '@pro-server' {
  export * from '@/locked/server'
}
