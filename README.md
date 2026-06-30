# ColdStorageInventory

ColdStorageInventory is a cold-storage inventory management system for frozen food wholesale workflows.

This project is built from the InvenTree codebase and is being adapted into a simpler cold-storage workbench for daily warehouse operations. The goal is to keep the proven inventory foundation while presenting operators with Chinese, task-focused screens for stock lookup, inbound goods, outbound goods, location movement, stocktake, and loss handling.

## Current Scope

- Cold-storage workbench entry for warehouse staff
- Stock card search based on the existing inventory API
- Frozen wholesale wording for core navigation and business flows
- Local development scripts for opening the project in PyCharm and running the app
- Project notes under `project_notes/` to document design decisions and implementation history

## Development Strategy

The project follows a gradual migration path:

1. Keep the original inventory backend available.
2. Add cold-storage pages in parallel.
3. Validate the workflow with real operators.
4. Connect write operations only after the field design is stable.

This avoids breaking the existing stock model while the cold-storage workflow is still being refined.

## Repository Layout

```text
src/backend/InvenTree/     Django backend and REST API
src/frontend/              React frontend
project_notes/             Cold-storage design notes and development records
config/                    Local configuration templates
assets/                    Project assets
```

## Local Setup

Install backend dependencies from the repository root:

```bash
pip install -r src/backend/requirements.txt
```

Install frontend dependencies:

```bash
cd src/frontend
npm install
```

Run the backend:

```bash
invoke server
```

Run the frontend development server:

```bash
cd src/frontend
npm run dev
```

## Git Workflow

This repository is maintained as a fork-based project:

```text
origin   -> https://github.com/MundusNil/ColdStorageInventory.git
upstream -> https://github.com/inventree/InvenTree.git
```

Feature work should happen on dedicated branches and be reviewed manually before merging.

## Attribution

ColdStorageInventory is based on InvenTree, an open-source inventory management system released under the MIT License. The original license is preserved in this repository.
