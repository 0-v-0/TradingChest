/**
 * 在有序数组中二分查找最近邻值。
 * 返回最接近 `target` 且在 `tolerance` 范围内的元素索引，未找到返回 -1。
 *
 * @param sorted - 升序排列的数值数组，或对象数组（需提供 accessor）
 * @param target - 目标值
 * @param tolerance - 最大允许差值（绝对值），默认 0（精确匹配）
 * @param accessor - 当 sorted 为对象数组时，用于提取数值的访问器函数
 * @returns 匹配元素的索引，未找到返回 -1
 */
export function findNearestIndex<T>(
  sorted: readonly T[],
  target: number,
  tolerance = 0,
  accessor?: (item: T) => number,
): number {
  const len = sorted.length
  if (len === 0) return -1

  const get = accessor ?? ((item: T) => item as unknown as number)

  let lo = 0
  let hi = len - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (get(sorted[mid]) < target) lo = mid + 1
    else hi = mid
  }

  // 比较 lo 和 lo-1，取更近且在 tolerance 范围内的
  if (
    lo > 0 &&
    Math.abs(get(sorted[lo - 1]) - target) <= Math.abs(get(sorted[lo]) - target)
  ) {
    return Math.abs(get(sorted[lo - 1]) - target) <= tolerance ? lo - 1 : -1
  }
  return Math.abs(get(sorted[lo]) - target) <= tolerance ? lo : -1
}
