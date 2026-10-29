# CIBE 实现与 MiroFish 复用明细

修改日期：2026 年 10 月 28 日。

## 实际复用的代码

上游项目 https://github.com/666ghj/MiroFish

锁定版本 7657031ac01184afe2cb220f5ee3545573b5e843

源文件 frontend/src/components/GraphPanel.vue

源地址 https://github.com/666ghj/MiroFish/blob/7657031ac01184afe2cb220f5ee3545573b5e843/frontend/src/components/GraphPanel.vue#L500

- getLinkPath（上游第 500–536 行）：生成直线、二次曲线或自环的 SVG 路径。
- getLinkMidpoint（上游第 539–569 行）：计算曲线中点，用于标签和连线标记位置。

两个函数位于 vendor/mirofish-graph-geometry.js，实际用于 CIBE 的人生路径和动态关系图。适配时提取为独立 ES 模块，去除对 Vue 组件上下文的需要，并增加重合节点除零保护。保留上游注释与来源。

## 为 CIBE 新写的内容

1. 全部界面布局、色彩、字体层级和响应式设计。
2. 三步问卷，收集现状、未来意象、升学、工作与选择。
3. 个人编号、本地保存、档案导出与导入。
4. 根据玩家输入生成六阶段人生的本地情景规则。
5. 选择改写、后续节点更新、父分支与历史记录。
6. 原始人生和分支的并排对照。
7. 人生报告、打印与文字下载。
8. 原生 SVG 力导向布局、持续动画、拖拽与缩放、暂停、关系标签，以及根据人生内容生成关联节点。力模拟代码为 CIBE 新实现，未复制 MiroFish 的 D3 布局组件。
9. 导入数据校验、键盘操作与减少动态效果偏好支持。
10. 根据最新用户视频设计的 Three.js 光影隧道开场，以及五份人生档案袋从堆叠到竖直再到并排展开的空间动画。场景几何、纸张纹理、绳扣、档案标签、鼠标视差和滚动控制均为新实现。开场按参考构图与运动特征重建，并非原网页源码或原视频逐像素复刻，未嵌入或上传用户视频。
11. 根据原版视频补充白底人手与机械手开场：透明手部图由内置 image_gen 参照构图重新生成，CSS 分离左右两侧，控制入场、轻微浮动、暂停和移动端构图。不会把位图动画表述为可旋转的三维手部模型。
12. 参照用户提供的 MiroFish 界面截图，新写全屏人生工作台，包含顶部三种视图切换、左侧点阵动态图、右侧编号操作卡片、节点与连线统计，以及底部探索记录。没有新增复用 MiroFish 的界面源代码；统计对应实际档案，记录不模拟不存在的模型运行过程。
13. CIBE 独立本机后台直接连接 GPT-6 Astra：输入问卷生成人生，修改节点后推演后续故事，保留先前经历与原路径，并输出因果关系、取舍、假设与反思问题。包含真实任务状态、失败提示、结果结构校验、历史保护及 AI 档案导入导出。
14. 节点分批推演与预览，完整报告首次打开时生成并按路径缓存；刷新恢复页面、表单草稿与未完成任务，避免刷新重复提交。升级兼容后台保留现有网页地址与本地档案。
15. 模型输出采用 JSON Schema 约束与最终结果文件读取，兼容格式包装，保留严格内容校验；格式错误仅自动重试当前批次一次。
16. 速度优化保留 GPT-6 Astra，采用 low 思考强度，精简重复上下文；先展示第一个受影响节点，再用一次请求生成其余节点，完整初始人生从三次模型请求减为两次。
17. 经用户确认优先速度，实测后将默认模型切换为 GPT-6.1 Terra low。兼容已有 Astra 人生档案，节点与报告分别保留实际模型标注。修复推演中全局点击拦截误阻止「展开故事」的问题，仍限制重复提交和切换档案。

## 复用观图研究版的模型连接

`server/codex-bridge.cjs` 改编自用户此前观图研究版 v0.3 的本机连接模块。使用官方 Codex CLI 的现有 ChatGPT 登录，通过独立请求调用模型，当前默认为 GPT-6.1 Terra，不读取或复制登录密钥。为 CIBE 设置专用推演指令、关闭工具操作与工作区指令加载。网页和后台在本机，模型运算在云端。`server/life-service.mjs` 与 `dist/ai-client.js` 为本次 CIBE 新增实现。

## 手部开场的视觉参考

用户提供小红书笔记 https://www.xiaohongshu.com/explore/678dd72b0000000019033c22 。对应原设计师 Mariusz Mitkow 的 MachinaFusion 概念作品：https://dribbble.com/shots/25472468-MachinaFusion-Website 。原作者视频：https://www.linkedin.com/posts/mariusz-mitkow-2745961b2_motion-animation-3d-activity-7284531725785833472-4K-n 。

参考其人手与金属机械手指尖相向的构图，网页中的 `assets/human-robot-hands.png` 为重新生成的透明素材，不是原作品的独立图片、模型或源代码。原视频只供分析，不包含在发布文件中。生成模式、素材路径与最终提示词见 `assets/hands-generation.txt`。

## Three.js

使用官方 npm 包 three@0.180.0 的 three.module.js 与 three.core.js，未经修改，以本地文件形式提供，运行时无需 CDN。库使用 MIT 许可，全文见 vendor/THREE-LICENSE.txt。官方项目 https://github.com/mrdoob/three.js/tree/r180 。CIBE 的场景、材质、卡片图案和交互代码是新实现。

## 参考但未接入的部分

参考 MiroFish 的「输入资料—构建关系—模拟—报告—继续交互」工作流程。未复制或接入上游的 API 客户端、Python 后台、LLM 调用、Zep 图数据库、OASIS 多智能体社会模拟或 ReportAgent。

本机版本的新故事和报告默认由 GPT-6.1 Terra 生成，旧档案保留 Astra 来源；初始示例仍是明确标注的本地规则演示。两者均不来自 MiroFish 后台。动态关系网络的运动是前端物理布局与动画，模型任务状态在单独的推演面板中展示。

## 许可

MiroFish 使用 GNU Affero General Public License v3.0。完整许可保留在 LICENSE.txt。CIBE 本版源代码同样按 GNU AGPL v3 提供，页面的「下载完整网页源码」链接提供本版对应源码与运行说明。

CIBE 新增代码 Copyright (C) 2026 CIBE contributors。
MiroFish 上游版权及声明依原项目保留。



完整人生与引导更新：新档案以六个宽跨度阶段覆盖当下至晚年，年龄是故事锚点而非寿命预测。旧档案仍可读取、改写；从原始信息重新推演会创建独立档案，原分支保留。工作台提供逐阶段阅读、改写、对照和报告引导。需后台 revision 6。
