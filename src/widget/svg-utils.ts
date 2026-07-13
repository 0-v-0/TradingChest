/**
 * SVG 图表组件共享工具函数
 */

/** 判断值是否为有限数字 */
export const finite = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/** 将坐标点数组转换为 SVG path 的 d 属性 */
export const pathFromPoints = (points: ReadonlyArray<[number, number]>): string =>
  points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')
