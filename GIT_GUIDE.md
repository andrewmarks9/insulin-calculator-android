# Git Quick Reference Guide

A handy reference for common Git commands used in this project.

## Initial Setup

### First Time Git Setup (One-time only)

```bash
# Set your name and email (shows in commits)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Check your configuration
git config --list
```

### Initialize Repository (If not already done)

```bash
# Initialize Git in your project
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit"

# Connect to GitHub (create repo on GitHub first)
git remote add origin https://github.com/yourusername/insulin-calculator-android.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Daily Workflow

### Check Status

```bash
# See what files have changed
git status

# See detailed changes
git diff

# See changes in a specific file
git diff src/App.jsx
```

### Save Your Work

```bash
# Add specific files to staging
git add src/App.jsx
git add src/utils/storage.js

# Add all changed files
git add .

# Add all files in a directory
git add src/

# Commit with a message
git commit -m "Add improved error handling"

# Add and commit in one step (only for tracked files)
git commit -am "Quick fix for bug"
```

### Push to GitHub

```bash
# Push to remote repository
git push

# First time pushing a new branch
git push -u origin branch-name

# Force push (use with caution!)
git push --force
```

### Get Latest Changes

```bash
# Download and merge changes from GitHub
git pull

# Download changes without merging
git fetch

# See what would be pulled
git fetch --dry-run
```

## Branching

### Create and Switch Branches

```bash
# Create a new branch
git branch feature/new-feature

# Switch to a branch
git checkout feature/new-feature

# Create and switch in one command
git checkout -b feature/new-feature

# List all branches
git branch

# List all branches including remote
git branch -a

# Delete a branch
git branch -d feature/old-feature

# Force delete a branch
git branch -D feature/old-feature
```

### Merging

```bash
# Switch to main branch
git checkout main

# Merge feature branch into main
git merge feature/new-feature

# Abort a merge if there are conflicts
git merge --abort
```

## Viewing History

```bash
# View commit history
git log

# View compact history
git log --oneline

# View last 5 commits
git log -5

# View history with graph
git log --graph --oneline --all

# View changes in a commit
git show commit-hash

# View who changed what in a file
git blame src/App.jsx
```

## Undoing Changes

### Discard Local Changes

```bash
# Discard changes in a specific file
git checkout -- src/App.jsx

# Discard all local changes
git checkout -- .

# Remove untracked files
git clean -f

# Remove untracked files and directories
git clean -fd

# Preview what would be removed
git clean -n
```

### Undo Commits

```bash
# Undo last commit, keep changes
git reset --soft HEAD~1

# Undo last commit, discard changes
git reset --hard HEAD~1

# Undo last 3 commits, keep changes
git reset --soft HEAD~3

# Revert a specific commit (creates new commit)
git revert commit-hash
```

### Fix Last Commit

```bash
# Change last commit message
git commit --amend -m "New commit message"

# Add forgotten files to last commit
git add forgotten-file.js
git commit --amend --no-edit
```

## Stashing (Temporary Storage)

```bash
# Save current changes temporarily
git stash

# Save with a description
git stash save "Work in progress on feature X"

# List all stashes
git stash list

# Apply most recent stash
git stash apply

# Apply and remove most recent stash
git stash pop

# Apply a specific stash
git stash apply stash@{2}

# Delete a stash
git stash drop stash@{0}

# Delete all stashes
git stash clear
```

## Remote Repositories

```bash
# View remote repositories
git remote -v

# Add a remote
git remote add origin https://github.com/user/repo.git

# Change remote URL
git remote set-url origin https://github.com/user/new-repo.git

# Remove a remote
git remote remove origin

# Fetch from remote
git fetch origin

# Pull from specific branch
git pull origin main
```

## Tagging (Versions)

```bash
# Create a tag
git tag v1.0.0

# Create an annotated tag
git tag -a v1.0.0 -m "Version 1.0.0 release"

# List all tags
git tag

# Push tags to remote
git push --tags

