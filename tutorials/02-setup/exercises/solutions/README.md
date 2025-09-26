# Exercise Solutions - Module 2

## Exercise 1: Installation

**Commands should show:**
- `tree-sitter --version` → `tree-sitter 0.25.6 (...)`
- `tree-sitter --help` → List of available commands

**Test script should show:**
- ✅ Tree-sitter version
- ✅ Help command works  
- ✅ Generate command available

## Exercise 2: Manual Installation

**Different methods should result in:**
- Same version number from `tree-sitter --version`
- Same functionality available

**Common differences:**
- Installation path may vary
- Some methods (npm) may install development dependencies
- Performance may vary slightly between implementations

## Exercise 3: Command Exploration

**Available subcommands include:**
- `init` - Initialize a new parser project
- `generate` - Generate parser code from grammar
- `build-wasm` - Build WebAssembly parser
- `test` - Run parser tests
- `parse` - Parse files and output syntax trees
- `query` - Run tree queries on parsed files
- `highlight` - Generate syntax highlighting
- `tags` - Generate tag files

**Key commands for parser development:**
- `init` and `generate` - Core development workflow
- `test` and `parse` - Testing and debugging
- `query` - Advanced tree analysis