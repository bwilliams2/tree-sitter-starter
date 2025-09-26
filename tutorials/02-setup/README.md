# Module 2: Setup and Installation

Time to get your hands dirty! In this module, we'll install Tree-sitter and set up your development environment for parser development.

## 🎯 Learning Objectives

By the end of this module, you will:
- Have Tree-sitter CLI installed and working
- Understand the Tree-sitter development workflow
- Successfully run your first Tree-sitter commands
- Have a proper development environment setup

## 📋 Prerequisites Checklist

Before we start, make sure you have:
- [ ] **Command line access** (Terminal, PowerShell, etc.)
- [ ] **Node.js** installed (version 12 or higher)
- [ ] **Git** installed
- [ ] **A text editor** (VS Code, Vim, Emacs, etc.)
- [ ] **C compiler** (gcc, clang, or Visual Studio)

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

### Test 3: Quick Parse Test
```bash
# Create a test file
echo "console.log('Hello, Tree-sitter!');" > test.js

# Parse it (this will fail gracefully if no JavaScript parser is installed)
tree-sitter parse test.js
```

## 📁 Setting Up Your Workspace

Let's create a dedicated workspace for your Tree-sitter learning:

```bash
# Create and navigate to workspace
mkdir tree-sitter-learning
cd tree-sitter-learning

# Create directory structure
mkdir -p {parsers,examples,playground}

# Your workspace is ready!
```

**Directory structure:**
```
tree-sitter-learning/
├── parsers/          # Your custom parsers
├── examples/         # Code samples to test with
└── playground/       # Experimentation space
```

## 🎮 Your First Tree-sitter Commands

### 1. Initialize a New Parser Project

```bash
cd parsers
tree-sitter init-config-file
tree-sitter init-config-file
```

This creates a `tree-sitter-config.json` file with default settings.

### 2. Generate a Parser

Let's start with a simple example:

```bash
# Create a new parser directory
mkdir my-first-parser
cd my-first-parser

# Initialize the parser
tree-sitter init
```

**What this creates:**
- `grammar.js` - Your grammar definition
- `package.json` - NPM package configuration  
- `binding.gyp` - Node.js native module configuration
- `src/` directory - Generated parser source code

### 3. Explore an Existing Parser

Download and explore a simple existing parser:

```bash
# Clone a simple parser (JSON)
git clone https://github.com/tree-sitter/tree-sitter-json.git
cd tree-sitter-json

# Look at the grammar
cat grammar.js
```

## 🔍 Understanding the Workflow

The Tree-sitter development cycle:

```
1. Write Grammar     2. Generate Parser    3. Test Parser
   (grammar.js)         (tree-sitter         (tree-sitter
                        generate)            parse/test)
       │                    │                     │
       └────────────────────┼─────────────────────┘
                           │
                    4. Iterate and Improve
```

### Step-by-Step Example

Let's walk through creating a tiny parser:

#### Step 1: Define Grammar
Create `grammar.js`:
```javascript
module.exports = grammar({
  name: 'simple_math',
  
  rules: {
    expression: $ => choice(
      $.number,
      $.addition
    ),
    
    number: $ => /\d+/,
    
    addition: $ => seq(
      $.number,
      '+',
      $.number
    )
  }
});
```

#### Step 2: Generate Parser
```bash
tree-sitter generate
```

#### Step 3: Test Parser
```bash
# Create test input
echo "5 + 3" > test.txt

# Parse it
tree-sitter parse test.txt
```

**Expected output:**
```
(expression
  (addition
    (number)
    (number)))
```

## 🛠️ Development Environment Setup

### VS Code Extensions
Install helpful extensions:
- **Tree-sitter**: Syntax highlighting for grammar files
- **Language Support**: For languages you're working with

### Editor Configuration

**VS Code settings.json:**
```json
{
  "files.associations": {
    "grammar.js": "javascript",
    "*.scm": "scheme"
  }
}
```

**Vim configuration:**
```vim
" Add to .vimrc
au BufRead,BufNewFile grammar.js set filetype=javascript
au BufRead,BufNewFile *.scm set filetype=scheme
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

### Issue 2: `node-gyp` Build Errors

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

## 🧪 Testing Your Setup

Let's run through a comprehensive test to make sure everything works:

### Create Test Files
```bash
# JavaScript test
echo "function test() { return 42; }" > test.js

# Python test  
echo "def test(): return 42" > test.py

# JSON test
echo '{"name": "test", "value": 42}' > test.json
```

### Test Parsing
```bash
# These might not work yet (parsers not installed)
# But they should show helpful error messages
tree-sitter parse test.js
tree-sitter parse test.py  
tree-sitter parse test.json
```

### Install Sample Parsers
```bash
# Install some common parsers for testing
npm install tree-sitter-javascript
npm install tree-sitter-python
npm install tree-sitter-json
```

## 📊 Success Checklist

Verify you can do all of these:

- [ ] ✅ `tree-sitter --version` shows version number
- [ ] ✅ `tree-sitter --help` shows help text
- [ ] ✅ Can create new parser with `tree-sitter init`  
- [ ] ✅ Can generate parser with `tree-sitter generate`
- [ ] ✅ Can parse files with `tree-sitter parse`
- [ ] ✅ Have workspace directory created
- [ ] ✅ Text editor configured for grammar development

## 💡 Pro Tips

1. **Use Version Control**: Always use git for your parser projects
2. **Incremental Development**: Start with simple rules and add complexity gradually
3. **Test Early and Often**: Use `tree-sitter parse` constantly during development
4. **Study Existing Parsers**: The Tree-sitter org has excellent examples
5. **Join the Community**: The Tree-sitter discussions are very helpful

## 🔧 Optional: Advanced Setup

### Language Server Support
For advanced editor integration:

```bash
# Install tree-sitter language server
npm install -g @tree-sitter/cli
```

### Build Automation
Create a `Makefile` for your parser projects:

```makefile
.PHONY: generate test clean

generate:
	tree-sitter generate

test:
	tree-sitter test

clean:
	rm -rf src/

build: generate
	tree-sitter build-wasm
```

## 🔍 Troubleshooting

### Debug Mode
Enable verbose output for troubleshooting:

```bash
tree-sitter --debug parse file.txt
```

### Check Configuration
View current configuration:

```bash
tree-sitter dump-config
```

## ➡️ What's Next?

Excellent! You now have Tree-sitter installed and ready to go. In the next module, we'll dive deep into understanding how syntax trees work by exploring existing parsers.

**[Continue to Module 3: Understanding Syntax Trees →](../03-syntax-trees/README.md)**

---

## 🎯 Module 2 Summary

**What you accomplished:**
- ✅ Installed Tree-sitter CLI
- ✅ Set up development environment  
- ✅ Ran your first Tree-sitter commands
- ✅ Created a workspace structure
- ✅ Learned the basic development workflow

**Key concepts learned:**
- Tree-sitter development cycle (write → generate → test → iterate)
- Common CLI commands (`generate`, `parse`, `test`)
- Project structure and configuration files

**Commands mastered:**
- `tree-sitter --version`
- `tree-sitter --help` 
- `tree-sitter init`
- `tree-sitter generate`
- `tree-sitter parse`

You're now ready to start exploring how parsers actually work! 🚀