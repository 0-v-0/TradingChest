# K 线回放 (Bar Replay) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 实现 K 线回放功能，让交易员可以选择历史时间点，逐根 K 线前进/后退/自动播放，用于策略复盘和训练

**Architecture:** 创建 `ReplayEngine` 纯逻辑类管理回放状态（当前位置、速度、播放/暂停），通过 klinecharts 的 `applyNewData` / `updateData` API 驱动图表。UI 层添加 `ReplayControlBar` 组件提供播放控制。回放模式下断开实时数据订阅。

**Tech Stack:** KLineChart 9.x (`applyNewData`, `updateData`), Solid.js, TypeScript, Vitest

---

## 文件结构

```
新建文件:
  src/replay/                          # 回放系统
    ReplayEngine.ts                    # 核心逻辑：步进/播放/暂停/速度
    types.ts                           # ReplayState, ReplayOptions 接口
    __tests__/ReplayEngine.test.ts     # 单元测试
  src/widget/replay-bar/               # 回放控制 UI
    index.tsx                          # ReplayControlBar 组件
    index.less                         # 样式

修改文件:
  src/types.ts                         # ChartPro 接口扩展
  src/KLineChartPro.tsx                # 集成 ReplayEngine
  src/ChartProComponent.tsx            # 回放 UI 集成
  src/widget/index.tsx                 # 导出 ReplayControlBar
  src/index.ts                         # 导出 replay 模块
  src/i18n/zh-CN.ts                    # 回放相关翻译
  src/i18n/en-US.ts
```

---

## Task 1: ReplayEngine 核心逻辑

**Files:**
- Create: `src/replay/types.ts`
- Create: `src/replay/__tests__/ReplayEngine.test.ts`
- Create: `src/replay/ReplayEngine.ts`

- [x] **Step 1: 创建类型定义**

> 实现代码：[`src/replay/types.ts`](src/replay/types.ts) (1-17 行)

- [x] **Step 2: 编写测试**

> 实现代码：[`src/replay/__tests__/ReplayEngine.test.ts`](src/replay/__tests__/ReplayEngine.test.ts) (1-193 行)

- [x] **Step 3: 运行测试确认失败**

Run `npx vitest run src/replay/__tests__/ReplayEngine.test.ts` — expected: FAIL (module not found)

- [x] **Step 4: 实现 ReplayEngine**

> 实现代码：[`src/replay/ReplayEngine.ts`](src/replay/ReplayEngine.ts) (1-100 行)

- [x] **Step 5: 运行测试确认通过**

Run: `npx vitest run src/replay/__tests__/ReplayEngine.test.ts`
Expected: PASS

- [x] **Step 6: Commit**

git add src/replay/
git commit -m "feat: add ReplayEngine for bar-by-bar chart replay"

---

## Task 2: ReplayControlBar UI 组件

**Files:**
- Create: `src/widget/replay-bar/index.tsx`
- Create: `src/widget/replay-bar/index.less`
- Modify: `src/widget/index.tsx` (add export)

- [x] **Step 1: 创建样式文件**

> 样式实现：[`src/widget/replay-bar/index.css`](src/widget/replay-bar/index.css) (1-62 行)

- [x] **Step 2: 创建组件**

> 实现代码：[`src/widget/replay-bar/index.tsx`](src/widget/replay-bar/index.tsx) (1-93 行)

- [x] **Step 3: 在 widget/index.tsx 添加导出**

在 `src/widget/index.tsx` 中添加:
> 实现代码：[`src/widget/index.tsx`](src/widget/index.tsx) (1-30 行)

- [x] **Step 4: 运行构建**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 5: Commit**

git add src/widget/replay-bar/ src/widget/index.tsx
git commit -m "feat: add ReplayControlBar UI component"

---

## Task 3: i18n 翻译

**Files:**
- Modify: `src/i18n/zh-CN.ts`
- Modify: `src/i18n/en-US.ts`

- [x] **Step 1: 读取两个 i18n 文件，添加回放相关翻译**

zh-CN 添加:
```
replay: '回放',
replay_back: '后退一根',
replay_forward: '前进一根',
replay_speed: '播放速度',
replay_exit: '退出回放',
replay_start: '开始回放',
```

en-US 添加:
```
replay: 'Replay',
replay_back: 'Step Back',
replay_forward: 'Step Forward',
replay_speed: 'Speed',
replay_exit: 'Exit Replay',
replay_start: 'Start Replay',
```

- [x] **Step 2: 运行构建**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 3: Commit**

git add src/i18n/
git commit -m "feat: add bar replay i18n translations"

---

## Task 4: 集成到 ChartPro API

**Files:**
- Modify: `src/types.ts`
- Modify: `src/KLineChartPro.tsx`
- Modify: `src/ChartProComponent.tsx`
- Modify: `src/index.ts`

- [x] **Step 1: 扩展 ChartPro 接口**

> 实现代码：[`src/types.ts`](src/types.ts) (1-150 行)

- [x] **Step 2: 在 KLineChartPro 中实现**

> 实现代码：[`src/KLineChartPro.tsx`](src/KLineChartPro.tsx) (1-491 行)

- [x] **Step 3: 在 index.ts 导出**

> 实现代码：[`src/index.ts`](src/index.ts) (1-81 行)

- [x] **Step 4: 运行构建**

Run: `npm run build-core`
Expected: 构建成功

- [x] **Step 5: 运行全部测试**

Run: `npx vitest run`
Expected: 全部 PASS

- [x] **Step 6: Commit**

git add src/types.ts src/KLineChartPro.tsx src/ChartProComponent.tsx src/index.ts
git commit -m "feat: integrate ReplayEngine into ChartPro API"

---

## Task 5: 全量验证

- [x] **Step 1: 运行完整测试**

Run: `npx vitest run`
Expected: All PASS

- [x] **Step 2: 运行完整构建**

Run: `npm run build`
Expected: 构建成功

- [x] **Step 3: Commit (if needed)**

git add -A
git commit -m "chore: verify bar replay build and test suite"
