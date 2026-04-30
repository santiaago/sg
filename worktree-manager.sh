#!/bin/bash

# worktree-manager.sh - Git worktree management for SG monorepo
# 
# Creates and removes git worktrees for development
# Usage:
#   ./worktree-manager.sh [command] [options]
#
# Commands:
#   create [name] [branch]    - Create a new worktree
#   remove [name]            - Remove a worktree (alias: rm, delete)
#
# Options:
#   --no-install            - Skip dependency installation
#   --no-build              - Skip build after setup
#   --auto                  - Auto-accept prompts (for CI/scripting)
#
# Examples:
#   ./worktree-manager.sh create feature-x main
#   ./worktree-manager.sh create expbranch --auto --no-install
#   ./worktree-manager.sh remove feature-x
#   ./worktree-manager.sh delete feature-x --auto

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"
REPO_ROOT="$(echo "$REPO_ROOT" | tr -d '\n')"
WORKTREE_DIR="${REPO_ROOT}/.worktrees"
LOG_FILE="${REPO_ROOT}/.worktrees.log"

# Package manager - using pnpm as per project setup
PM="pnpm"

# ============================================================================
# Colors
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================================================
# Logging
# ============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
    echo "[INFO] $1" >> "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" >&2
    echo "[WARN] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    echo "[ERROR] $1" >> "$LOG_FILE"
}

# ============================================================================
# Validation
# ============================================================================

