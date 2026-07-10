# TradingChest 技术指标扩展设计

**Date**: 2026-07-10
**Status**: 已实施
**Scope**: 新增 10 个自定义指标 + 扩展 PIVOTPOINTS，将总指标数从 70 提升到 80+
**Current**: 27 内置 + 43 自定义 = 70
**Target**: 80+ (需新增 10+) ✅ 达成

---

## 新增指标清单

### 1. Chande Kroll Stop（趋势） ✅

**文件**: `src/indicator/trend/chandeKrollStop.ts`

**算法**:
- 计算最高价和最低价的 Rolling Max/Min（period P）
- 步止损 = Rolling Max - X * ATR(P)
- 步止损 = Rolling Min + X * ATR(P)
- 再对两条线分别做 Q 周期 RMA 平滑

**参数**: `calcParams: [10, 2, 9]` — P(lookback), X(ATR multiplier), Q(RMA period)

**输出**:
```ts
figures: [
  { key: 'longStop', title: '多头止损: ', type: 'line' },
  { key: 'shortStop', title: '空头止损: ', type: 'line' },
]
```

**依赖工具函数**: `calcTR`, `calcRMA`, `calcHighest`, `calcLowest`

---

### 2. Qstick（趋势） ✅

**文件**: `src/indicator/trend/qstick.ts`

**算法**: Qstick = SMA(close - open, period)
- 正值表示买方主导（收盘>开盘），负值表示卖方主导

**参数**: `calcParams: [14]`

**输出**:
```ts
figures: [
  { key: 'qstick', title: 'Qstick: ', type: 'bar' },
]
```

**依赖工具函数**: `calcSMA`

---

### 3. Rainbow MA（趋势） ✅

**文件**: `src/indicator/trend/rainbowMa.ts`

**算法**: 递归 SMA 堆叠
- Level 1 = SMA(close, period)
- Level 2 = SMA(Level1, period)
- ...递归 depth 次

**参数**: `calcParams: [2, 10]` — depth(递归层数), period(SMA周期)

**输出**:
```ts
figures: [
  { key: 'ma1', title: 'MA1: ', type: 'line' },
  { key: 'ma2', title: 'MA2: ', type: 'line' },
  { key: 'ma3', title: 'MA3: ', type: 'line' },
  { key: 'ma4', title: 'MA4: ', type: 'line' },
  { key: 'ma5', title: 'MA5: ', type: 'line' },
  { key: 'ma6', title: 'MA6: ', type: 'line' },
]
```

**依赖工具函数**: `calcSMA`

**实现备注**: depth 上限为 6（MAX_LEVELS），不足 6 层时未使用的 figure 输出 undefined

---

### 4. Linear Regression Forecast（趋势） ✅

**文件**: `src/indicator/trend/linearRegressionForecast.ts`

**说明**: 与现有 `LINEARREGRESSION` 不同，Forecast 版本只输出回归线和预测延伸，不画标准差通道。

**算法**:
- 最小二乘法拟合 y = a + b*x
- 输出回归拟合值（每个点）和斜率方向

**参数**: `calcParams: [14]`

**输出**:
```ts
figures: [
  { key: 'forecast', title: '预测: ', type: 'line' },
  { key: 'slope', title: '斜率: ', type: 'line' },
]
```

**依赖工具函数**: 无（内联最小二乘法）

---

### 5. Standard Error（波动率） ✅

**文件**: `src/indicator/volatility/standardError.ts`

**算法**:
- 计算线性回归的标准误 SE = √(Σ(y-ŷ)² / (n-2))
- SE 衡量价格偏离回归线的程度，值越大波动越剧烈

**参数**: `calcParams: [14]`

**输出**:
```ts
figures: [
  { key: 'se', title: 'SE: ', type: 'line' },
]
```

**依赖工具函数**: 无（内联回归计算逻辑）

---

### 6. Correlation Coefficient（其他） ✅

**文件**: `src/indicator/other/correlationCoefficient.ts`

**算法**:
- 皮尔逊相关系数 r = Σ((xi-x̄)(yi-ȳ)) / √(Σ(xi-x̄)² × Σ(yi-ȳ)²)
- x = close, y = volume（默认），衡量价格与成交量的相关性
- 输出范围 [-1, 1]

**参数**: `calcParams: [14]`

**输出**:
```ts
figures: [
  { key: 'r', title: 'Corr: ', type: 'line' },
]
```

**依赖工具函数**: 无（内联均值和方差计算）

---

### 7. Connors RSI（动量） ✅

