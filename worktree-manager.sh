#!/bin/bash

# worktree-manager.sh - Git worktree management for SG monorepo
# 
# Creates, manages, and sets up git worktrees for development
# Usage:
#   ./worktree-manager.sh [command] [options]
#
# Commands:
#   create [name] [branch]    - Create a new worktree
#   remove [name]            - Remove a worktree
#   list                     - List all worktrees
#   dev [name]               - Start dev server in worktree
#   build [name]             - Build in worktree
#   install [name]           - Install deps only
#   check [name]             - Run full check (lint, type-check, test)
#
# Options:
#   --no-install            - Skip dependency installation
#   --no-build              - Skip build after setup
#   --auto                  - Auto-accept prompts (for CI/scripting)
#
# Examples:
#   ./worktree-manager.sh create feature-x main
#   ./worktree-manager.sh create expbranch --no-install
#   ./worktree-manager.sh dev feature-x
#   ./worktree-manager.sh remove feature-x

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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

log_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
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
    if [[ "$name" =~ [^/\\]* ]]; then
        return 0
    else
        log_error "Invalid worktree name: $name (must not contain / or \\)"
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
    git worktree remove "$path" 2>/dev/null || true
    
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

run_check() {
    local path="$1"
    
    cd "$path"
    
    log_info "Running lint..."
    $PM check 2>&1 || log_warn "Lint checks failed"
    
    log_info "Running type-check..."
    $PM type-check 2>&1 || log_warn "Type checks failed"
    
    log_info "Running tests..."
    $PM test 2>&1 || log_warn "Tests failed"
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
    
    # Parse arguments
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
                if [[ -z "$name" ]]; then
                    name="$1"
                elif [[ -z "$branch" ]]; then
                    branch="$1"
                else
                    log_error "Too many arguments: $1"
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
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
    log_info "To start dev server: ./worktree-manager.sh dev $name"
}

# ============================================================================
# Command: Remove
# ============================================================================

