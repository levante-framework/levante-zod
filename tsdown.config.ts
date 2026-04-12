import { defineConfig } from 'tsdown';

export default defineConfig({
  attw: {
    profile: 'esm-only',
  },
  platform: 'neutral',
  publint: true,
});