**文件**: `src/indicator/momentum/connorsRsi.ts`

**算法**:
- RSI(close, period) — 标准 RSI
- Streak RSI(连续涨跌天数, streakPeriod) — 对连续涨/跌计数做 RSI
- Percent Rank(当日涨跌, rankPeriod) — 涨跌幅在过去 N 日中的百分位
- ConnorsRSI = (RSI + StreakRSI + PercentRank) / 3

**参数**: `calcParams: [3, 2, 100]` — rsiPeriod, streakRsiPeriod, rankPeriod

**输出**:
```ts
figures: [
  { key: 'crsi', title: 'CRSI: ', type: 'line' },
]
```

**依赖工具函数**: `calcRMA`（用于 RSI 计算）

**实现备注**: Streak RSI 对 streak 绝对值做 RSI 计算；涨跌为 0 时 streak 不变

---

### 8. Ehlers Leading Indicator（动量） ✅

**文件**: `src/indicator/momentum/ehlersLeadingIndicator.ts`

**算法**（John Ehlers）:
- 对 close 做 2-pole Butterworth 高通滤波（移除低频趋势）
- 对滤波结果做 EMA 平滑（周期 = round(period/2)）
- 计算导数（一阶差分）作为领先信号
- Lead = Smooth + K * Derivative

**参数**: `calcParams: [10, 1.0]` — period, K(导数增益系数)

**输出**:
```ts
figures: [
  { key: 'lead', title: 'Lead: ', type: 'line' },
  { key: 'signal', title: 'Signal: ', type: 'line' },
]
```

**依赖工具函数**: `calcEMA`

---

### 9. Williams %R 独立版（动量） ✅

**文件**: `src/indicator/momentum/williamsR.ts`

**说明**: klinecharts 内置的 WR 与其他指标共享命名空间，独立版提供更好的参数控制和 UI 展示。

**算法**: %R = (HighestHigh - Close) / (HighestHigh - LowestLow) × (-100)
- 范围 [-100, 0]，超买区 < -20，超卖区 > -80

**参数**: `calcParams: [14]`

**输出**:
```ts
figures: [
  { key: 'wr', title: '%R: ', type: 'line' },
]
```

**依赖工具函数**: `calcHighest`, `calcLowest`

---

### 10. Volume Oscillator（成交量） ✅

**文件**: `src/indicator/volume/volumeOscillator.ts`

**算法**:
- VO = EMA(volume, fastPeriod) - EMA(volume, slowPeriod)

**参数**: `calcParams: [14, 28]` — fastPeriod, slowPeriod

**输出**:
```ts
figures: [
  { key: 'vo', title: 'VO: ', type: 'bar' },
]
```

**依赖工具函数**: `calcEMA`

**实现备注**: 未使用百分比形式，仅输出差值

---

## PIVOTPOINTS 扩展 ✅

**文件**: `src/indicator/other/pivotPoints.ts`（已修改）

**方案**: 新增 `calcParams: [0]`
- `0` = Standard（现有逻辑）
- `1` = Fibonacci
- `2` = Camarilla

**Fibonacci Pivot Points**:
```
P = (H + L + C) / 3
R1 = P + 0.382 * (H - L)
R2 = P + 0.618 * (H - L)
R3 = P + 1.000 * (H - L)
S1 = P - 0.382 * (H - L)
S2 = P - 0.618 * (H - L)
S3 = P - 1.000 * (H - L)
```

**Camarilla Pivot Points**:
```
P = (H + L + C) / 3
R1 = C + 1.1 * (H - L) / 12
R2 = C + 1.1 * (H - L) / 6
R3 = C + 1.1 * (H - L) / 4
S1 = C - 1.1 * (H - L) / 12
S2 = C - 1.1 * (H - L) / 6
S3 = C - 1.1 * (H - L) / 4
```

**indicator-setting-modal 配置**: 在 `src/widget/indicator-setting-modal/data.ts` 中为 PIVOTPOINTS 添加参数配置：
```ts
PIVOTPOINTS: [
  { paramNameKey: 'pivot_type', precision: 0, min: 0, max: 2, default: 0 },
]
```

---

## 文件变更汇总

