import { defineConfig } from 'tsdown';

// publint/attw pack the package via `npm pack`; skip that during the `prepare`
// lifecycle so consumer git-installs get a plain, fast, robust build.
const validatePackaging = process.env.npm_lifecycle_event !== 'prepare';

export default defineConfig({
  attw: validatePackaging ? { profile: 'esm-only' } : false,
  platform: 'neutral',
  publint: validatePackaging,
});
