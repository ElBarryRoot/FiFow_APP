function cleanText(value, maxLength = 180) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

/**
 * Produces an intentionally conservative starting point. It only repeats
 * information already selected by the seller and leaves product-specific
 * facts for the seller to confirm.
 */
export function buildLocalDescriptionDraft({ title, categoryName, subcategoryName, conditionLabel }) {
  const safeTitle = cleanText(title, 140)
  const safeCategory = cleanText(categoryName, 80)
  const safeSubcategory = cleanText(subcategoryName, 80)
  const safeCondition = cleanText(conditionLabel, 80)
  const categoryPath = [safeCategory, safeSubcategory].filter(Boolean).join(' - ')

  const lines = [
    safeTitle ? `Je vends ${safeTitle}.` : 'Je vends cet article.',
    safeCondition ? `État indiqué : ${safeCondition}.` : '',
    categoryPath ? `Catégorie : ${categoryPath}.` : '',
    'Caractéristiques à compléter : [modèle, taille, dimensions ou informations utiles].',
    'Accessoires inclus et éventuels défauts : [à préciser honnêtement].',
    'Écrivez-moi dans Fi Fow pour toute question et pour confirmer la remise.',
  ].filter(Boolean)

  return lines.join('\n\n')
}
