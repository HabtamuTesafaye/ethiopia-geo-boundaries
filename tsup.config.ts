import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index:  'src/index.ts',
    adm1:   'src/geometry/adm1.ts',
    adm2:   'src/geometry/adm2.ts',
    adm3:   'src/geometry/adm3.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,       // Each file is its own chunk
  clean: true,
  minify: true,           // Critical — compresses the big geometry strings
  treeshake: false,       // Must be false — treeshake removes Parents exports
  external: [
    './geometry/adm1',
    './geometry/adm1.js',
    './geometry/adm2',
    './geometry/adm2.js',
    './geometry/adm3',
    './geometry/adm3.js',
  ],
});

