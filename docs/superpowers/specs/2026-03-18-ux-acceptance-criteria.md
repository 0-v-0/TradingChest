# TradingChest UX 验收标准

> **Last updated**: 2026-07-10 | **Version**: 0.5.3

基于 TradingView 图表 UX 对比分析制定。所有项目必须通过才算达标。

## A. 指标面板 UX（6 项）

- [x] A1: 搜索框实时过滤（onInput，不是 onChange）— ✅ 已验证
- [x] A2: 分类 Tab 可切换过滤（趋势/波动率/成交量/动量/其他）— ✅ 已验证
- [x] A3: 分类 Tab 有视觉区分（active 状态蓝色高亮、hover 效果）— ✅ CSS 已实现
- [x] A4: 搜索框有搜索图标、清除按钮 — ✅ Input 组件 prefix 插槽嵌入搜索 SVG 图标，suffix 条件渲染圆形清除按钮，onClick 清空搜索文本
- [x] A5: 指标列表中已选指标有明显的 ✓ 勾选标记 — ✅ 蓝色勾选标记已确认
- [x] A6: 面板打开时自动聚焦搜索框 — ✅ onMount focus 已实现

## B. 绘图工具 UX（5 项）

- [x] B1: 文字标注/便签/标注气泡 — 放置后弹出文字输入 — ✅ prompt 对话框已验证
- [x] B2: 右键编辑已放置的文字标注 — ✅ onRightClick 已实现
- [x] B3: 绘图工具图标有 tooltip 提示工具名称 — ✅ title 属性 + CSS ::after 已实现
- [x] B4: 选中绘图工具后光标变为十字 — ✅ chart 容器添加 `klinecharts-pro-drawing` CSS class，cursor: crosshair
- [x] B5: 删除绘图时有视觉反馈 — ✅ 属性栏删除按钮 flash 动画（150ms 红色闪烁）

## C. 设置面板 UX（4 项）

- [x] C1: 蜡烛颜色自定义（涨/跌颜色）— ✅ ColorInput 组件已实现（原生 `<input type="color">` + 色块预览）
- [x] C2: 背景颜色自定义 — ✅ ColorInput 组件可配置
- [x] C3: 十字光标样式选择（显示/水平线/垂直线独立开关）— ✅ 已实现
- [x] C4: 设置项分组（蜡烛设置/坐标轴/网格与十字光标）— ✅ 已实现 3 个分组

## D. 整体视觉 UX（5 项）

- [x] D1: 指标面板模态框 CSS 样式与整体风格一致 — ✅ 原生 CSS 已实现
- [x] D2: 左侧绘图工具栏图标 hover 时有背景高亮 — ✅ 原有 CSS 已支持
- [x] D3: 当前选中的绘图工具有 active 状态指示 — ✅ .selected CSS 已支持
- [x] D4: 指标 tooltip 面板图标正确显示 — ✅ 已验证（显隐/设置/关闭图标工作正常）
- [x] D5: 暗色主题下所有新增 UI 元素颜色协调 — ✅ 使用 CSS 变量，随主题自动适配

## E. 功能完整性（4 项）

- [x] E1: 新增指标选中后正确创建子面板并显示数据 — ✅ ATR/MACD/RSI 已验证
- [x] E2: 新增绘图工具能正常绘制 — ✅ 文字标注、测量工具已验证
- [x] E3: 分类 Tab 切换后列表正确过滤 — ✅ "动量" Tab 已验证
- [x] E4: 指标参数设置面板可以修改自定义指标参数 — ✅ indicator-setting-modal 已实现（支持 26+ 指标的参数配置）

## 通过统计

**已通过: 24/24 (100%) ✅ 全部达标**

所有项目已通过。A4（搜索框图标/清除按钮）、B4（绘图十字光标）、B5（删除反馈）已于 2026-07-10 UX Enhancement 中实现（详见 [2026-07-10-ux-enhancement-design.md](./2026-07-10-ux-enhancement-design.md)）。

## 验收方式

每个项目通过 Playwright 实际操作验证 + 截图确认。
