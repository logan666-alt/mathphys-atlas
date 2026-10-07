# 物理可视化：交互演示资源库

按学科、知识点和问题查找精选交互演示，逐步扩充理论力学、电动力学、量子力学、热力学与统计物理，并保留通用数学工具。当前 3.2 版收录 14 个演示，包括 12 个外部演示、约束曲面与偏导链式关系两个本站原创专题。首页直接进入搜索与分类；外部演示可从卡片直接打开。

## 打开网站

在线试用：[物理可视化](https://logan666-alt.github.io/mathphys-atlas/)。公开代码：[GitHub 仓库](https://github.com/logan666-alt/mathphys-atlas)。访问网站无需登录 GitHub；中国大陆直连效果需在实际网络下试用。

本项目是静态网站：页面、样式和资源目录都是本地文件，不需要数据库。为了让浏览器正确读取目录，请通过本地预览服务打开，不要直接双击 `dist/index.html`。

Node.js 是执行预览服务的程序；本项目要求 22 或更新版本。本机实际使用 Codex 附带的 Node.js 24，启动文件会优先查找系统 Node，再查找本机已核实的 Codex 附带位置。无需安装 npm 或其他软件包；换电脑后若两处都没有 Node，须先安装 Node.js。

1. 在 Windows 中双击 `start-preview.cmd`。
2. 保持新打开的窗口运行，在浏览器访问 **http://127.0.0.1:4173/**。
3. 关闭服务时，在该窗口按 Ctrl+C。若端口已被本项目占用，直接访问现有网址即可。

也可以在本项目目录打开终端，执行：

```powershell
node server.mjs
```

`127.0.0.1` 只指这台电脑；分享网站请使用上方在线网址。第三方原站演示需要网络；本站页面、公式字体和中文导读不依赖外部 CDN。

## 发布到 GitHub Pages

`main` 分支保存完整项目，`gh-pages` 分支仅保存 `dist` 中供浏览器加载的网页文件。GitHub Pages 从 `gh-pages` 分支的根目录发布。更新 `main` 后，需同步发布网页分支，线上内容才会更新：

```powershell
node scripts/check.mjs
node --test scripts/lab.test.cjs scripts/v3.test.cjs
git add .
git commit -m "Update physics visualizations"
git push origin main
git subtree push --prefix dist origin gh-pages
```

GitHub 完成网页发布后，原有网站地址即可加载新内容。

## 文件在哪里

| 文件 / 目录 | 用途 |
| --- | --- |
| `dist/catalog.json` | 所有资源、中文导读、学科、知识点分类、教材映射及待补事项 |
| `dist/app.js` | 页面组件、搜索、筛选、页面切换、原创 SVG 概念图 |
| `dist/styles.css`、`v3.css` | 基础布局，以及对照表、快照链接和预测题卡布局 |
| `dist/compare.js` | 对照页、资源选择与三组推荐组合，正文直接从目录读取 |
| `dist/thermo/page.js`、`chain.js`、`chain.css` | 偏导链式关系专题、分步播放、位移分解与路径对照 |
| `dist/constraint/page.js` | 约束曲面专题的数学推导、几何解释与站内演示入口 |
| `dist/constraint/surface.js`、`surface.css` | P、V、T 状态曲面、截线、切平面、投影及链接状态恢复 |
| `dist/operation-cards.css` | 操作卡、中英文控件词典、可编辑问题记录的布局 |
| `dist/lab/physics.js` | 原创六模态解析模型，可独立运行数学检查 |
| `dist/lab/ui.js`、`lab.css` | 实验室控件、SVG 曲线、模态系数图和手机布局 |
| `dist/lab/state.js` | 实验链接格式、数值范围验证与恢复 |
| `dist/lab/inquiries.js` | 三个原创预测实验的条件、选项、解释和关联资源 |
| `dist/lab/activities.js` | 题卡、实验链接与能量读数界面 |
| `dist/index.html` | 网站入口、导航与基础信息 |
| `dist/vendor/katex/` | 本地公式排版程序、字体、许可证 |
| `server.mjs` | 仅本机可访问的预览服务 |
| `scripts/check.mjs` | 目录完整性、引用、重复项、公式与静态文件检查 |
| `docs/verification.md` | 人工操作记录、界面检查与尚未完成事项 |
| `docs/link-check.json` | 链接请求结果，包括失败记录和替代入口 |
| `scripts/lab.test.cjs` | 初值、边界、PDE、周期、衰减、叠加、能量及排版的 9 项检查 |
| `docs/verification-v2.md` | 第二版核验范围、实操读数、限制与待办 |
| `docs/link-check-v2.json` | 第二版资源、说明和备用链接的请求记录 |
| `scripts/v3.test.cjs` | 实验链接、能量读数、预测结论与资源对照的新增检查 |
| `docs/verification-v3.md`、`link-check-v3.json` | 第三版核验、限制与 25 个链接请求结果 |

## 新增一条资源

JSON 是“字段名 + 内容”的结构化文本。它让内容独立于页面：只要新增目录条目，列表、搜索和详情就会自动更新。推荐使用支持 JSON 提示的编辑器修改。

1. 复制 `catalog.json` 的 `resources` 数组中一条结构接近的资源。设定唯一的英文短标识 `id`；不要给同一原站页面制造重复条目。
2. 填写标题、原名、来源、署名、具体演示 URL、说明 URL、备用目录、学科、知识点、先修与深度。保留完整的中文读图说明、公式符号、三个任务、思考题解释和模型限制。
3. 阅读原站说明并尽可能实际操作，逐步填写 `steps[].evidence`。将 `verification.interaction` 设为 `tested`（主要操作已实测）、`partial`（部分操作核验）或 `docs`（仅阅读）；日期与记录必须真实。`tested` 不表示全部参数和数值精度均通过检查。
4. `topics` 填已有分类的 `id`。需要新分类时，先在顶层 `topics` 添加，`kind` 用 `method`（数学方法）或 `application`（应用问题），并填入中文与英文别名 `aliases`。没有资源的分类会自动隐藏。每条资源的 `subjects` 填顶层 `subjects` 中的学科 `id`，可填多个；学科与知识点分别筛选。
5. 教材章节只填已查证的目录内容。`mappings[].source` 必须关联 `books` 中的来源。没有依据时用空数组 `[]`，不要填猜测章节或页码。
6. 运行检查并刷新浏览器，查看桌面和窄屏上的列表、详情、公式及原站链接。

第二版每条资源还必须填写 `operation`：`entry`（怎样进入）、`startingState`（起点设置数组）、`controls`（原文名称 `name`、中文 `meaning`、用途 `usage`、证据 `evidence`）、`restart`（当前设置重开）、`restoreDefault`（恢复起点）、`testedRange`、`troubleshooting`（现象与处理）、`reviewedAt`、`evidenceNote`。可选 `guideSource` 链接到具体操作说明。勿把读到的功能写成已经操作，勿把 Restart 说成恢复全部参数。

```powershell
node scripts/check.mjs
node --test scripts/lab.test.cjs scripts/v3.test.cjs
```

正文目前按纯文本渲染，不接受自行插入 HTML。数学公式使用 KaTeX 支持的 LaTeX 写法；在 JSON 字符串中反斜杠要写两次，例如 `\\frac{a}{b}`。`think.formula` 可选。不要把 LaTeX 放进普通正文后期待自动转换。

## 分类与站内演示

本站约束曲面演示的入口为 `/#/resource/constraint-surface`，直接用 P、V、T 表示压强、体积和绝对温度，模型为固定物质量的理想气体 PV=nRT。资源条目用 `kind: "local"`、`module: "constraint-surface"` 和 `localAssets` 声明站内模块；外部资源仍使用 HTTPS 链接。站内模块在 `window.SiteDemos` 注册 `page`、`mount`、`unmount`，切换页面时移除旧事件监听和绘图任务。压强、体积、固定量、显示开关和视角自动写入链接；无参数入口恢复默认，Home 仅恢复视角。旧参数链接自动转换到 P、V、T。已检查桌面交互及窄屏布局。

首页与资源目录共用搜索、学科分类和知识点筛选。学科数量由条目自动统计；没有条目的学科显示空状态。

`visual` 选择本站原创概念图：`heat`、`wave`、`membrane`、`bessel`、`fourier`、`complex`、`potential`、`advection`。这些仅是概念示意，不是截图或计算结果。替换成原站图片、嵌入模拟、转载代码之前，需单独核对许可与运行情况。

偏导链式关系的入口为 `/#/resource/thermo-chain-rule`，归入“约束与偏导”。动作、步长和暂停进度保存在链接参数中；不带参数时恢复默认起点。页面切换会停止动画并移除监听。

## 使用与维护边界

- 首版数据核验日期为 2026-09-12。它不是实时链接监测；原站界面更改后，应复查任务文字。
- 网站代码无数据库或第三方统计脚本。搜索、资源对照选择以及已生成的实验快照保存在地址中的 `#` 之后。没有快照的实验室会在刷新时恢复默认。练习选择与临时问题记录不跨页面保存。此 GitHub Pages 版本公开访问。
- 实验室入口为 `/#/lab`，两端为零边界、波动初始速度为零，采用相同初始系数和模拟时间。所有量无量纲化，曲线由最多六个解析模态叠加而成，不是任意 PDE 数值求解器。参数变化会暂停并回到 t=0；“回到 t=0”保留设置，“恢复默认”重置全部设置。
- 操作卡按钮会显示完整纯文本并尝试复制；浏览器限制自动复制时可手动选择。问题记录在当前页面生成和编辑，不自动发送，也不跨页面保存。
- 吴崇试第三版目录尚未取得可靠原版依据，因此没有具体章节映射。梁昆淼第五版和顾樵第一版只在可核实范围内关联。
- 已做本站 320 / 390 像素窄屏检查，未做手机实机与第三方模拟的触屏检查，也未验证中国大陆直连可用性。
- 长公式和对照表在窄屏可横向滚动；可用 Tab 聚焦、方向键滚动、Enter 展开思考题。

第一版历史记录见 `docs/verification.md`；当前版本更新与待办见 `docs/verification-v3.md`。一维热模态已补上相同模拟时间的定性对照，不再沿用第一版“操作部分核验”状态。


## 第三版怎样使用和维护

- **对照资源**：在目录或详情点“加入对照”；选 2–3 项后点“开始对照”。资源正文仍只修改 `catalog.json`，对照页自动同步。`compare.js` 中的 `groups` 仅保存推荐组合的标题、目的和资源 ID，不复制导读。
- **保存实验**：调整系数、参数和时间，点击“生成当前实验链接”。实验会暂停，页面地址变为当前快照；可收藏地址或复制展开的文本。修改后需重新生成。打开此链接会恢复同一画面，且不会自动播放。
- **理解链接范围**：本地地址 `127.0.0.1` 只在运行预览服务的电脑可用。要分享给其他人，先在上方在线网站生成链接。未提供云端笔记、收藏库或练习成绩记录。
- **新增预测实验**：在 `lab/inquiries.js` 添加唯一 `id`，填写 6 个初始系数 `a`、模态 `n`、`c`、`D`、观察时刻 `t`、位置 `x`、问题、选项、从 0 开始的正确答案索引、观察任务、解释、公式和资源 ID。随后实际载入并操作，检查题意条件、读数和解释。当前仅适用于固定端、零初始速度的原模型。
- **修改数学模型**：解析表达式和能量量放在 `physics.js`。若改变模型条件，必须同时重审 `inquiries.js`、页面说明及数学测试；不要只修改曲线。
- **链接兼容性**：`state.js` 的快照格式版本为 1，和网站第三版不是同一个版本号。已发布的格式应保留解码支持；不支持的格式和越界值会显示明确提示并载入默认值。

发布前运行上述目录检查与 15 项测试，实际检查桌面和窄屏、题卡、链接刷新、零初值、无结果筛选及对照表。不要把链接请求成功写成已操作外部模拟器。
