export const DEFAULT_BRAND = '#2E9E5B'

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.04045) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

// Mateixa mescla que --color-brand-strong a globals.css (75% del color,
// 25% negre, en sRGB): és el fons real dels botons amb text blanc.
export function brandStrong(hex: string): string {
  return '#' + channels(hex).map((c) => Math.round(c * 0.75).toString(16).padStart(2, '0')).join('')
}

export function contrastWithWhite(hex: string): number {
  return 1.05 / (luminance(channels(hex)) + 0.05)
}

// WCAG AA per a text normal: 4.5:1. Colors molt clars (grocs, pastels)
// no passen ni enfosquits, i el text blanc dels botons no es llegiria.
export function isUsableBrand(hex: string): boolean {
  return isHexColor(hex) && contrastWithWhite(brandStrong(hex)) >= 4.5
}