validate_worktree_name() {
    local name="$1"
    if [[ -z "$name" ]]; then
        log_error "Worktree name cannot be empty"
        exit 1
    fi
    if [[ "$name" =~ (\.\.|//|^\/|\\|/$) ]]; then
        log_error "Invalid worktree name: $name (must not contain \ or .. or //, or start/end with /)"
        exit 1
    fi
}

validate_branch() {
    local branch="$1"
    if [[ -z "$branch" ]]; then
        log_error "Branch name cannot be empty"
        exit 1
    fi
    if ! git show-ref --quiet refs/heads/"$branch" && ! git show-ref --quiet refs/remotes/origin/"$branch"; then
        log_error "Branch '$branch' does not exist locally or remotely"
        exit 1
    fi
}

# ============================================================================
# Worktree Management
# ============================================================================

worktree_exists() {
    local name="$1"
    [[ -d "${WORKTREE_DIR}/${name}" ]]
}

get_worktree_path() {
    local name="$1"
    echo "${WORKTREE_DIR}/${name}"
}

create_worktree() {
    local name="$1"
    local branch="$2"
    local path="$(get_worktree_path "$name")"
    
    log_info "Creating worktree '$name' from branch '$branch' at $path"
    
    # Create worktree directory if it doesn't exist
    mkdir -p "$WORKTREE_DIR"
    
    # Create the worktree
    if ! git worktree add "$path" "$branch" 2>&1; then
        # Try with fetch if local branch doesn't exist
        if git fetch origin "$branch" 2>/dev/null; then
            git worktree add "$path" "origin/$branch" 2>&1 || {
                log_error "Failed to create worktree for branch '$branch'"
                return 1
            }
        else
            log_error "Failed to create worktree for branch '$branch'"
            return 1
        fi
    fi
    
    log_info "Worktree created successfully"
    echo "$path"
}

remove_worktree() {
    local name="$1"
    local path="$(get_worktree_path "$name")"
    
    if ! worktree_exists "$name"; then
        log_warn "Worktree '$name' does not exist"
        return 0
    fi
    
    log_info "Removing worktree '$name' at $path"
    
    # Remove worktree
    if ! git worktree remove "$path" 2>/dev/null; then
        log_warn "git worktree remove failed, force-removing directory"
    fi
    
    # Remove directory (git worktree remove might not clean up)
    if [[ -d "$path" ]]; then
        rm -rf "$path"
    fi
    
    log_info "Worktree removed successfully"
}

# ============================================================================
# Setup Functions
# ============================================================================

install_deps() {
    local path="$1"
    local no_install="$2"
    
    if [[ "$no_install" == "true" ]]; then
        log_info "Skipping dependency installation"
        return 0
    fi
    
    log_info "Installing dependencies with $PM..."
    
    cd "$path"
    if ! $PM install; then
        log_error "Failed to install dependencies"
        return 1
    fi
    
    log_info "Dependencies installed successfully"
}

build_project() {
    local path="$1"
    local no_build="$2"
    
    if [[ "$no_build" == "true" ]]; then
        log_info "Skipping build"
        return 0
    fi
    
    log_info "Building project..."
    
    cd "$path"
    if ! $PM build; then
        log_warn "Build failed"
        return 1
    fi
    
    log_info "Build completed successfully"
}

# ============================================================================
# Command: Create
# ============================================================================

cmd_create() {
    local name=""
    local branch=""
    local no_install="false"
    local no_build="false"
    local auto="false"
    local positional_args=()
    
    # Parse arguments - flags first, then positional
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --no-install)
                no_install="true"
                shift
                ;;
            --no-build)
                no_build="true"
                shift
                ;;
            --auto)
                auto="true"
                shift
                ;;
            -*)
                log_error "Unknown option: $1"
                exit 1
                ;;
            *)
                positional_args+=("$1")
                shift
                ;;
        esac
    done
    
    # Assign positional args
    if [[ ${#positional_args[@]} -gt 0 ]]; then
        name="${positional_args[0]}"
    fi
    if [[ ${#positional_args[@]} -gt 1 ]]; then
        branch="${positional_args[1]}"
    fi
    if [[ ${#positional_args[@]} -gt 2 ]]; then
        log_error "Too many arguments: ${positional_args[2]}"
        exit 1
    fi
    
    # Validate
    validate_worktree_name "$name"
    
    if [[ -z "$branch" ]]; then
        if [[ "$auto" == "true" ]]; then
            branch="main"
        else
            read -p "Enter branch name [main]: " branch
            branch="${branch:-main}"
        fi
    fi
    
    validate_branch "$branch"
    
    # Check if already exists
    if worktree_exists "$name"; then
        log_error "Worktree '$name' already exists at $(get_worktree_path "$name")"
        if [[ "$auto" != "true" ]]; then
            read -p "Remove and recreate? [y/N]: " ans
            if [[ "$ans" =~ ^[Yy]$ ]]; then
                remove_worktree "$name"
            else
                log_info "Aborted"
                exit 0
            fi
        else
            log_info "Using --auto, removing existing worktree"
            remove_worktree "$name"
        fi
    fi
    
    # Create worktree
    local path
    path=$(create_worktree "$name" "$branch") || exit 1
    
    # Setup
    install_deps "$path" "$no_install" || exit 1
    build_project "$path" "$no_build" || log_warn "Build skipped or failed"
    
    log_info "Worktree '$name' is ready!"
    echo ""
    log_info "Worktree location: $(get_worktree_path "$name")"
}

# ============================================================================
# Command: Remove
# ============================================================================

cmd_remove() {
    local name=""
    local auto="false"
    local positional_args=()
    
    # Parse arguments - flags first, then positional
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --auto)
                auto="true"
                shift
                ;;
            -*)
                log_error "Unknown option: $1"
                exit 1
                ;;
            *)
                positional_args+=("$1")
                shift
                ;;
        esac
    done
    
    # Assign positional args
    if [[ ${#positional_args[@]} -gt 0 ]]; then
        name="${positional_args[0]}"
    fi
    if [[ ${#positional_args[@]} -gt 1 ]]; then
        log_error "Too many arguments: ${positional_args[1]}"
        exit 1
    fi
    
    validate_worktree_name "$name"
    
    if ! worktree_exists "$name"; then
        log_warn "Worktree '$name' does not exist"
        exit 0
    fi
    
    if [[ "$auto" != "true" ]]; then
        read -p "Are you sure you want to remove worktree '$name'? [y/N]: " ans
        if [[ ! "$ans" =~ ^[Yy] ]]; then
            log_info "Aborted"
            exit 0
        fi
    fi
    
    remove_worktree "$name"
}

# ============================================================================
# Usage / Help
# ============================================================================

usage() {
    cat <<EOF
${CYAN}worktree-manager.sh${NC} - Git worktree management for SG monorepo

${BLUE}Usage:${NC}
    ./worktree-manager.sh <command> [options] [args]

${BLUE}Commands:${NC}
    create [name] [branch]    Create a new worktree
    remove [name]            Remove a worktree (aliases: rm, delete)

${BLUE}Options:${NC}
    --no-install             Skip dependency installation (create only)
    --no-build               Skip build after setup (create only)
    --auto                   Auto-accept prompts (for scripts/CI)

${BLUE}Examples:${NC}
    # Create worktree from main branch
    ./worktree-manager.sh create feature-x main

    # Create with auto-accept and no build
    ./worktree-manager.sh create expbranch --auto --no-build

    # Remove worktree (with confirmation)
    ./worktree-manager.sh remove feature-x

    # Remove worktree without confirmation
    ./worktree-manager.sh delete feature-x --auto

${BLUE}Configuration:${NC}
    REPO_ROOT: $REPO_ROOT
    WORKTREE_DIR: $WORKTREE_DIR
    Package Manager: $PM
    Log File: $LOG_FILE

${BLUE}Notes:${NC}
    - Worktrees are stored in .worktrees/ directory at repo root
    - Each worktree is a complete copy with its own node_modules
    - See .worktrees.log for detailed logs
EOF
}

# ============================================================================
# Main
# ============================================================================

main() {
    # Ensure we're in the repo root
    cd "$REPO_ROOT"
    
    # Create log file if doesn't exist
    touch "$LOG_FILE"
    
    # Parse command
    if [[ $# -eq 0 ]]; then
        usage
        exit 0
    fi
    
    local command="$1"
    shift
    
    case "$command" in
        create)
            cmd_create "$@"
            ;;
        remove|rm|delete)
            cmd_remove "$@"
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            log_error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
}

# ============================================================================
# Entry Point
# ============================================================================

# Check if git is available
if ! command -v git &>/dev/null; then
    echo "Error: git is not installed or not in PATH"
    exit 1
fi

# Check if pnpm is available
if ! command -v pnpm &>/dev/null; then
    echo "Error: pnpm is not installed or not in PATH"
    exit 1
fi

# Run main
main "$@"
