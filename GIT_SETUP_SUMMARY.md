# Git Documentation Summary

This project now includes comprehensive Git documentation to help you manage your code effectively.

## 📚 Documentation Files

### 1. **README.md** - Main Project Documentation
The main README includes:
- Project overview and features
- Installation instructions
- Development workflow
- **Git workflow section** with common commands
- Building and deployment instructions
- Troubleshooting guide

**Key Git Sections:**
- Initial setup for new repositories
- Daily development workflow
- Common Git commands
- Commit message guidelines

### 2. **GIT_GUIDE.md** - Comprehensive Git Reference
A complete Git command reference including:
- Initial setup and configuration
- Daily workflow commands
- Branching and merging
- Viewing history
- Undoing changes
- Stashing (temporary storage)
- Remote repositories
- Tagging for versions
- Useful workflows (feature development, bug fixes)
- Commit message best practices
- Troubleshooting common issues
- GitHub-specific commands
- Git aliases (shortcuts)
- Quick tips

### 3. **setup-git.sh** - Interactive Setup Script
An executable bash script that:
- ✅ Checks if Git is installed
- ✅ Initializes Git repository
- ✅ Configures user name and email
- ✅ Creates initial commit
- ✅ Sets up main branch
- ✅ Adds GitHub remote (optional)
- ✅ Pushes to GitHub (optional)

**Usage:**
```bash
./setup-git.sh
```

### 4. **.gitignore** - Enhanced Exclusion Rules
Updated to exclude:
- Node modules and dependencies
- Build outputs (dist, Android builds)
- Environment files (.env)
- Editor files (.vscode, .idea)
- Android-specific files (APK, AAB, gradle)
- OS files (.DS_Store, Thumbs.db)
- Temporary files

## 🚀 Quick Start with Git

### Option 1: Use the Setup Script (Easiest)

```bash
# Make script executable (already done)
chmod +x setup-git.sh

# Run the script
./setup-git.sh

# Follow the prompts
```

### Option 2: Manual Setup

```bash
# Initialize Git
git init

# Configure your identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Insulin Calculator Android App"

# Set main branch
git branch -M main

# Add GitHub remote (create repo on GitHub first)
git remote add origin https://github.com/yourusername/insulin-calculator-android.git

# Push to GitHub
git push -u origin main
```

## 📖 Common Workflows

### Daily Development

```bash
# 1. Check what changed
git status

# 2. Add your changes
git add .

# 3. Commit with a message
git commit -m "Add new feature"

# 4. Push to GitHub
git push
```

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/new-calculator-mode

# 2. Make changes and commit
git add .
git commit -m "Add new calculator mode"

# 3. Push feature branch
git push -u origin feature/new-calculator-mode

# 4. Merge to main (after testing)
git checkout main
git merge feature/new-calculator-mode
git push

# 5. Delete feature branch
git branch -d feature/new-calculator-mode
```

### Bug Fix

```bash
# 1. Create bugfix branch
git checkout -b bugfix/fix-storage-error

# 2. Fix and commit
git add src/utils/storage.js
git commit -m "Fix storage quota exceeded error"

# 3. Merge to main
git checkout main
git merge bugfix/fix-storage-error
git push
```

## 🎯 Commit Message Guidelines

Use clear, descriptive messages following this format:

```
<type>: <subject>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```bash
git commit -m "feat: Add PDF export functionality"
git commit -m "fix: Resolve storage quota error"
git commit -m "docs: Update README with Git instructions"
git commit -m "refactor: Simplify calculator logic"
```

## 🔧 Useful Git Commands

```bash
# View status
git status

# View changes
git diff

# View history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git checkout -- filename

# Stash changes temporarily
git stash
git stash pop

# Pull latest changes
git pull

# View branches
git branch -a
```

## 🆘 Troubleshooting

### "Not a git repository" error
```bash
# Initialize Git first
git init
```

### Push rejected
```bash
# Pull latest changes first
git pull --rebase origin main
git push
```

### Merge conflicts
```bash
# 1. Check conflicted files
git status

# 2. Edit files to resolve conflicts
# Look for <<<<<<< markers

# 3. Add resolved files
git add resolved-file.js

# 4. Complete merge
git commit -m "Resolve merge conflict"
```

### Accidentally committed wrong files
```bash
# Undo last commit, keep changes
git reset --soft HEAD~1

# Remove file from staging
git reset HEAD filename

# Commit again with correct files
git add correct-files
git commit -m "Correct commit"
```

## 📝 Best Practices

1. **Commit Often**: Make small, focused commits
2. **Write Clear Messages**: Describe what and why, not how
3. **Pull Before Push**: Stay up to date to avoid conflicts
4. **Use Branches**: Keep main clean, experiment in branches
5. **Review Changes**: Use `git diff` before committing
6. **Never Commit Secrets**: No API keys, passwords, or tokens
7. **Use .gitignore**: Exclude build files and dependencies

## 🌐 GitHub Integration

### Create Repository on GitHub

1. Go to https://github.com/new
2. Enter repository name: `insulin-calculator-android`
3. Don't initialize with README (we already have one)
4. Click "Create repository"
5. Copy the repository URL

### Connect Local to GitHub

```bash
# Add remote
git remote add origin https://github.com/yourusername/insulin-calculator-android.git

# Push to GitHub
git push -u origin main
```

### Clone Existing Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/insulin-calculator-android.git

# Navigate to directory
cd insulin-calculator-android

# Install dependencies
npm install
```

## 📚 Additional Resources

- **README.md**: Full project documentation
- **GIT_GUIDE.md**: Detailed Git command reference
- **setup-git.sh**: Automated setup script
- **.gitignore**: Files to exclude from Git

## 🎓 Learning Resources

- [Git Official Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Interactive Git Tutorial](https://learngitbranching.js.org/)

## ✅ Next Steps

1. **Initialize Git** (if not done):
   ```bash
   ./setup-git.sh
   ```

2. **Make your first commit**:
   ```bash
   git add .
   git commit -m "Initial commit"
   ```

3. **Push to GitHub**:
   ```bash
   git push -u origin main
   ```

4. **Start developing**:
   - Create feature branches
   - Commit regularly
   - Push to GitHub for backup

---

**Need Help?** Check the GIT_GUIDE.md for detailed command reference or README.md for project-specific workflows.
