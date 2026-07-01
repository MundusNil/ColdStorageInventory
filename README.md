# ColdStorageInventory

ColdStorageInventory 是面向冻品批发和冷库日常作业的库存管理系统。

本项目基于 InvenTree 改造，保留原有库存、批次、库位和权限基础，同时为老板、仓管和现场人员提供更直接的中文冷库工作台。当前重点不是推倒原系统，而是在原库存模型旁边逐步补出冷库业务入口，先验证流程，再替换不适合现场使用的页面。

## 当前范围

- 冷库工作台默认入口
- 基于现有库存 API 的库存卡片查询
- 新货入库和出库扣数主流程
- 改库位、盘点改数、报损/过期的表单草稿
- 面向中文团队的导航和登录入口
- 本地启动脚本和项目设计记录

## 开发策略

项目采用渐进改造策略：

1. 保留原 InvenTree 后端和库存模型。
2. 并行新增冷库业务页面。
3. 先让真实操作人员验证字段、入口和流程。
4. 确认业务规则后，再逐步接入写入接口和替换旧入口。

这样可以避免冷库流程还没稳定时破坏已有库存能力，也方便按功能分组 review 和回滚。

## i18n 和中文源码约定

本系统主要服务纯中文团队，因此冷库业务页面、登录入口和冷库导航允许直接写中文 UI 文案。

原 InvenTree 通用页面仍尽量保留原有 i18n 体系，除非该页面已经明确纳入冷库业务改造范围。新增冷库页面不需要为每个按钮和表单字段额外维护英文 msgid 与中文翻译文件。

## 目录结构

```text
src/backend/InvenTree/     Django 后端和 REST API
src/frontend/              React 前端
src/frontend/src/pages/cold-storage/  冷库业务页面
project_notes/             冷库方案、开发记录和流程文档
config/                    本地配置模板
assets/                    项目资源
scripts/                   本地启动脚本
```

## 本地运行

安装后端依赖：

```bash
pip install -r src/backend/requirements.txt
```

安装前端依赖：

```bash
cd src/frontend
yarn install
```

启动后端：

```bash
invoke server
```

启动前端开发服务：

```bash
cd src/frontend
yarn run dev
```

也可以使用本地脚本启动开发环境：

```bash
scripts/start-dev.ps1
```

## 验证命令

前端改动提交前至少执行：

```bash
cd src/frontend
yarn harness
yarn tsc --noEmit
```

如果改动涉及语言包，再执行：

```bash
yarn compile
```

## Git 工作流

本仓库按 fork 项目维护：

```text
origin   -> https://github.com/MundusNil/ColdStorageInventory.git
upstream -> https://github.com/inventree/InvenTree.git
```

功能开发应在独立分支完成，通过人工 review 后再合入 `main`。本仓库的“落主线”表示：按可独立 review、可独立回滚的边界分组，分别提交、推送并通过 PR 合入远程 `main`。

不得把多组无关改动硬塞进一个 PR。不得在没有人工 review 的情况下直接打开或合并 PR。

## 来源说明

ColdStorageInventory 基于 InvenTree 开源库存系统改造。InvenTree 使用 MIT License，原始许可证随本仓库保留。
