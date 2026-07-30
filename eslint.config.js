import { readdirSync } from 'node:fs';

import js from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/** Слои FSD снизу вверх. Слой может импортировать только слои строго ниже себя. */
const LAYERS = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'];

function readSlices(layer) {
  try {
    return readdirSync(`src/${layer}`, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

/**
 * Границы FSD:
 * 1) слой не видит слои выше себя;
 * 2) слайс не видит внутренности соседних слайсов своего слоя (только через их index).
 * Внутренние импорты слайса разрешены — иначе публичный API нечем собрать.
 */
const layerBoundaries = LAYERS.flatMap((layer, index) => {
  const upperLayers = LAYERS.slice(index + 1).map((forbidden) => ({
    group: [`@/${forbidden}/*`],
    message: `FSD: слой "${layer}" не может импортировать из слоя "${forbidden}".`,
  }));

  const slices = readSlices(layer);

  return slices.map((slice) => ({
    files: [`src/${layer}/${slice}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...upperLayers,
            ...slices
              .filter((other) => other !== slice)
              .map((other) => ({
                group: [`@/${layer}/${other}/*/**`],
                message: `FSD: импортируйте слайс "${other}" через его публичный API (@/${layer}/${other}).`,
              })),
          ],
        },
      ],
    },
  }));
});

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'public/mockServiceWorker.js'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],
  pluginQuery.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  ...layerBoundaries,
  {
    // Тесты проверяют слои снаружи и не подчиняются правилам границ.
    files: ['**/*.{test,spec}.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
