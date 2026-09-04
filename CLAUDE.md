# AGENTS.md · ColdStorageInventory（冻品冷库系统）

基于 InvenTree 二次改造的冻品批发/冷库库存系统：库存、批次、库位、权限底座来自上游，业务入口是中文冷库工作台（`/cold-storage/`）。渐进改造——不推倒重来，旧功能保留待用。

本文件是入口索引，不展开细则。行为、架构、流程以下列文档为准。

## 去哪查

| 要什么 | 文档 |
| --- | --- |
| 行为 / 流程 / 字段 / 边界 | `project_notes/cold_storage_workbench/current/`（总方案、页面与业务流程设计、需求与使用说明）；近期重点 `project_notes/最紧急任务.md` |
| 词汇、目录、改动档位、红线、上游同步 | `project_notes/团队协作与开发规范.md` |
| AI 工作流、EARS、拆票、熔断、会话纪律 | `project_notes/AI 原生产品工程化落地通用规范与标准 SOP.md` |
| 落主线 / 拆 PR | `project_notes/land-main-workflow.md` |
| 发布 / 备份 / 回滚 | `project_notes/发版手册.md` |
| 上游代码结构、测试与开发命令 | `CONTRIBUTING.md`（InvenTree 官方） |
| AI 技能清单 | `.omp/skills/`（工程工作流套件 + beautiful-ui / ui-ux-pro-max） |

涉及行为必须先读需求文档对应章节；涉及结构必须先看上游 CONTRIBUTING。禁止凭记忆或「通用最佳实践」补产品边界。默认直觉（库存、入库、出库、权限）几乎总是错的——InvenTree 是成熟的库存系统，你觉得"该重做"的地方多半已有实现，先查再说。

## 铁律

1. **渐进改造，不推倒重来。** 上游 InvenTree 代码是底座：不改其模型与 API 语义；冗余功能暂不删（协作规范 §6.3），删除须经确认并独立成 PR。
2. **账单只增不改不删。** 出库单/账单类记录 append-only + 结算状态标记；历史单据禁止 UPDATE/DELETE。库存变动必须可溯源到批次。
3. **数据与密钥不进 git。** `config/config.yaml`、`config/data/`（SQLite 经营库 + 媒体）已被 gitignore，永不解除；密钥不进代码、日志、测试、对话产出。
4. **前端文案走 Lingui。** 源码禁止硬编码中文（`yarn harness` 拦截）；包管理只用 yarn，源码只用 TypeScript。
5. **upstream 只读。** 不推送、不提 PR、不开 AI 生成 issue；同步走协作规范 §11（merge 保留历史，冲突时冷库自定义优先，拿不准就停）。
6. **落主线必须拆分。** 一次 PR 一个主题；>20 文件或 ≥2 个 scope 强制拆分（land-main-workflow.md）。
7. **动数据先备份。** 发布、迁移、回滚前必须先备份 `config/data/db.sqlite3`（发版手册 §二）；能只回滚代码就不动数据。
8. **按档位办事。** 琐碎直改；bug 先复现带回归测试；新功能走 SOP（grill → spec → tickets → implement，每票一个会话）。

规则不清楚：需求文档 → CONTRIBUTING → 协作规范 → 停下问老板。不能用默认值代替业务决定。进度以 git log 为准。
