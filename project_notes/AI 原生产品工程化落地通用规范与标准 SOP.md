# AI 原生工程化 SOP · ColdStorageInventory

> 适用范围：本仓（InvenTree fork + 冷库渐进改造）的 AI 辅助开发全流程。
> 核心范式：规范驱动开发（SDD）、Harness 评估、上下文工程、DAG 任务拆解、熔断回滚。
> 前置阅读：[团队协作与开发规范](团队协作与开发规范.md)（下称"协作规范"）。AI 技能装在 `.omp/skills/`。

---

## 0. 规模适配

本仓是**已有代码库的渐进改造**，不是从零起步：

- 六层架构全量保留为思考框架；第 3 层（Harness）以**复用现有测试设施**为原则，不新建空目录。
- 琐碎改动（协作规范档位 1）不需要走本 SOP 全流程。

---

## 1. 核心哲学与六层元架构

大模型是概率性的。AI 原生工程化 = 用**确定性**的契约、沙盒与熔断机制，包裹**非确定性**的模型生成。

```text
┌────────────────────────────────────────────────────────────────────────┐
│  第 1 层：意图锁定层 (Intent)          ──> EARS 语法 / 不可变规则 / 非目标 │
│  第 2 层：契约硬化层 (Scaffold)        ──> Django models / DRF schema     │
│  第 3 层：Harness 沙盒评估层 (Sandbox) ──> pytest / Playwright / harness   │
│  第 4 层：上下文与防爆熔断层 (Guard)   ──> AGENTS.md 铁律 / Safe Rollback  │
│  第 5 层：DAG 任务拆解层 (Task DAG)    ──> 单 Task / 作用域隔离            │
│  第 6 层：品味门禁层 (Human Gate)      ──> 老板确认 / 现场验收             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 规范驱动开发（SDD）

### 2.1 EARS 需求语法

业务逻辑一律用 EARS 表达，禁止模糊自然语言：

| 模式 | 语法 | 本仓示例 |
| :--- | :--- | :--- |
| 无条件 | `THE SYSTEM SHALL <行为>` | THE SYSTEM SHALL 在账单保存成功后立即持久化，不依赖前端刷新。 |
| 事件驱动 | `WHEN <事件>, THE SYSTEM SHALL <行为>` | WHEN 出库数量大于批次剩余数量，THE SYSTEM SHALL 拒绝操作并提示可用数量。 |
| 状态驱动 | `WHILE <状态>, THE SYSTEM SHALL <行为>` | WHILE 账单已结算，THE SYSTEM SHALL 不再允许修改金额字段。 |
| 可选特性 | `WHERE <配置>, THE SYSTEM SHALL <行为>` | WHERE 货品主档配置了默认保质期，THE SYSTEM SHALL 自动计算到期日期。 |
| 异常响应 | `IF <异常>, THEN THE SYSTEM SHALL <恢复>` | IF 上游同步冲突无法自动合并，THEN THE SYSTEM SHALL 停止并输出冲突文件清单。 |

### 2.2 不可变规则（Invariants）与非目标（Non-Goals）

每个档位 3 功能开工前，spec 必须包含这两节。本仓的常驻条目：

```markdown
### 不可变规则 (Invariants)
- [INV-001] 账单/出库单 append-only：历史单据禁止 UPDATE/DELETE，只能新增 + 结算状态。
- [INV-002] 库存数量变动必须可溯源到批次与操作记录。
- [INV-003] config/config.yaml 与 config/data/ 永不进入 git。

### 明确不做 (Non-Goals)
- [NG-001] 不重写 InvenTree 底座，不引入新后端框架或新 UI 组件库。
- [NG-002] 不删除上游功能（协作规范 §6.3）。
- [NG-003] 不给上游提 PR、不开 AI 生成 issue；不绕过上游角色权限体系。
```

### 2.3 契约硬化

- **数据库**：Django models + migrations。迁移文件即契约，新迁移必须与模型同提交、过门禁。
- **API**：沿用 DRF schema 体系；改端点语义 = 边界变化，走档位 3。
- **物理拦截**：本仓没有自定义 CI 阻断，替代手段 = 门禁（§6）+ review 检查单 + 上游核心文件的 `ColdStorage customization` 注释标记（协作规范 §6.2）。

---

## 3. Harness 沙盒评估

**现状盘点（复用优先，不新建空目录）**：

| 设施 | 位置 | 用途 |
| --- | --- | --- |
| 前端规约 | `yarn harness` | 中文硬编码（no-cjk-in-source）、包管理检查 |
| 前端行为 | `src/frontend/tests/`（Playwright） | 页面与交互回归 |
| 后端测试 | `invoke test --keepdb`（pytest） | API、模型、权限回归 |

**约束**：

- 测试不出网、不碰真实经营库 `config/data/db.sqlite3`、不动 `config/data/media/`。
- 时间相关逻辑（保质期 → 到期日期）用可控时间，不做真实长等待。
- 失败时输出结构化诊断：失败断言、期望值、实际值、定位（模块/行号）、下一步提示；让 AI 能自纠错而不是重试撞墙。
- Harness 全绿 ≠ 现场验收通过；真实操作人员的 Vibe Check 是独立门禁（§6）。

---

## 4. 上下文工程与 Agent 约束

- **行为约束文件 = 根目录 `AGENTS.md`**：入口索引 + 铁律。项目级约束写进 AGENTS.md，让约束跟随项目而不是跟随记性；不要在每次会话口头重复。
- **技能**：`.omp/skills/`（grill-with-docs、to-spec、to-tickets、implement、tdd、code-review、diagnosing-bugs、handoff、wayfinder、research 等）。用法看各 SKILL.md。
- **上下文预算**：单次主上下文 ≤ 窗口 40%，留出推理与生成空间。
- **引用而非粘贴**：长文档（总方案、规范）只给路径和章节号，不整篇贴进对话。
- **会话分工**：需求访谈（grill）与代码实现（implement）分属不同会话，中间用 `/handoff` 衔接。

---

## 5. DAG 任务拆解

系统改动拆成**有向无环**的原子任务链；一个 task 一个作用域，禁止无边界大面积协同。

```text
输入 Task 规范与 Scope → AI 编码 → 跑 Harness ──> PASS：commit 并推进
                                        │
                                     FAIL (<3 次)：读诊断 → 自我修复
                                        │
                                     FAIL (>=3 次)：Safe Rollback → 上报
