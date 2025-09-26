# Tree-sitter Quick Reference Guide

A handy reference for Tree-sitter grammar development and usage.

## 🚀 Quick Start Commands

```bash
# Install Tree-sitter CLI
npm install -g tree-sitter-cli

# Initialize new parser
tree-sitter init

# Generate parser from grammar
tree-sitter generate

# Test parser
tree-sitter test

# Parse a file
tree-sitter parse file.ext

# Parse with debug output
tree-sitter parse --debug file.ext
```

## 📝 Grammar Functions Reference

### Core Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `seq(...)` | Sequence (all must match in order) | `seq('if', $.condition, $.statement)` |
| `choice(...)` | Alternatives (any one must match) | `choice($.number, $.string, $.identifier)` |
| `repeat(...)` | Zero or more repetitions | `repeat($.statement)` |
| `repeat1(...)` | One or more repetitions | `repeat1($.digit)` |
| `optional(...)` | Optional element | `optional($.else_clause)` |
| `field('name', pattern)` | Named field | `field('name', $.identifier)` |
| `token(...)` | Single token | `token(seq('"', /[^"]*/, '"'))` |
| `token.immediate(...)` | Adjacent token | `token.immediate('++')` |

### Precedence & Associativity

| Function | Purpose | Example |
|----------|---------|---------|
| `prec(n, ...)` | Set precedence | `prec(1, $.addition)` |
| `prec.left(n, ...)` | Left associative | `prec.left(1, seq($.expr, '+', $.expr))` |
| `prec.right(n, ...)` | Right associative | `prec.right(2, seq($.expr, '=', $.expr))` |
| `prec.dynamic(n, ...)` | Dynamic precedence | `prec.dynamic(1, $.ambiguous_rule)` |

## 🎯 Common Patterns

### Binary Operators with Precedence
```javascript
binary_expression: $ => {
  const table = [
    [1, '+', '-'],          // Lowest precedence
    [2, '*', '/'],          // Higher precedence
    [3, '**']               // Highest precedence
  ];

  return choice(...table.map(([precedence, ...operators]) =>
    operators.map(operator =>
      prec.left(precedence, seq(
        field('left', $.expression),
        field('operator', operator),
        field('right', $.expression)
      ))
    )
  ).flat());
}
```

### Comma-Separated Lists
```javascript
// Helper function
function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

// Usage
parameter_list: $ => seq('(', commaSep($.parameter), ')')
```

### String Literals with Escapes
```javascript
string_literal: $ => token(seq(
  '"',
  repeat(choice(
    /[^"\\]/,                      // Normal characters
    seq('\\', choice(              // Escape sequences
      '"', '\\', '/', 'b', 'f', 'n', 'r', 't',
      seq('u', /[0-9a-fA-F]{4}/)   // Unicode escapes
    ))
  )),
  '"'
))
```

### Comments
```javascript
comment: $ => token(choice(
  seq('//', /.*/),                 // Line comment
  seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/') // Block comment
))
```

## 🔍 Query Language Reference

### Basic Query Syntax

```scheme
; Capture nodes
(function_declaration
  name: (identifier) @function.name)

; Match any node type
(call_expression
  function: (_) @function)

; Optional nodes
(function_declaration
  name: (identifier) @name
  parameters: (parameter_list)? @params)

; Repetition
(array
  (expression)+ @elements)

; Predicates
(call_expression
  function: (identifier) @func
  (#eq? @func "console"))
```

### Common Query Patterns

```scheme
; Functions
(function_declaration
  name: (identifier) @function.definition)

; Function calls
(call_expression
  function: (identifier) @function.call)

; Variables
(variable_declaration
  (variable_declarator
    name: (identifier) @variable.definition))

; String literals
(string) @string.literal

; Comments
(comment) @comment

; Keywords
["if" "else" "while" "for"] @keyword

; Operators
["+" "-" "*" "/" "="] @operator
```

## 🧪 Testing Patterns

