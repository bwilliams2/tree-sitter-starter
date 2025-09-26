# Exercise Solutions - Module 2

## Exercise 1: Installation

**Commands should show:**
- `tree-sitter --version` → `tree-sitter 0.25.6 (...)`
- `tree-sitter --help` → List of available commands

**Test script should show:**
- ✅ Tree-sitter version
- ✅ Help command works  
- ✅ Generate command available

## Exercise 2: First Parser Project

**Files created:**
- `grammar.js` - Empty grammar template
- `package.json` - NPM configuration
- `binding.gyp` - C compilation configuration

**After `tree-sitter generate`:**
- `src/` directory with C parser code
- `parser.c` and header files

## Exercise 3: Simple Test

**Expected result:** "No language found" error

**Why:** The grammar is empty, so no parser exists yet. This is normal! You'll learn to write grammar rules in Module 5.