| 文件 | 操作 | 状态 | 说明 |
|------|------|------|------|
| `src/indicator/trend/chandeKrollStop.ts` | **NEW** | ✅ | Chande Kroll Stop |
| `src/indicator/trend/qstick.ts` | **NEW** | ✅ | Qstick |
| `src/indicator/trend/rainbowMa.ts` | **NEW** | ✅ | Rainbow MA |
| `src/indicator/trend/linearRegressionForecast.ts` | **NEW** | ✅ | Linear Regression Forecast |
| `src/indicator/volatility/standardError.ts` | **NEW** | ✅ | Standard Error |
| `src/indicator/momentum/connorsRsi.ts` | **NEW** | ✅ | Connors RSI |
| `src/indicator/momentum/ehlersLeadingIndicator.ts` | **NEW** | ✅ | Ehlers Leading Indicator |
| `src/indicator/momentum/williamsR.ts` | **NEW** | ✅ | Williams %R |
| `src/indicator/volume/volumeOscillator.ts` | **NEW** | ✅ | Volume Oscillator |
| `src/indicator/other/correlationCoefficient.ts` | **NEW** | ✅ | Correlation Coefficient |
| `src/indicator/other/pivotPoints.ts` | MODIFY | ✅ | 添加 Fibonacci/Camarilla 模式 |
| `src/indicator/loaders.ts` | MODIFY | ✅ | 添加 10 个新 loader |
| `src/indicator/index.ts` | MODIFY | ✅ | 在 indicatorCategories 中添加新指标名 |
| `src/widget/indicator-setting-modal/data.ts` | MODIFY | ✅ | 添加新指标的参数配置 |
| `src/i18n/*.ini` | MODIFY | ✅ | 4 个语言文件添加指标名称 i18n key |

---

## 指标分类更新后的数量

| 类别 | 现有 | 新增 | 合计 |
|------|------|------|------|
| 趋势 | 21 (含内置) | +4 | 25 |
| 波动率 | 9 | +1 | 10 |
| 成交量 | 12 | +1 | 13 |
| 动量 | 26 | +3 | 29 |
| 其他 | 2 | +1 (独立) + 扩展 | 3 |
| **自定义合计** | 43 | +10 | 53 |
| **内置** | 27 | — | 27 |
| **总计** | 70 | +10 | **80** |

---

## i18n Keys ✅

| Key | zh-CN | en-US | ja | ko |
|-----|-------|-------|----|----|
| `indicator_ChanDeKrollStop` | 钱德勒克罗止损 | Chande Kroll Stop | チャンドクロールストップ | 챈드크롤 스톱 |
| `indicator_Qstick` | Q棒指标 | Qstick | Qスティック | Q스틱 |
| `indicator_RainbowMA` | 彩虹均线 | Rainbow MA | レインボーMA | 레인보우 MA |
| `indicator_LinearRegressionForecast` | 线性回归预测 | LinReg Forecast | 線形回帰予測 | 선형회귀 예측 |
| `indicator_StandardError` | 标准误差 | Standard Error | 標準誤差 | 표준 오차 |
| `indicator_CorrelationCoefficient` | 相关系数 | Correlation Coeff | 相関係数 | 상관계수 |
| `indicator_ConnorsRSI` | 康纳斯RSI | Connors RSI | コナーズRSI | 코너스 RSI |
| `indicator_EhlersLeading` | 埃勒斯领先指标 | Ehlers Leading | エラーズリーディング | 엘러스 리딩 |
| `indicator_WilliamsR` | 威廉指标 | Williams %R | ウィリアムズ%R | 윌리엄스 %R |
| `indicator_VolumeOscillator` | 成交量震荡 | Volume Oscillator | 出来高オシレーター | 거래량 오실레이터 |
| `param_pivot_type` | 轴心类型 | Pivot Type | ピボットタイプ | 피벗 유형 |
| `pivot_standard` | 标准 | Standard | スタンダード | 스탠다드 |
| `pivot_fibonacci` | 斐波那契 | Fibonacci | フィボナッチ | 피보나치 |
| `pivot_camarilla` | 卡米拉 | Camarilla | カマリラ | 카마리야 |

---

## 实施偏差

| 项目 | 设计 | 实际 | 原因 |
|------|------|------|------|
| Volume Oscillator | 提及百分比形式 | 仅差值形式 | 差值形式更常用，避免 EMA_slow 为 0 时的除零问题 |
| Correlation Coefficient | 依赖 calcSMA | 内联计算 | 无需 SMA，直接在滑动窗口内计算均值和协方差更直接 |
| Rainbow MA depth | 未限上限 | 限制 MAX_LEVELS=6 | figures 固定 6 条线，depth 超过 6 无意义 |
| PIVOTPOINTS | calcParams: [0] | 同设计 | — |

---

## 验证

- [x] TypeScript 类型检查通过 (`tsc --noEmit`)
- [x] Vite 生产构建通过 (`vite build`)