### Test File Structure
```
================================================================================
Test name describing what's being tested
================================================================================

input code here

--------------------------------------------------------------------------------

(expected
  (syntax_tree))

================================================================================
Another test
================================================================================

more input

--------------------------------------------------------------------------------

(more_expected_output)
```

### Common Test Cases

```
================================================================================
Empty input
================================================================================



--------------------------------------------------------------------------------

(source_file)

================================================================================
Error recovery - missing semicolon
================================================================================

let x = 5
let y = 10;

--------------------------------------------------------------------------------

(source_file
  (variable_declaration
    name: (identifier)
    value: (number))
  (variable_declaration
    name: (identifier)
    value: (number)))
```

## 🔧 Debugging Commands

```bash
# Debug parsing step by step
tree-sitter parse --debug file.ext

# Generate parser with state information
tree-sitter generate --report-states-for-rule rule_name

# Test specific corpus files
tree-sitter test test/corpus/specific.txt

# Update failing tests
tree-sitter test --update

# Build WebAssembly version
tree-sitter build-wasm
```

## 🚨 Common Issues & Solutions

### Issue: ERROR nodes in output
**Cause**: Grammar doesn't handle input
**Solution**: Check grammar rules, add debug output

### Issue: Wrong operator precedence
**Cause**: Incorrect precedence values
**Solution**: Review precedence table, higher numbers = higher precedence

### Issue: Infinite recursion/stack overflow
**Cause**: Left-recursive rules without precedence
**Solution**: Use `prec.left()` or `prec.right()`

### Issue: Conflicts during generation
**Cause**: Ambiguous grammar
**Solution**: Add to `conflicts: $` array or use dynamic precedence

### Issue: Slow parsing performance
**Cause**: Excessive backtracking
**Solution**: Use `token()`, minimize ambiguity, optimize repetition

## 🎨 Grammar Best Practices

### Rule Naming
- Use `snake_case` for rule names
- Be descriptive: `function_declaration` not `func_decl`
- Group related rules: `binary_expression`, `unary_expression`

### Structure Organization
```javascript
module.exports = grammar({
  name: 'language',
  
  extras: $ => [/\s+/, $.comment],
  
  conflicts: $ => [
    // List known conflicts
  ],
  
  rules: {
    // 1. Start rule
    source_file: $ => repeat($.statement),
    
    // 2. High-level constructs
    statement: $ => choice(/* ... */),
    
    // 3. Expressions (with precedence)
    expression: $ => choice(/* ... */),
    
    // 4. Literals and terminals
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    number: $ => /\d+/,
    
    // 5. Comments and whitespace
    comment: $ => token(/* ... */)
  }
});
```

### Performance Tips
1. Use `token()` for multi-character sequences
2. Put most common alternatives first in `choice()`
3. Minimize use of `repeat()` in favor of specific rules
4. Use precedence to eliminate ambiguity
5. Group similar tokens with character classes

## 📚 Resources

- **Official Documentation**: https://tree-sitter.github.io/tree-sitter/
- **Grammar Examples**: https://github.com/tree-sitter
- **Playground**: https://tree-sitter.github.io/tree-sitter/playground
- **Community Discussions**: https://github.com/tree-sitter/tree-sitter/discussions

## 🔗 Language Bindings Quick Start

### JavaScript/Node.js
```javascript
const Parser = require('tree-sitter');
const Language = require('tree-sitter-javascript');

const parser = new Parser();
parser.setLanguage(Language);
const tree = parser.parse(sourceCode);
```

### Python
```python
import tree_sitter_languages

parser = tree_sitter_languages.get_parser('javascript')
tree = parser.parse(source_code.encode())
```

### Rust
```rust
use tree_sitter::{Language, Parser};

extern "C" { fn tree_sitter_javascript() -> Language; }

let mut parser = Parser::new();
parser.set_language(unsafe { tree_sitter_javascript() })?;
let tree = parser.parse(&source_code, None);
```

---

*This reference guide covers the most commonly used Tree-sitter features. For comprehensive documentation, see the [official Tree-sitter guide](https://tree-sitter.github.io/tree-sitter/).*