import test from 'node:test';
import assert from 'node:assert/strict';
import { filterCategoriesBySearch, getCategorySubmissionPayload, resolveCategorySelection } from '../lib/category-utils.mjs';

test('filters categories by search terms across names and descriptions', () => {
  const categories = [
    { category_id: 1, category_name: 'Plumbing', description: 'Water and drainage' },
    { category_id: 2, category_name: 'Cleaning Services', description: 'House and office cleaning' },
    { category_id: 3, category_name: 'Electrical Work', description: 'Wiring and repairs' }
  ];

  const results = filterCategoriesBySearch(categories, 'clean');

  assert.deepEqual(results.map((category) => category.category_id), [2]);
});

test('builds a safe submission payload for either a selected or custom specialty', () => {
  assert.deepEqual(getCategorySubmissionPayload('7', '', false), { category_id: 7, custom_category: '' });
  assert.deepEqual(getCategorySubmissionPayload('', 'Custom Home Spa', true), { category_id: null, custom_category: 'Custom Home Spa' });
  assert.deepEqual(getCategorySubmissionPayload('not-a-number', '', false), { category_id: null, custom_category: '' });
});

test('creates a real category record for a custom specialty', async () => {
  let queryCalls = [];
  const queryFn = async (sql, params = []) => {
    queryCalls.push({ sql, params });
    if (sql.includes('SELECT category_id FROM categories')) {
      return [];
    }
    if (sql.includes('INSERT INTO categories')) {
      return { insertId: 42 };
    }
    return [];
  };

  const result = await resolveCategorySelection(queryFn, '', 'Custom Home Spa');

  assert.equal(result.categoryId, 42);
  assert.equal(result.categoryName, 'Custom Home Spa');
  assert.ok(queryCalls.some((call) => call.sql.includes('INSERT INTO categories')));
});
