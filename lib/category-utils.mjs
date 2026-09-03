// Filter a list of category objects using a simple case-insensitive
// substring search against the category name, description and icon class.
// This helper keeps the frontend search fast and predictable without
// adding an external full-text search dependency.
export function filterCategoriesBySearch(categories = [], searchTerm = '') {
  const normalizedSearch = (searchTerm || '').trim().toLowerCase();

  if (!normalizedSearch) {
    return categories;
  }

  return categories.filter((category) => {
    // Combine searchable fields into a single haystack for a simple
    // includes() check. This mirrors how the UI presents suggestions.
    const haystack = [
      category.category_name || '',
      category.description || '',
      category.icon_class || ''
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });
}

// Build the JSON payload used by registration/profile forms. The UI can
// submit either a chosen `category_id` or an open-text `custom_category`.
// Returning a predictable shape simplifies server-side validation.
export function getCategorySubmissionPayload(categoryId, customCategory, showCustomCategory = false) {
  const cleanedCustomCategory = (customCategory || '').trim();

  if (showCustomCategory) {
    return {
      category_id: null,
      custom_category: cleanedCustomCategory
    };
  }

  const parsedCategoryId = Number(categoryId);
  return {
    category_id: Number.isFinite(parsedCategoryId) && parsedCategoryId > 0 ? parsedCategoryId : null,
    custom_category: ''
  };
}

// Given either a selected `categoryId` or a user-provided `customCategory`,
// ensure the server has a canonical category id to reference. This function
// first tries to match an active category case-insensitively, and if none
// exists, inserts a new row and returns its id. `queryFn` is an injected DB
// helper (keeps this function testable and DB-agnostic).
export async function resolveCategorySelection(queryFn, categoryId, customCategory) {
  const cleanedCustomCategory = (customCategory || '').trim();

  // If the user didn't provide a custom category, just return the provided id.
  if (!cleanedCustomCategory) {
    return {
      categoryId: categoryId ? Number(categoryId) : null,
      categoryName: null
    };
  }

  // Normalise whitespace; keep casing for display but use case-insensitive
  // lookup to avoid duplicates like "plumbing" vs "Plumbing".
  const normalizedCategoryName = cleanedCustomCategory.replace(/\s+/g, ' ').trim();

  const existingRows = await queryFn(
    'SELECT category_id FROM categories WHERE LOWER(category_name) = LOWER(?) AND is_active = 1 LIMIT 1',
    [normalizedCategoryName]
  );

  if (existingRows && existingRows.length > 0) {
    return {
      categoryId: existingRows[0].category_id,
      categoryName: normalizedCategoryName
    };
  }

  // Insert a minimal, clearly marked user-defined category so admins can
  // review and optionally adjust icons/descriptions later.
  const insertResult = await queryFn(
    'INSERT INTO categories (category_name, icon_class, description, is_active) VALUES (?, ?, ?, 1)',
    [normalizedCategoryName, 'fa-star', `User-defined specialty: ${normalizedCategoryName}`]
  );

  return {
    categoryId: insertResult?.insertId || null,
    categoryName: normalizedCategoryName
  };
}