# Delete a tag
git tag -d v1.0.0

# Delete remote tag
git push origin :refs/tags/v1.0.0
```

## Useful Workflows

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/pdf-export

# 2. Make changes and commit
git add .
git commit -m "Add PDF export functionality"

# 3. Push to GitHub
git push -u origin feature/pdf-export

# 4. Switch back to main
git checkout main

# 5. Merge feature (after testing)
git merge feature/pdf-export

# 6. Push main
git push

# 7. Delete feature branch
git branch -d feature/pdf-export
```

### Bug Fix

```bash
# 1. Create bugfix branch
git checkout -b bugfix/storage-error

# 2. Fix the bug and commit
git add src/utils/storage.js
git commit -m "Fix storage quota exceeded error"

# 3. Push and merge
git push -u origin bugfix/storage-error
git checkout main
git merge bugfix/storage-error
git push

# 4. Clean up
git branch -d bugfix/storage-error
```

### Sync Fork with Original

```bash
# 1. Add upstream remote (one time)
git remote add upstream https://github.com/original/repo.git

# 2. Fetch upstream changes
git fetch upstream

# 3. Merge into your main
git checkout main
git merge upstream/main

# 4. Push to your fork
git push origin main
```

## Commit Message Best Practices

### Format

```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
git commit -m "feat: Add PDF export with custom filename"

git commit -m "fix: Resolve storage quota exceeded error"

git commit -m "docs: Update README with Git instructions"

git commit -m "refactor: Simplify calculator logic"

git commit -m "style: Format code with prettier"

git commit -m "chore: Update dependencies"
```

## Troubleshooting

### Merge Conflicts

```bash
# 1. When conflict occurs, check status
git status

# 2. Open conflicted files and resolve
# Look for <<<<<<< HEAD markers

# 3. After resolving, add files
git add resolved-file.js

# 4. Complete the merge
git commit -m "Resolve merge conflict"
```

### Accidentally Committed to Wrong Branch

```bash
# 1. Copy the commit hash
git log --oneline

# 2. Switch to correct branch
git checkout correct-branch

# 3. Cherry-pick the commit
git cherry-pick commit-hash

# 4. Go back and remove from wrong branch
git checkout wrong-branch
git reset --hard HEAD~1
```

### Pushed Wrong Code

```bash
# If no one else has pulled yet
git revert HEAD
git push

# Or force push (dangerous!)
git reset --hard HEAD~1
git push --force
```

## GitHub Specific

### Clone Repository

```bash
# Clone via HTTPS
git clone https://github.com/user/repo.git

# Clone via SSH
git clone git@github.com:user/repo.git

# Clone specific branch
git clone -b branch-name https://github.com/user/repo.git
```

### Pull Requests

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and push
git push -u origin feature/new-feature

# 3. Go to GitHub and create Pull Request

# 4. After PR is merged, update local main
git checkout main
git pull
git branch -d feature/new-feature
```

## Aliases (Shortcuts)

Add these to your `~/.gitconfig` file:

```bash
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --graph --oneline --all
    amend = commit --amend --no-edit
```

Usage:
```bash
git st          # Instead of git status
git co main     # Instead of git checkout main
git br          # Instead of git branch
git ci -m "msg" # Instead of git commit -m "msg"
```

## Quick Tips

1. **Commit often**: Small, focused commits are better than large ones
2. **Write clear messages**: Future you will thank present you
3. **Pull before push**: Avoid conflicts by staying up to date
4. **Use branches**: Keep main clean, experiment in branches
5. **Review before commit**: Use `git diff` to check your changes
6. **Don't commit secrets**: Never commit API keys, passwords, etc.
7. **Use .gitignore**: Exclude build files, dependencies, etc.

## Help

```bash
# Get help for any command
git help <command>
git <command> --help

# Examples
git help commit
git push --help
```

---

**Pro Tip**: Create a `.gitignore` file to exclude files you never want to commit:

```
node_modules/
dist/
.env
.DS_Store
*.log
```
