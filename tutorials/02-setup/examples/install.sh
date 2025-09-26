#!/bin/bash

# Tree-sitter Installation Script

echo "🌳 Installing Tree-sitter CLI..."

if command -v npm &> /dev/null; then
    npm install -g tree-sitter-cli
elif command -v cargo &> /dev/null; then
    cargo install tree-sitter-cli  
elif command -v brew &> /dev/null; then
    brew install tree-sitter
else
    echo "❌ Please install Node.js, Rust, or Homebrew first"
    exit 1
fi

# Verify installation
if tree-sitter --version; then
    echo "✅ Tree-sitter installed successfully!"
else
    echo "❌ Installation failed"
    exit 1
fi