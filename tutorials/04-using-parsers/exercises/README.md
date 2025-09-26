# Module 4 Exercises

Practice using Tree-sitter parsers in applications.

## Exercise 1: Basic Parser Setup

Install dependencies and run the examples:
```bash
npm install tree-sitter tree-sitter-javascript
node examples/basic-parser.js
node examples/code-analyzer.js
```

## Exercise 2: Write Simple Queries

Create Tree-sitter queries to find:
1. All function names: `(function_declaration name: (identifier) @name)`
2. All string literals: `(string) @string`
3. All if statements: `(if_statement) @if`

Test your queries with the provided examples.

## Exercise 3: Build a Function Lister

Write a script that:
1. Parses JavaScript code
2. Lists all functions with their parameter counts
3. Shows which functions call other functions

## Exercise 4: Code Metrics Tool

Extend the analyzer to calculate:
- Lines of code
- Function count
- Variable count  
- Cyclomatic complexity (count if/while/for statements)

## Solutions

Check the `solutions/` directory for complete implementations.