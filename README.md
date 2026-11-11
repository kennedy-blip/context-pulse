# ContextPulse

An interactive developer knowledge workspace built with React, TypeScript, Tailwind CSS, and Lucide icons.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Workspaces

- **Knowledge Mesh Graph:** filterable, draggable, zoomable dependency canvas with source inspection.
- **Codebase Indexer:** searchable memory cards, file imports, pinning, grid/list views, and snippet creation.
- **API Contract Hub:** route registry, request/response schemas, consumer links, local request simulation, and OpenAPI export.
- **Terminal Error Vault:** recurring trace grouping, diagnoses, suggested fixes, log imports, and Markdown reports.
- **AI Context Query:** interactive semantic-demo answers with grounded source citations and selectable context scopes.

Workspace edits and preferences persist in browser local storage. Memory snapshots are exported as JSON. The app is local-only and uses realistic demonstration data; connecting a real filesystem or semantic model requires a native/backend connector.

Press **Ctrl/⌘ K** for quick find and **Ctrl/⌘ Enter** to submit a context query.
