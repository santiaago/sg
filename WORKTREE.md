# WORKTREE.md

Git worktree management for SG monorepo.

## Setup

```bash
./worktree-manager.sh create <name> <branch>
```

## Commands

| Command | Description |
|---------|-------------|
| `create <name> <branch>` | Create worktree, install deps, build |
| `create <name> <branch> --no-install` | Create without installing deps |
| `create <name> <branch> --no-build` | Create without building |
| `dev <name> [app2]` | Start dev server (default: app) |
| `build <name>` | Build project |
| `install <name>` | Install deps only |
| `remove <name>` | Remove worktree |
| `list` | List all worktrees |
| `clean --all` | Remove all worktrees |
| `check <name>` | Run lint, type-check, tests |

## Examples

```bash
# Create worktree from main branch
./worktree-manager.sh create experiment main

# Create with no deps install
./worktree-manager.sh create temp --no-install

# Start React dev server
./worktree-manager.sh dev experiment app2

# Start Svelte dev server (default)
./worktree-manager.sh dev experiment

# List all worktrees
./worktree-manager.sh list

# Remove a worktree
./worktree-manager.sh remove experiment

# Clean everything
./worktree-manager.sh clean --all
```

## Notes

- Worktrees stored in `.worktrees/` (gitignored)
- Each worktree has its own `node_modules/`
- First `create` takes a while (installs deps)
- Use `--no-install --no-build` for faster setup, then run manually
