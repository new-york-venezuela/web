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
  warnings: string[];
  dryRun: boolean;
}

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
    warnings: [],
    dryRun
  };

  try {
    // Get the image renaming map from the catalog (Task 1)
    // imageRenamingMap maps original filenames (with extensions) to slugs (without extensions)
    const manifest = parseProductsCatalog();
    const imageRenamingMap = manifest.imageRenamingMap;

    // Get the public/productos directory path
    const imageDir = path.join(process.cwd(), 'public', 'productos');

    // Check if directory exists
    try {
      await fs.access(imageDir);
    } catch {
      result.errors.push(`Directory not found: ${imageDir}`);
      return result;
    }

    // Process each file in the imageRenamingMap
    for (const [originalFilename, normalizedSlug] of Object.entries(imageRenamingMap)) {
      const originalPath = path.join(imageDir, originalFilename);

      // Idempotent: skip if file not found (may have been renamed already or doesn't exist)
      try {
        await fs.access(originalPath);
      } catch {
        result.warnings.push(`File not found (skipped): ${originalFilename}`);
        continue;
      }

      // Get file extension from original filename
      const ext = path.extname(originalFilename);

      // Reconstruct normalized filename: slug + original extension
      const normalizedFilename = `${normalizedSlug}${ext}`;

      // Skip if already normalized (original filename already matches target)
      if (originalFilename === normalizedFilename) {
        result.renamed[originalFilename] = normalizedFilename;
        continue;
      }

      const normalizedPath = path.join(imageDir, normalizedFilename);

      // Check if target already exists (conflict)
      try {
        await fs.access(normalizedPath);
        result.errors.push(`Target exists, skipping: ${originalFilename} → ${normalizedFilename}`);
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
 * Can be invoked as: node --loader tsx src/utils/normalizeImages.ts [--execute]
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--execute');

  normalizeImages(isDryRun).then(result => {
    if (result.dryRun) {
      console.log('DRY RUN - Files would be renamed:');
    } else {
      console.log('EXECUTED - Files renamed:');
    }
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.errors.length > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