cmd_remove() {
    local name="$1"
    local auto="false"
    
    if [[ $# -gt 1 ]]; then
        if [[ "$2" == "--auto" ]]; then
            auto="true"
        fi
    fi
    
    validate_worktree_name "$name"
    
    if ! worktree_exists "$name"; then
        log_warn "Worktree '$name' does not exist"
        exit 0
    fi
    
    if [[ "$auto" != "true" ]]; then
        read -p "Are you sure you want to remove worktree '$name'? [y/N]: " ans
        if [[ "$ans" != "${ans#[Yy]}" ]]; then
            log_info "Aborted"
            exit 0
        fi
    fi
    
    remove_worktree "$name"
}

# ============================================================================
# Command: List
# ============================================================================

cmd_list() {
    log_header "Active Worktrees"
    
    if [[ ! -d "$WORKTREE_DIR" ]]; then
        log_info "No worktrees found (directory $WORKTREE_DIR does not exist)"
        return 0
    fi
    
    echo ""
    printf "%-20s %-30s %s\n" "NAME" "PATH" "BRANCH"
    printf "%-20s %-30s %s\n" "----" "----" "------"
    
    for dir in "$WORKTREE_DIR"/*/; do
        if [[ -d "$dir" ]]; then
            local name=$(basename "$dir")
            local path="$dir"
            local branch=$(cd "$dir" && git branch --show-current 2>/dev/null || echo "unknown")
            printf "%-20s %-30s %s\n" "$name" "$path" "$branch"
        fi
    done
    
    echo ""
    log_info "Total: $(ls -1 "$WORKTREE_DIR" 2>/dev/null | wc -l | tr -d ' ') worktree(s)"
}

# ============================================================================
# Command: Dev
# ============================================================================

cmd_dev() {
    local name="$1"
    local app="app"
    
    # Parse app selection
    if [[ $# -gt 1 ]]; then
        app="$2"
    fi
    
    validate_worktree_name "$name"
    
    local path="$(get_worktree_path "$name")"
    
    if ! worktree_exists "$name"; then
        log_error "Worktree '$name' does not exist"
        exit 1
    fi
    
    if [[ "$app" != "app" && "$app" != "app2" ]]; then
        log_error "Invalid app: $app (must be 'app' or 'app2')"
        exit 1
    fi
    
    log_info "Starting dev server for $app in worktree '$name'"
    
    cd "${path}/${app}"
    
    if [[ "$app" == "app" ]]; then
        $PM run dev
    else
        $PM run dev:app2
    fi
}

# ============================================================================
# Command: Build
# ============================================================================

cmd_build() {
    local name="$1"
    
    validate_worktree_name "$name"
    
    local path="$(get_worktree_path "$name")"
    
    if ! worktree_exists "$name"; then
        log_error "Worktree '$name' does not exist"
        exit 1
    fi
    
    build_project "$path" "false"
}

# ============================================================================
# Command: Install
# ============================================================================

cmd_install() {
    local name="$1"
    
    validate_worktree_name "$name"
    
    local path="$(get_worktree_path "$name")"
    
    if ! worktree_exists "$name"; then
        log_error "Worktree '$name' does not exist"
        exit 1
    fi
    
    install_deps "$path" "false"
}

# ============================================================================
# Command: Check
# ============================================================================

cmd_check() {
    local name="$1"
    
    validate_worktree_name "$name"
    
    local path="$(get_worktree_path "$name")"
    
    if ! worktree_exists "$name"; then
        log_error "Worktree '$name' does not exist"
        exit 1
    fi
    
    run_check "$path"
}

# ============================================================================
# Command: Clean
# ============================================================================

cmd_clean() {
    local all="false"
    local name=""
    
    if [[ "$1" == "--all" ]]; then
        all="true"
    elif [[ -n "$1" ]]; then
        name="$1"
    fi
    
    if [[ "$all" == "true" ]]; then
        if [[ -d "$WORKTREE_DIR" ]]; then
            log_info "Removing all worktrees..."
            for dir in "$WORKTREE_DIR"/*/; do
                if [[ -d "$dir" ]]; then
                    local wname=$(basename "$dir")
                    log_info "Removing $wname..."
                    rm -rf "$dir"
                    git worktree prune 2>/dev/null || true
                fi
            done
            log_info "All worktrees removed"
        else
            log_info "No worktrees to clean"
        fi
    elif [[ -n "$name" ]]; then
        validate_worktree_name "$name"
        remove_worktree "$name"
    else
        log_error "Please specify --all or a worktree name"
        exit 1
    fi
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
    remove [name]            Remove a worktree
    list                     List all worktrees
    dev [name] [app]         Start dev server (app or app2, default: app)
    build [name]             Build project in worktree
    install [name]           Install dependencies only
    check [name]             Run full verification (lint, type-check, test)
    clean [--all|name]       Clean worktrees

${BLUE}Options:${NC}
    --no-install             Skip dependency installation
    --no-build               Skip build after setup
    --auto                   Auto-accept prompts (for scripts/CI)

${BLUE}Examples:${NC}
    # Create worktree from main branch
    ./worktree-manager.sh create feature-x main

    # Create with auto-accept and no build
    ./worktree-manager.sh create expbranch --auto --no-build

    # Start dev server in worktree
    ./worktree-manager.sh dev feature-x
    ./worktree-manager.sh dev feature-x app2

    # Remove worktree
    ./worktree-manager.sh remove feature-x

    # List all worktrees
    ./worktree-manager.sh list

    # Clean all worktrees
    ./worktree-manager.sh clean --all

${BLUE}Configuration:${NC}
    REPO_ROOT: $REPO_ROOT
    WORKTREE_DIR: $WORKTREE_DIR
    Package Manager: $PM
    Log File: $LOG_FILE

${BLUE}Notes:${NC}
    - Worktrees are stored in .worktrees/ directory at repo root
    - Each worktree is a complete copy with its own node_modules
    - Use 'dev app2' to run the React app, 'dev' or 'dev app' for Svelte
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
        list|ls)
            cmd_list "$@"
            ;;
        dev)
            cmd_dev "$@"
            ;;
        build)
            cmd_build "$@"
            ;;
        install)
            cmd_install "$@"
            ;;
        check)
            cmd_check "$@"
            ;;
        clean)
            cmd_clean "$@"
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
