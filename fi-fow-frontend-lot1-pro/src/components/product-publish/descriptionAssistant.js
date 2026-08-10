function cleanText(value, maxLength = 180) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function wordCount(value) {
  return String(value || '').match(/\S+/gu)?.length || 0
}

function limitWords(value, maxWords) {
  return String(value || '').match(/\S+/gu)?.slice(0, maxWords).join(' ') || ''
}

function lowerCaseFirst(value) {
  return value ? `${value.charAt(0).toLocaleLowerCase('fr-FR')}${value.slice(1)}` : ''
}

/**
 * Produces a concise starting point from information selected by the seller.
 * The result stays within 24 words and never invents product characteristics.
 */
export function buildLocalDescriptionDraft({ title, conditionLabel }) {
  const safeCondition = lowerCaseFirst(limitWords(cleanText(conditionLabel, 80), 4)) || 'bon état'
  const ending = `en ${safeCondition}, propre et prêt à l’emploi. Contactez-moi via Fi Fow pour convenir de la remise.`
  const titleWordsAvailable = Math.max(1, 24 - wordCount(ending))
  const safeTitle = limitWords(cleanText(title, 140), titleWordsAvailable) || 'Cet article'

  return `${safeTitle} ${ending}`
}
