type RecommendationSource = {
  sellerId: string;
  subcategoryId: string;
  commune: string;
  quartier: string;
  price: bigint;
};

type RecommendationCandidate = {
  id: string;
  sellerId: string;
  subcategoryId: string;
  commune: string;
  quartier: string;
  price: bigint;
  publishedAt: Date | null;
};

function normalized(value: string) {
  return value.trim().toLocaleLowerCase('fr');
}

export function recommendationScore(source: RecommendationSource, candidate: RecommendationCandidate) {
  const priceDifference =
    source.price > candidate.price ? source.price - candidate.price : candidate.price - source.price;
  const denominator = source.price > 0n ? source.price : 1n;
  const distanceBps = Number((priceDifference * 10_000n) / denominator);
  const priceScore = Math.max(0, 40 - Math.floor(distanceBps / 250));

  return (
    (candidate.subcategoryId === source.subcategoryId ? 100 : 0) +
    (normalized(candidate.commune) === normalized(source.commune) ? 20 : 0) +
    (normalized(candidate.quartier) === normalized(source.quartier) ? 10 : 0) +
    priceScore
  );
}

export function rankSimilarProducts<T extends RecommendationCandidate>(
  source: RecommendationSource,
  candidates: T[],
  limit: number
) {
  const ranked = [...candidates].sort((left, right) => {
    const scoreDifference = recommendationScore(source, right) - recommendationScore(source, left);
    if (scoreDifference !== 0) return scoreDifference;
    const dateDifference = (right.publishedAt?.getTime() ?? 0) - (left.publishedAt?.getTime() ?? 0);
    return dateDifference !== 0 ? dateDifference : right.id.localeCompare(left.id);
  });
  const otherSellers = ranked.filter((candidate) => candidate.sellerId !== source.sellerId);
  const sameSellerFallback = ranked.filter((candidate) => candidate.sellerId === source.sellerId);
  return [...otherSellers, ...sameSellerFallback].slice(0, limit);
}
