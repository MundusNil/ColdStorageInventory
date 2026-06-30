# 落主线 Workflow

`落主线` 在本仓库中表示：把已完成的本地工作通过 **一个或多个** PR 合入远程 `main`，合入后清理对应分支，并按需从最新 `main` 创建后续工作分支。

**默认不是「一个分支打天下」**：若本地存在多组彼此独立、可单独 review / revert 的变更，必须拆成多个分支、分别提 PR，再按顺序合入。用户说「所有的都落主线」是指 **范围上全部合入**，不等于允许把所有改动塞进同一个 PR。

## 核心逻辑

- 必须通过 PR 合入远程 `main`，禁止直接更新远程 `main`。
- **一组独立变更 = 一个分支 + 一个 PR**（前后端各算一个仓库，同一逻辑变更可在两仓各开一个同名或对应分支）。
- 默认自动推进，只有遇到真实阻塞才停下来。
- 合入前每个待落地分支必须基于最新 `origin/main`，并保持线性历史。
- PR 标题、PR 正文、squash merge 标题和落地主线的 commit message 必须干净、中文、符合 Conventional Commits。
- 每个 PR 合入成功后，清理该 PR 对应的远程和本地分支，并同步本地 `main`，再处理下一组。

## 默认流程

当用户说 `落主线` 时，按下面流程执行。

1. 确认最小输入。

   必需信息：
   - 本次要落地的 **变更分组**（见下一节「变更分组与分支拆分」）
   - 每组对应的分支名（若用户未指定，由 Agent 按分组规则命名并列出清单）
   - 合入后是否创建新的后续分支

   若用户只说「落主线」或「所有的都落主线」而未给分支名，**先完成分组与拆分支**，再推进 push / PR；不要默认沿用当前 checkout 的那一个分支名覆盖全部改动。

2. 变更分组与分支拆分（落主线前必做）。

   在 push 之前，先盘点本地已提交与未提交改动，按 **可独立合入、可独立回滚** 的原则分组。典型应拆开的边界包括：

   | 信号 | 示例 | 建议 |
   |------|------|------|
   | 不同 `type` / 业务意图 | `feat` 功能 vs `chore` 清理 vs `fix` 修复 | 各一组、各一分支 |
   | 不同模块 / scope | `video-factory` 时长 vs `audio-generation` legacy 删除 | 各一分支 |
   | 用户会话中已划定的 A/B/C 组 | A 功能、B 开发环境、C legacy 清理 | **严格按组拆分**，除非用户明确说「合并成一个 PR」 |
   | 前后端同一功能 | 前端 UI + 后端 API | 两仓各一分支，可同名；PR 正文互相引用 |
   | 仅本地 / 不应入库 | ogs 本地文档、缓存、分析草稿 | 不进任何 PR；需要时用 `.gitignore` 单独一组 |

   **禁止**：把无关 `feat`、`chore`、跨模块清理混进同一个分支，只为少建几个 PR。

   **分支命名**（每组一个）：

   ```text
   feat/<模块>-<简短描述>
   fix/<模块>-<简短描述>
   chore/<模块>-<简短描述>
   ```

   **若改动已在单一分支上堆在一起**（常见误操作），在 push 前从最新 `origin/main` 重建分支，例如：

   ```bash
   git fetch origin
   git checkout main && git pull origin main

   # 对每一组：新建分支，只 cherry-pick 该组 commit（或从未提交区只 add 该组文件后提交）
   git checkout -b chore/audio-generation-remove-legacy
   git cherry-pick <commit-hash>   # 仅 legacy 清理相关

   git checkout main
   git checkout -b feat/video-factory-duration-default-automatch
   git cherry-pick <commit-hash>   # 仅时长功能相关
   ```

   拆完后向用户输出 **分组清单**（分支名 → 包含 commit / 文件 → 计划 PR 标题），再进入后续步骤。多组之间无依赖时，合入顺序建议：`fix` → `feat` → `chore`；有依赖时按依赖链从前到后合入。

