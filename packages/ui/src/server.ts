// Server-safe barrel — pure utilities with NO "use client" boundary.
//
// React Server Components and server-rendered routes must import `cn` / `config` from here.
// Importing them from the client-marked main entry (`@landmap/ui`) turns
// them into client-reference proxies on the server, which makes `cn` an
// `undefined` value and throws "cn is not a function" during SSR.
export { cn } from './cn';
export { config } from './tokens';
export { buttonVariants } from './button';
