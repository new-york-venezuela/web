#!/usr/bin/env node

/**
 * normalizeImages.js
 *
 * Script to normalize product image filenames to kebab-case slugs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mapping from original filenames to normalized slugs
const FILENAME_MAP = {
  'Pan 4 Granos.png': 'pan-4-granos.png',
  'Pan 7 Cereales.png': 'pan-7-cereales.png',
  'Pan Blanco Especial.png': 'pan-blanco-especial.png',
  'Uvas Pasas, Miel y Canela.png': 'pan-uvas-pasas-miel-canela.png',
  'Magdalenas.png': 'magdalenas.png',
  'Pan pumpernickel.png': 'pan-pumpernickel.png',
  'Pan Molido Especial.png': 'pan-molido-especial.png',
  'Baguettes Precocida Congelada - Comercial.png': 'baguettes-precocida-comercial.png',
  'Baguettes - Demi - Mini.png': 'baguettes-demi-mini.png',
  'Pizzas  Precocidas Congeladas.png': 'pizza-margarita-premium.png',
  'Torta de Queso Comercial.png': 'torta-queso-new-york-comercial-fresa.png',
  'Torta de Queso New York.png': 'torta-queso-new-york-fresa.png',
  'Pan de hamburguesa.png': 'pan-hamburguesa-new-york.png',
  'Croissants y Petit Croissants.png': 'croissants.png',
  'Bagels estilo New York.png': 'bagels-new-york-plain.png',
  'Pan 1700.png': 'pan-1700.png',
};

async function normalizeImages(dryRun = true) {
  const result = {
    renamed: {},
    errors: [],
    dryRun,
  };

  try {
    const imageDir = path.join(__dirname, '..', 'public', 'productos');

    // Check if directory exists
    try {
      await fs.access(imageDir);
    } catch {
      result.errors.push(`Directory not found: ${imageDir}`);
      return result;
    }

    // Read all files in the directory
    const files = await fs.readdir(imageDir);

    // Process each mapped file
    for (const [originalName, normalizedName] of Object.entries(FILENAME_MAP)) {
      if (!files.includes(originalName)) {
        result.errors.push(`File not found: ${originalName}`);
        continue;
      }

      const originalPath = path.join(imageDir, originalName);
      const normalizedPath = path.join(imageDir, normalizedName);

      // Check if target already exists
      if (files.includes(normalizedName)) {
        result.errors.push(`Target file already exists: ${normalizedName}`);
        continue;
      }

      // Perform the rename if not a dry run
      if (!dryRun) {
        try {
          await fs.rename(originalPath, normalizedPath);
          result.renamed[originalName] = normalizedName;
        } catch (error) {
          result.errors.push(`Failed to rename ${originalName}: ${error.message}`);
        }
      } else {
        // Dry run: just record what would be renamed
        result.renamed[originalName] = normalizedName;
      }
    }

  } catch (error) {
    result.errors.push(`Unexpected error: ${error.message}`);
  }

  return result;
}

// Main execution
const args = process.argv.slice(2);
const isDryRun = !args.includes('--execute');

normalizeImages(isDryRun).then(result => {
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.errors.length > 0 ? 1 : 0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
