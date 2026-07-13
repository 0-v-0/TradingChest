/**
 * 在有序数组中二分查找最近邻值。
 * 返回最接近 `target` 且在 `tolerance` 范围内的元素索引，未找到返回 -1。
 *
 * @param sorted - 升序排列的数值数组
 * @param target - 目标值
 * @param tolerance - 最大允许差值（绝对值），默认 0（精确匹配）
 * @returns 匹配元素的索引，未找到返回 -1
 */
export function findNearestIndex(
  sorted: readonly number[],
  target: number,
  tolerance = 0,
): number {
  const len = sorted.length
  if (len === 0) return -1

  let lo = 0
  let hi = len - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid] < target) lo = mid + 1
    else hi = mid
  }

  // 检查 lo 和 lo-1，取更近的一个
  let bestIdx = -1
  let bestDist = Infinity
  for (const idx of [lo, lo - 1]) {
    if (idx >= 0 && idx < len) {
      const dist = Math.abs(sorted[idx] - target)
      if (dist <= tolerance && dist < bestDist) {
        bestDist = dist
        bestIdx = idx
      }
    }
  }
  return bestIdx
}
