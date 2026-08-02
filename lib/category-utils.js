export function filterCategoriesBySearch(categories = [], searchTerm = '') {
  const normalizedSearch = (searchTerm || '').trim().toLowerCase();

  if (!normalizedSearch) {
    return categories;
  }

  return categories.filter((category) => {
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

export async function resolveCategorySelection(queryFn, categoryId, customCategory) {
  const cleanedCustomCategory = (customCategory || '').trim();

  if (!cleanedCustomCategory) {
    return {
      categoryId: categoryId ? Number(categoryId) : null,
      categoryName: null
    };
  }

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

  const insertResult = await queryFn(
    'INSERT INTO categories (category_name, icon_class, description, is_active) VALUES (?, ?, ?, 1)',
    [normalizedCategoryName, 'fa-star', `User-defined specialty: ${normalizedCategoryName}`]
  );

  return {
    categoryId: insertResult?.insertId || null,
    categoryName: normalizedCategoryName
  };
}