3. 推送前校验本地分支（对 **每一个** 待落地分支重复）。

   必须确认：
   - 当前分支就是要落主线的目标分支
   - 目标变更已经提交；如果检测到本地还有未提交内容，先判断提交边界并完成本地提交
   - 提交后 working tree 干净
   - 没有不明确的暂存、未暂存、遗漏提交或提交边界问题

   如果未提交变更明确属于本次落主线范围，先运行必要验证并本地提交，再继续后续流程。
   明显不应进入主线的本地资产、缓存、工具产物或个人临时文件不要提交；需要保留时先用 stash 或其它可恢复方式隔离，并在回复中说明恢复点。
   如果有部分暂存、提交归属不清、文件是否应进入主线不明确，先停下来问用户。

4. 同步最新 `origin/main`，且严格使用 rebase（每个待落地分支各做一次）。

   执行顺序：
   - `git fetch origin`
   - `git rebase origin/main`

   禁止用 `git merge origin/main` 或普通 `git pull` 制造本地 merge commit。
   如果 rebase 冲突可以根据代码意图明确解决，则本地解决并继续；如果需要产品或技术取舍，停下来问用户。
   处理共享配置、流程文档、规则文件、OpenSpec 配置、CI/CD 配置等跨团队公共资产冲突时，必须先读取并比较双方语义，优先做并集合并；只有确认某一侧是模板噪音、重复内容或已废弃内容时，才可以删除。不要为了当前功能分支方便而覆盖其它团队或其它功能的公共配置。

5. 推送工作分支（每个分组各 push 一次）。

   如果远程分支不存在，正常 push 创建远程分支。
   如果 rebase 后需要更新已存在的远程分支，优先使用 `git push --force-with-lease`，并先确认远程没有他人新增提交。禁止无脑 force push。

6. 创建或更新 PR 到远程 `main`（**每个分组一个 PR**，禁止把多组 squash 进同一 PR）。

   PR 标题必须使用中文 Conventional Commits：

   ```text
   type(scope): 中文描述
   ```

   PR 正文不要直接堆本地 commit message，也不要保留 `fix typo`、`update` 之类噪音。应简要说明：
   - 本次实际改了什么
   - 对业务或用户的价值
   - 已做的验证
   - 仍需关注的风险或限制

   如果分支名中包含明确的 issue/ticket ID，例如 `feature/PROJ-123`，在 PR 正文中自动提及或链接该 ID。没有真实来源时不要编造 ticket ID。

7. 验证 PR 中文写入结果（每个 PR 各验证一次）。

   只要 PR 标题或正文包含中文，并且经过 shell、CLI、API、GitHub/GitLab 等链路写入，就必须读取最终 PR 内容确认中文正常显示，不是 `?`、乱码或残留转义。未验证前不要继续 merge。

8. 默认使用 squash merge（每个 PR 各 merge 一次）。

   除非用户明确要求其他策略，否则使用 squash merge。
   squash merge 的标题和正文必须主动覆盖平台默认值，避免平台把所有本地 commit message 拼进主线 commit body。

   squash merge 标题格式：

   ```text
   type(scope): 中文描述
   ```

   squash merge 正文只保留干净中文摘要，不保留杂乱本地提交列表。
   如果用户没有提供 `scope`，从变更目录、包名或主要功能模块自动推断；如果变更跨模块且 scope 不明确，停下来问用户，不要硬编。

9. 验证最终落地主线 commit message（每个 PR 合入后各验证一次）。

   squash merge 后，读取远程 `main` 最新 commit，确认：
   - 标题是预期的 `type(scope): 中文描述`
   - 正文是干净摘要
   - 没有本地杂乱 commit message 拼接
   - 中文没有乱码、`?` 或转义残留

   如果验证失败，停止后续自动化并说明问题；不要继续清理到无法追踪状态。

