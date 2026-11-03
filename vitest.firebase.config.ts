import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

/** Emulator tests – run via `npm run test:firebase` (starts the Firestore + Auth emulators). */
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['tests/firebase/**/*.test.ts'],
    testTimeout: 20_000,
    fileParallelism: false,
  },
});
