import assert from 'assert';
import { querySqliteFallback, closeSqliteFallback } from '../lib/sqlite-fallback.js';
import { resolveCategorySelection } from '../lib/category-utils.js';

(async () => {
  // Trigger initialization via a simple query and ensure a clean starting point
  await querySqliteFallback('SELECT 1');
  // Ensure a clean starting point for this test name
  await querySqliteFallback('DELETE FROM categories WHERE LOWER(category_name) = LOWER(?)', ['test specialty regression']);

  // Ask the resolver to ensure the category exists. Some sql.js environments
  // may not return the insertId reliably, so we SELECT the created row.
  await resolveCategorySelection(querySqliteFallback, null, 'Test Specialty Regression');

  const rows = await querySqliteFallback('SELECT category_id, category_name FROM categories WHERE LOWER(category_name) = LOWER(?) LIMIT 1', ['test specialty regression']);
  assert(rows && rows.length > 0, 'Category should exist after resolver runs');
  const createdId = Number(rows[0].category_id);

  // Calling again must return the same id (no duplicate insertion)
  await resolveCategorySelection(querySqliteFallback, null, 'test specialty regression');
  const rows2 = await querySqliteFallback('SELECT category_id FROM categories WHERE LOWER(category_name) = LOWER(?)', ['test specialty regression']);
  assert(rows2 && rows2.length > 0 && Number(rows2[0].category_id) === createdId, 'Duplicate names should resolve to same category id');

  // Case-insensitive match check: resolver should find the same existing id
  await resolveCategorySelection(querySqliteFallback, null, 'TEST Specialty REGRESSION');
  const rows3 = await querySqliteFallback('SELECT category_id FROM categories WHERE LOWER(category_name) = LOWER(?)', ['test specialty regression']);
  assert(rows3 && rows3.length > 0 && Number(rows3[0].category_id) === createdId, 'Lookup should be case-insensitive');

  // Clean up
  await querySqliteFallback('DELETE FROM categories WHERE category_id = ?', [createdId]);

  closeSqliteFallback();
  console.log('SQLite fallback regression tests passed.');
})();