10. 处理 CI、Review 和权限等待状态。

   CI pending、required checks 未完成、缺少 human approval、分支保护未放行，都属于等待状态，不算流程失败。
   遇到这类状态时：
   - 不要 abort
   - 清楚输出 PR URL
   - 暂停 merge 和清理步骤
   - 提醒用户在 PR ready 后回复 `continue` 或 `merged`

   对用户说明等待状态时，仍遵守会话称呼规则；但 PR、commit、merge commit、变更日志等公司可见或长期保存文本中不要写入个人称呼。

   推荐阻塞说明：

   ```text
   PR created successfully. Blocked by CI/Review. Please reply 'continue' or 'merged' once it is approved/ready, and I will proceed with the cleanup steps.
   ```

11. 合入成功后清理分支（每个 PR 各做一轮；多 PR 时重复本步直到全部分组落地）。

    单个 PR 成功合入远程 `main` 后，执行：
    - 删除该 PR 对应的远程分支
    - 切回本地 `main`
    - 同步本地 `main` 到最新 `origin/main`
    - 删除该 PR 对应的本地分支
    - 若还有下一组待落地，从最新 `main` 对下一分支 `rebase` 后继续步骤 5–11

12. 按需创建后续分支。

    如果用户要求继续新工作：
    - 从已同步的本地 `main` 创建新分支
    - checkout 到新分支

    如果用户没有要求继续，停在干净且最新的本地 `main`。

## 阻塞规则

只有出现下列情况才停下来问用户：

- 变更分组不清，或无法判断某文件应归入哪一组
- 用户已划定 A/B/C 等多组，但 Agent 尚未拆分支就准备 push
- 合入后是否创建后续分支未知
- working tree 脏且意图不明确，或无法判断哪些文件应进入主线
- 有遗漏提交、部分暂存或提交分组不清
- rebase 冲突需要用户判断产品或技术意图
- 共享配置、流程文档、规则文件或 CI/CD 配置冲突无法确认双方语义
- 远程权限不足或平台规则阻止自动操作
- CI、required checks、review gates 或 branch protection 尚未放行
- squash title/body、PR title/body 或 ticket ID 缺少真实来源
- 中文写入验证失败，出现 `?`、乱码或转义残留
- 继续执行会违反仓库规则

## 快速记忆

如果用户说 `落主线`，理解为：

- 不直接更新远程 `main`
- **先分组、再拆分支**；多组变更 = 多分支 + 多 PR，「全部落主线」≠ 一个 PR 包打天下
- 检测到明确属于本次落主线的未提交内容时，先归入正确分组、本地提交，再继续
- 明显的本地资产、缓存和临时文件不要进 PR，必要时先 stash 隔离
- 每个分支推送前先 `fetch` 并 `rebase origin/main`
- rebase 冲突涉及共享配置或公共规则时，先比较双方语义并优先并集合并
- **每个分组** 各创建一个 PR 到 `main`
- PR 正文用中文总结**该组**实际变化和业务价值，不写无关组的内容
- 默认 squash merge（每组一条干净的主线 commit）
- 主线 commit message 必须干净，不拼接杂乱本地 commit
- 中文 PR 和 commit 文本必须验证最终写入结果
- CI 或 Review 等待时输出 PR URL 并暂停，不视为失败
- 每个 PR 合入后删除对应远程和本地分支，同步 `main`，再处理下一组
- 只有用户需要时才创建后续分支

## 反例（禁止）

以下做法视为未按本流程执行：

- 会话里已有 A（功能）、B（dev 启动）、C（legacy 清理）三组，仍用 `feat/xxx` 一个分支、一个 PR 全部 squash 合入。
- 用户说「所有的都落主线」时，跳过拆分支直接 push 当前分支。
- 为省事把 `chore` 清理与 `feat` 功能写在同一 PR 标题里（如「功能 + 清理 + 忽略文件」）。
