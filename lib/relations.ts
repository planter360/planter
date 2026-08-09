// Supabase-js returns a to-one foreign-key join either as an object or as a
// single-item array depending on how the relationship is inferred. This
// normalizes both shapes to a single object (or null).
export type OneRelation<T> = T | T[] | null

export function oneOf<T>(rel: OneRelation<T>): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}
