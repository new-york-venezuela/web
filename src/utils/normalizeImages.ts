/**
 * normalizeImages.ts
 *
 * Utility to normalize product image filenames from natural-language names
 * to kebab-case slugs matching product IDs.
 *
 * Renames files in public/productos/ based on the imageRenamingMap from
 * the product catalog manifest.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { parseProductsCatalog } from './parseProductsCatalog.js';

export interface NormalizeResult {
  renamed: Record<string, string>; // original -> normalized
  errors: string[];
  dryRun: boolean;
}

/**
 * Additional mappings for actual files found in the directory
 * Maps observed filenames to their target product slugs
 */
const ADDITIONAL_MAPPINGS: Record<string, string> = {
  'Bagels estilo New York.png': 'bagels-new-york-plain',
  'Torta de Queso Comercial.png': 'torta-queso-new-york-comercial-fresa',
  'Pizzas  Precocidas Congeladas.png': 'pizza-margarita-premium',
};

/**
 * Normalize product image filenames to kebab-case slugs
 *
 * @param dryRun If true, don't actually rename files, just report what would be renamed
 * @returns NormalizeResult with renamed files and any errors
 */
export async function normalizeImages(dryRun: boolean = true): Promise<NormalizeResult> {
  const result: NormalizeResult = {
    renamed: {},
    errors: [],
    dryRun
  };

  try {
    // Get the image renaming map from the catalog
    const manifest = parseProductsCatalog();
    const imageRenamingMap = manifest.imageRenamingMap;

    // Combine with additional mappings for actual files
    const combinedMap = { ...imageRenamingMap, ...ADDITIONAL_MAPPINGS };

    // Get the public/productos directory path
    const imageDir = path.join(process.cwd(), 'public', 'productos');

    // Check if directory exists
    try {
      await fs.access(imageDir);
    } catch {
      result.errors.push(`Directory not found: ${imageDir}`);
      return result;
    }

    // Read all files in the directory
    const files = await fs.readdir(imageDir);

    // Filter for image files and .gitkeep
    const imageFiles = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return (ext === '.png' || ext === '.jpg' || ext === '.jpeg') && f !== '.gitkeep';
    });

    // Process each file
    for (const originalFilename of imageFiles) {
      const originalPath = path.join(imageDir, originalFilename);

      // Check if this file should be renamed
      const normalizedSlug = combinedMap[originalFilename];

      if (!normalizedSlug) {
        result.errors.push(`No mapping found for: ${originalFilename}`);
        continue;
      }

      // Get file extension
      const ext = path.extname(originalFilename);

      // Skip if already normalized (starts with kebab-case slug)
      if (originalFilename === `${normalizedSlug}${ext}`) {
        // Already normalized, skip
        continue;
      }

      const normalizedFilename = `${normalizedSlug}${ext}`;
      const normalizedPath = path.join(imageDir, normalizedFilename);

      // Check if target already exists
      try {
        await fs.access(normalizedPath);
        result.errors.push(`Target file already exists: ${normalizedFilename}`);
        continue;
      } catch {
        // Target doesn't exist, safe to proceed
      }

      // Perform the rename if not a dry run
      if (!dryRun) {
        try {
          await fs.rename(originalPath, normalizedPath);
          result.renamed[originalFilename] = normalizedFilename;
        } catch (error) {
          result.errors.push(`Failed to rename ${originalFilename}: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        // Dry run: just record what would be renamed
        result.renamed[originalFilename] = normalizedFilename;
      }
    }

  } catch (error) {
    result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Main entry point for CLI usage
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--execute');

  normalizeImages(isDryRun).then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.errors.length > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