```

**标准 Task 模板**（ticket 落点：`.scratch/<feature>/issues/` 本地 markdown，或 GitHub issue）：

```markdown
### Task [编号]: [模块名称]
- **前置依赖**：Task [前置编号]（无依赖则注明）
- **参照规范**：需求文档路径 + 本 SOP 已批准的 spec
- **允许修改文件范围 (Allowed File Scope)**：
  - src/frontend/src/pages/cold-storage/…
- **核心实现目标**：根据 spec 实现 [某功能]
- **验收自测指令**：`yarn build && yarn harness`（或 `ruff check` + `invoke test --keepdb`）
- **完成判定**：测试全绿、静态检查无错、不触碰 INV 红线
```

---

## 6. 人类品味门禁（Human Gatekeeping）

以下节点硬性暂停，等老板确认：

1. **架构与 Schema 门禁**：涉及 Django models、migrations、settings.yaml、API 合同、上游核心文件大改时。
2. **里程碑 Vibe Check**：每个主阶段完成，让真实使用者（老板/仓管/现场）上手验收界面与流程；确认后打 tag 进入下一阶段。
3. **熔断门禁**：同一 task 连续 3 次失败 → Safe Rollback（`git stash push -m "agent-failed-<时间>"` + `git reset --hard HEAD`）→ 上报诊断，等人类处理。

**禁止**：改阈值、删断言、跳过测试来"通过"。

---

## 7. 实操流程

### 7.1 新功能（已有代码库模式）

```text
1. /grill-with-docs      指向需求文档（总方案 / 最紧急任务 / 使用说明），逐条逼出模糊点
2. /prototype            设计问题纸面解决不了时做一次性验证；用完即删，只留结论
3. /to-spec              生成实现规格，老板批准
4. /to-tickets           拆成有阻塞关系的垂直切片
5. 每票新开会话 /implement   内部走 /tdd 红-绿循环；不要一票没完接着开下一票
6. /code-review          审查 diff，通过后 commit
7. 落主线                按 project_notes/land-main-workflow.md 拆 PR 合入
```

### 7.2 紧急 Bug 修复

`/diagnosing-bugs` → 复现（红）→ 定位根因 → 修复 + 回归测试 → 直接落主线。**不经过** spec 与 tickets。

### 7.3 跨会话衔接

- 上下文将满：`/handoff` → 生成 markdown → 新会话引用该文件继续。
- 同会话阶段切换：内置 `/compact`；不要在同一个实现阶段的中间 compact。

### 7.4 代码库健康

空闲时 `/improve-codebase-architecture` 扫描可深化模块，产出当作新需求走 §7.1。
**约束**：对上游代码的"改进"优先级低于冷库业务，且受协作规范 §6.3（不删上游）约束。

### 7.5 上游同步

唯一流程来源：协作规范 §11。AI 在同步会话里只做三件事——列差异、逐段合并、跑验证合同；拿不准的冲突一律停下问。

---

## 8. 不良实践与纠正

以下模式来自真实 solo dev vibe coding 复盘，每一条都是被反复验证过的失败路径：

| 不良实践 | 表现 | 纠正 |
|:---|:---|:---|
| **碎片化反馈** | 看到一个问题发一条消息，AI 逐个读文件、逐个修改，同一组件被编辑 30+ 次 | 扫完整个页面，把所有问题一次性发送，优先级最高的放第一条 |
| **AI 不读需求文档** | 凭记忆或常识推断业务规则，与需求冲突 20+ 分钟才被发现 | 会话第一句话："先读 project_notes 对应需求文档"；写进 AGENTS.md 铁律 |
| **文件反复修改** | 改-崩-改循环，同一文件被 edit 数十次 | 同一组件编辑超过 3 次停下来；还不行说明 task 拆太大了，往回拆一层 |
| **AI 陷入局部** | 只改字面提到的地方，旧入口残留、重复组件共存 | 铁律：操作前全局扫描；反馈时补一句"检查全局同类遗留" |
| **不叫停** | 连续失败后说"继续"，AI 换个方式继续失败 | 连续失败 2 次就停，读 `git diff`，重新描述需求；不发"继续" |
| **上下文浪费** | 一个会话里又访谈又实现，context 压缩 4 次后质量下降 | 访谈与实现分会话，`/handoff` 衔接 |
| **项目约束没落盘** | 每次新会话口头重复"先读需求""不许改账单"，漏一次 AI 就自由发挥 | 约束写入 AGENTS.md 铁律区（§4），随项目走 |

---

## 9. 与其他文档的关系

- 分支/提交/落主线/上游同步细节：**协作规范** §5、§11。
- 发版、备份、回滚：**发版手册**。
- 业务流程与字段定义：**cold_storage_workbench/current/** 需求文档。
- 本 SOP 与协作规范冲突时：流程类以本 SOP 为准，红线与目录类以协作规范为准；改文档解决，不改口。
