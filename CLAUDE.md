# CLAUDE.md - Claude AI Agent Configuration

> **Reference**: See [AGENTS.md](./AGENTS.md) for complete project guidelines.

---

## Claude-Specific Guidelines

This file configures Claude AI agents working on this codebase.

### Primary Reference

**All coding standards, project architecture, and quality requirements are documented in [AGENTS.md](./AGENTS.md).**

Please read and follow the guidelines in AGENTS.md before making any changes.

---

## Quick Reference

| Topic | Location |
|-------|----------|
| Project Architecture | [AGENTS.md#project-architecture](./AGENTS.md#-project-architecture) |
| Coding Standards | [AGENTS.md#coding-standards](./AGENTS.md#-coding-standards) |
| Data Flow | [AGENTS.md#data-flow](./AGENTS.md#-data-flow) |
| Quality Checklist | [AGENTS.md#quality-checklist](./AGENTS.md#-quality-checklist) |
| Testing Commands | [AGENTS.md#testing-commands](./AGENTS.md#-testing-commands) |
| Prohibited Actions | [AGENTS.md#prohibited-actions](./AGENTS.md#-prohibited-actions) |

---

## Claude-Specific Commands

```bash
# Before making changes
npm run lint
npx tsc --noEmit

# After making changes
npm run lint
npm run build
```

---

*For complete guidelines, see [AGENTS.md](./AGENTS.md)*
