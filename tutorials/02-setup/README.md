# Module 2: Setup and Installation

Time to get your hands dirty! In this module, we'll install the Tree-sitter CLI and verify it's working correctly.

## 🎯 Learning Objectives

By the end of this module, you will:
- Have Tree-sitter CLI installed and working
- Know how to verify your installation
- Understand basic CLI commands available

## 📋 Prerequisites Checklist

Before we start, make sure you have:
- [ ] **Command line access** (Terminal, PowerShell, etc.)
- [ ] **One of the following package managers:**
  - **Node.js** (version 12 or higher) with npm
  - **Rust** with cargo
  - **Homebrew** (macOS)
  - **Package manager** for your Linux distribution

## 🔧 Installation Methods

### Method 1: NPM (Recommended for Beginners)

The easiest way to install Tree-sitter:

```bash
# Install globally
npm install -g tree-sitter-cli

# Verify installation
tree-sitter --version
```

**Expected output:**
```
tree-sitter 0.25.6 (bf655c0beaf4943573543fa77c58e8006ff34971)
```

### Method 2: Cargo (Rust Package Manager)

If you have Rust installed:

```bash
# Install via cargo
cargo install tree-sitter-cli

# Verify installation
tree-sitter --version
```

### Method 3: Package Managers

**macOS (Homebrew):**
```bash
brew install tree-sitter
```

**Ubuntu/Debian:**
```bash
sudo apt install tree-sitter
```

**Arch Linux:**
```bash
pacman -S tree-sitter
```

### Method 4: Build from Source

For the latest features:

```bash
git clone https://github.com/tree-sitter/tree-sitter.git
cd tree-sitter
make install
```

## ✅ Verification

Let's make sure everything is working:

### Test 1: Version Check
```bash
tree-sitter --version
```

### Test 2: Help Command
```bash
tree-sitter --help
```

**Expected output:**
```
tree-sitter 0.25.6
The command-line tool for creating and testing tree-sitter parsers

USAGE:
    tree-sitter [FLAGS] [OPTIONS] <SUBCOMMAND>

FLAGS:
    -h, --help       Prints help information
    -V, --version    Prints version information
...
```

## 🚨 Common Installation Issues

### Issue 1: `tree-sitter: command not found`

**Solutions:**
```bash
# Check if installed locally vs globally
npm list -g tree-sitter-cli

# Add to PATH if needed (adjust path for your system)
export PATH="$PATH:/usr/local/lib/node_modules/.bin"

# Or use npx
npx tree-sitter --version
```

### Issue 2: `node-gyp` Build Errors (NPM installation)

**Solutions:**
```bash
# Install build tools (Windows)
npm install -g windows-build-tools

# Install build tools (macOS)
xcode-select --install

# Install build tools (Ubuntu/Debian)
sudo apt install build-essential
```

### Issue 3: Permission Errors

**Solutions:**
```bash
# Use sudo (not recommended for global installs)
sudo npm install -g tree-sitter-cli

# Or configure npm to use different directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

## 📊 Success Checklist

Verify you can do all of these:

- [ ] ✅ `tree-sitter --version` shows version number
- [ ] ✅ `tree-sitter --help` shows help text

## ➡️ What's Next?

Excellent! You now have Tree-sitter CLI installed and ready to go. In the next module, we'll dive deep into understanding how syntax trees work by exploring existing parsers.

**[Continue to Module 3: Understanding Syntax Trees →](../03-syntax-trees/README.md)**

---

## 🎯 Module 2 Summary

**What you accomplished:**
- ✅ Installed Tree-sitter CLI
- ✅ Verified installation is working

**Key concepts learned:**
- Different installation methods for Tree-sitter CLI
- How to verify your installation
- Common installation issues and solutions

**Commands mastered:**
- `tree-sitter --version`
- `tree-sitter --help`

You're now ready to start exploring how parsers actually work! 🚀

---

## 🌐 (Optional but Powerful) Configure Global Grammar Directories

If you want the `tree-sitter` CLI to automatically recognize languages you clone (without custom scripts), you can configure a set of directories where grammar repositories live. On startup, the CLI will discover any subfolder whose name matches `tree-sitter-<language>` and (re)generate/compile it as needed.

### Step 1: Generate Your Config File
Run once:
```bash
tree-sitter init-config
```
This creates a JSON config file at one of these locations (platform dependent):
| Platform | Default Path |
|----------|--------------|
| macOS    | `~/.tree-sitter/config.json` |
| Linux    | `~/.tree-sitter/config.json` |
| Windows  | `%APPDATA%/tree-sitter/config.json` |

Open that file and look for a `parser-directories` array. You can add one or more folders where you’ll keep language repos. Example minimal content (do NOT copy verbatim if extra keys already exist—just edit the array):
```jsonc
{
  "parser-directories": [
    "/Users/you/src/tree-sitter-languages"
  ]
}
```

### Step 2: Create a Languages Folder
```bash
mkdir -p ~/src/tree-sitter-languages
```

### Step 3: Clone Grammar Repositories
Clone only what you need; you can add more later.
```bash
cd ~/src/tree-sitter-languages
git clone https://github.com/tree-sitter/tree-sitter-javascript.git
git clone https://github.com/tree-sitter/tree-sitter-python.git
git clone https://github.com/tree-sitter/tree-sitter-json.git
```

### Step 4: (Re)Start Using the CLI
The next time you invoke a grammar-aware command, the CLI will build these parsers automatically. If you just cloned them, you can force an initial parse to trigger builds:
```bash
tree-sitter parse path/to/some/file.js
```

If you see `No language found`, double‑check:
1. The grammar repo name matches `tree-sitter-<language>`
2. The directory containing those repos is listed in `parser-directories`
3. You have a working C toolchain (e.g. Xcode CLT on macOS, build-essential on Debian/Ubuntu)
4. You restarted the shell if you just installed the CLI

### Step 5: Verify Multiple Languages
```bash
tree-sitter parse examples/example.py
tree-sitter parse examples/config.json
```

### Updating Grammars Later
```bash
cd ~/src/tree-sitter-languages/tree-sitter-python
git pull --ff-only
```
Re-run a `tree-sitter parse`—the CLI will rebuild if needed.

### Adding More Languages
Simply clone additional grammars into the same directory:
```bash
git clone https://github.com/tree-sitter/tree-sitter-rust.git
```

### When to Use This Approach
Use the config-based grammar directories when you:
- Want a central cache of grammars usable across many projects
- Regularly switch between languages
- Prefer not to manage per-project Node dependencies just to parse code

Skip it if you only need grammars inside a single dedicated tool project (in that case a local script / direct dependency may be simpler).

### Troubleshooting Cheatsheet
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `No language found` | Repo not in a configured directory | Add directory to `parser-directories` |
| Build errors (C compiler missing) | Toolchain not installed | Install platform build tools |
| Old grammar behavior | Stale repo | `git pull` the grammar folder |
| New repo ignored | Name doesn’t match pattern | Rename to `tree-sitter-<lang>` |

With grammar directories configured, later modules (like Module 3) become smoother—no custom scripts required if you prefer the native workflow.