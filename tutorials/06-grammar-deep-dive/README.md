# Module 6: Grammar Deep Dive

Now that you've built your first parser, let's explore advanced grammar features that will let you handle complex, real-world language constructs with confidence.

## 🎯 Learning Objectives

By the end of this module, you will:
- Master advanced Tree-sitter grammar functions and techniques
- Handle complex parsing scenarios like ambiguous grammars
- Implement error recovery strategies
- Work with external scanners for complex tokenization
- Optimize grammar performance
- Handle language injection and embedding

## 🔧 Advanced Grammar Functions

### Precedence Control

Beyond basic `prec.left()` and `prec.right()`, Tree-sitter offers fine-grained precedence control:

#### Dynamic Precedence
```javascript
// Handle cases where static precedence isn't enough
expression: $ => choice(
  prec.dynamic(1, $.function_call),    // Higher dynamic precedence
  prec.dynamic(0, $.variable_access),  // Lower dynamic precedence
  $.number
)
```

#### Precedence with Conflicts
```javascript
// When grammar has inherent ambiguities
statement: $ => choice(
  prec(1, $.if_statement),      // Prefer if statements
  prec(0, $.expression_statement)
),

if_statement: $ => seq(
  'if',
  $.expression,
  $.statement,
  optional(seq('else', $.statement))  // Classic if-else ambiguity
)
```

### Advanced Repetition Patterns

#### Separated Lists
```javascript
// Common pattern: comma-separated items
parameter_list: $ => seq(
  '(',
  optional(seq(
    $.parameter,
    repeat(seq(',', $.parameter))
  )),
  ')'
),

// More concise with helper
parameter_list: $ => seq(
  '(',
  optional(commaSep1($.parameter)),
  ')'
),

// Helper function (add outside grammar object)
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
```

#### Trailing Separators
```javascript
// Allow optional trailing comma
array_literal: $ => seq(
  '[',
  optional(seq(
    $.expression,
    repeat(seq(',', $.expression)),
    optional(',')  // Trailing comma
  )),
  ']'
)
```

### Field Management

#### Conditional Fields
```javascript
function_declaration: $ => seq(
  optional(field('async', 'async')),
  'function',
  optional(field('name', $.identifier)),  // Anonymous functions
  field('parameters', $.parameter_list),
  field('body', $.block)
)
```

#### Multiple Fields with Same Name
```javascript
// Multiple imports in a single statement
import_statement: $ => seq(
  'import',
  choice(
    field('import', $.identifier),                    // import foo
    field('import', $.import_specifier_list)          // import { a, b }
  ),
  'from',
  field('source', $.string)
)
```

## 🚨 Handling Ambiguous Grammars

Real languages often have ambiguities that need special handling:

### The Dangling Else Problem

**Problem**: `if (a) if (b) foo; else bar;`
- Could be: `if (a) { if (b) foo; else bar; }`
- Or: `if (a) { if (b) foo; } else bar;`

**Solution**:
```javascript
if_statement: $ => prec.right(seq(
  'if',
  '(',
  field('condition', $.expression),
  ')',
  field('consequence', $.statement),
  optional(seq(
    'else',
    field('alternative', $.statement)
  ))
)),

// Use prec.right to bind else to nearest if
```

### Expression vs Statement Ambiguity

**Problem**: `{ foo }` could be a block or object literal

**Solution**: Use conflicts and dynamic precedence
```javascript
module.exports = grammar({
  // ...
  conflicts: $ => [
    [$.block_statement, $.object_literal]
  ],
  
  rules: {
    primary_expression: $ => choice(
      prec.dynamic(1, $.object_literal),
      // ... other expressions
    ),
    
    statement: $ => choice(
      prec.dynamic(2, $.block_statement),  // Prefer block in statement context
      $.expression_statement,
      // ... other statements
    )
  }
});
```

### Function Call vs Declaration

**Problem**: Languages where `func()` could be call or declaration

**Solution**: Context-dependent parsing
```javascript
statement: $ => choice(
  prec(2, $.function_declaration),  // Higher precedence in statement context
  $.expression_statement
),

expression: $ => choice(
  prec(1, $.function_call),         // Lower precedence in expression context
  // ... other expressions
)
```

## 🔍 External Scanners

For complex tokenization that can't be handled by regular expressions:

### When to Use External Scanners

1. **Context-sensitive tokenization** (Python indentation)
2. **Complex string interpolation** (JavaScript templates)
3. **Heredoc strings** (Bash, PHP)
4. **Significant whitespace** (Python, YAML)

### Basic External Scanner Setup

Create `src/scanner.c`:
```c
#include <tree_sitter/parser.h>
#include <wctype.h>

enum TokenType {
  INDENT,
  DEDENT,
  NEWLINE
};

void *tree_sitter_language_external_scanner_create() {
  return NULL;  // No state needed for this example
}

bool tree_sitter_language_external_scanner_scan(
    void *payload,
    TSLexer *lexer,
    const bool *valid_symbols
) {
  if (valid_symbols[INDENT] && lexer->lookahead == ' ') {
    // Count indentation spaces
    int spaces = 0;
    while (lexer->lookahead == ' ') {
      spaces++;
      lexer->advance(lexer, false);
    }
    
    if (spaces > 0) {
      lexer->result_symbol = INDENT;
      return true;
    }
  }
  
  return false;
}

// Other required functions...
void tree_sitter_language_external_scanner_destroy(void *payload) {}
unsigned tree_sitter_language_external_scanner_serialize(void *payload, char *buffer) { return 0; }
void tree_sitter_language_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {}
```

### Grammar Integration
```javascript
module.exports = grammar({
  name: 'indented_language',
  
  externals: $ => [
    $.indent,
    $.dedent,
    $.newline
  ],
  
  rules: {
    source_file: $ => repeat($.statement),
    
    block: $ => seq(
      $.indent,
      repeat1($.statement),
      $.dedent
    ),
    
    if_statement: $ => seq(
      'if',
      $.expression,
      ':',
      $.newline,
      $.block
    )
  }
});
```

## 🎭 Error Recovery Strategies

Tree-sitter's error recovery can be influenced by your grammar design:

### Explicit Error Recovery Rules

```javascript
statement: $ => choice(
  $.variable_declaration,
  $.function_declaration,
  $.expression_statement,
  $.error_recovery_statement  // Catch-all for malformed statements
),

error_recovery_statement: $ => seq(
  $.error,
  choice(';', '\n', 'EOF')  // Recover at statement boundaries
)
```

### Robust List Parsing

```javascript
// Instead of simple repeat, use error-resistant patterns
statement_list: $ => choice(
  $.empty,
  seq(
    $.statement,
    optional(seq(
      repeat(choice(
        $.statement,
        $.error  // Allow errors between statements
      )),
      optional($.statement)
    ))
  )
)
```

### Recovery Anchors

Use common tokens as recovery points:
```javascript
class_body: $ => seq(
  '{',
  repeat(choice(
    $.method_declaration,
    $.field_declaration,
    seq($.error, choice('}', '\n'))  // Recover at newlines or closing brace
  )),
  '}'
)
```

## 💬 Comments and Documentation

### Simple Comments
```javascript
comment: $ => token(choice(
  seq('//', /.*/),                    // Line comment
  seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')  // Block comment
))
```

### Nested Comments
```javascript
// For languages with nested block comments (like Rust)
comment: $ => token(choice(
  seq('//', /.*/),
  $.block_comment
)),

block_comment: $ => seq(
  '/*',
  repeat(choice(
    /[^*\/]+/,        // Non-star, non-slash characters
    /\*[^\/]/,        // Star followed by non-slash
    /\/[^\*]/,        // Slash followed by non-star
    $.block_comment   // Recursive for nesting
  )),
  '*/'
)
```

### Documentation Comments
```javascript
// Special handling for doc comments
doc_comment: $ => token(seq(
  choice('///', '/**'),
  /.*/
)),

// Include in extras for automatic handling
extras: $ => [
  /\s+/,
  $.comment,
  $.doc_comment
]
```

## 🎯 Language-Specific Patterns

### String Interpolation

**JavaScript Template Literals**:
```javascript
template_literal: $ => seq(
  '`',
  repeat(choice(
    $.template_chars,
    $.template_substitution
  )),
  '`'
),

template_substitution: $ => seq(
  '${',
  $.expression,
  '}'
),

template_chars: $ => token.immediate(prec(1, /[^`$]+/))
```

### Operator Overloading Syntax

**For languages like C++**:
```javascript
operator_declaration: $ => seq(
  'operator',
  field('operator', choice(
    '+', '-', '*', '/', '=',
    '==', '!=', '<', '>',
    '[]', '()',
    token(seq('operator', /\s+/, choice('new', 'delete')))
  )),
  $.parameter_list,
  $.function_body
)
```

### Macro Systems

**For languages like Rust**:
```javascript
macro_invocation: $ => seq(
  field('path', $.identifier),
  '!',
  choice(
    seq('(', optional($.token_tree), ')'),
    seq('[', optional($.token_tree), ']'),
    seq('{', optional($.token_tree), '}')
  )
),

token_tree: $ => repeat1(choice(
  $.token,
  seq('(', optional($.token_tree), ')'),
  seq('[', optional($.token_tree), ']'),
  seq('{', optional($.token_tree), '}')
))
```

## 🔧 Performance Optimization

### Minimize Backtracking

**Bad**: Ambiguous patterns that require backtracking
```javascript
// This creates exponential parsing time
expression: $ => choice(
  seq($.expression, '+', $.expression),
  seq($.expression, '*', $.expression),
  $.number
)
```

**Good**: Use precedence to eliminate ambiguity
```javascript
expression: $ => choice(
  $.binary_expression,
  $.number
),

binary_expression: $ => choice(
  prec.left(1, seq($.expression, '+', $.expression)),
  prec.left(2, seq($.expression, '*', $.expression))
)
```

### Token Optimization

Use `token()` for multi-character sequences:
```javascript
// Bad: Each character is a separate token
arrow_function: $ => seq('=', '>', $.expression),

// Good: Arrow is a single token
arrow_function: $ => seq(token('=>'), $.expression)
```

### Immediate Tokens

Use `token.immediate()` for tokens that must be adjacent:
```javascript
// In template literals, substitution must immediately follow $
template_substitution: $ => seq(
  '$',
  token.immediate('{'),
  $.expression,
  '}'
)
```

## 🔄 Language Injection

Handle embedded languages (like SQL in strings, HTML in templates):

### Basic Injection Setup
```javascript
// In grammar.js
sql_string: $ => seq(
  'SQL`',
  field('content', $.sql_content),
  '`'
),

sql_content: $ => /[^`]*/  // Simple content match
```

### Advanced Injection with Proper Parsing

For complex embedded languages, use language injection:

```javascript
// In queries/injections.scm
((sql_string
  content: (sql_content) @sql))

; This tells Tree-sitter to parse the content as SQL
```

## 🧪 Real-World Example: JSON with Comments

Let's build a JSON parser that supports comments:

```javascript
module.exports = grammar({
  name: 'jsonc',  // JSON with Comments
  
  extras: $ => [
    /\s+/,
    $.comment
  ],
  
  rules: {
    document: $ => $.value,
    
    value: $ => choice(
      $.object,
      $.array,
      $.string,
      $.number,
      $.boolean,
      $.null
    ),
    
    object: $ => seq(
      '{',
      optional(seq(
        $.pair,
        repeat(seq(',', $.pair)),
        optional(',')  // Allow trailing comma
      )),
      '}'
    ),
    
    pair: $ => seq(
      field('key', choice($.string, $.identifier)),  // Allow unquoted keys
      ':',
      field('value', $.value)
    ),
    
    array: $ => seq(
      '[',
      optional(seq(
        $.value,
        repeat(seq(',', $.value)),
        optional(',')
      )),
      ']'
    ),
    
    string: $ => seq(
      '"',
      repeat(choice(
        /[^"\\]/,                    // Regular characters
        seq('\\', choice(
          '"', '\\', '/', 'b', 'f', 'n', 'r', 't',
          seq('u', /[0-9a-fA-F]{4}/)  // Unicode escapes
        ))
      )),
      '"'
    ),
    
    number: $ => {
      const digits = /[0-9]+/;
      const frac = seq('.', digits);
      const exp = seq(choice('e', 'E'), optional(choice('+', '-')), digits);
      
      return token(seq(
        optional('-'),
        choice('0', seq(/[1-9]/, optional(digits))),
        optional(frac),
        optional(exp)
      ));
    },
    
    boolean: $ => choice('true', 'false'),
    null: $ => 'null',
    
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,  // For unquoted keys
    
    comment: $ => token(choice(
      seq('//', /.*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')
    ))
  }
});
```

## 🎮 Advanced Exercises

### Exercise 1: Python-like Indentation

Implement a language with significant whitespace:
```python
if condition:
    do_something()
    if nested:
        nested_action()
    back_to_original_level()
```

### Exercise 2: C-style Preprocessor

Handle preprocessor directives:
```c
#include <stdio.h>
#ifdef DEBUG
    #define LOG(msg) printf(msg)
#else
    #define LOG(msg)
#endif

int main() {
    LOG("Hello, world!");
    return 0;
}
```

### Exercise 3: Template Language

Create a template parser with embedded expressions:
```html
<div class="{{className}}">
    {{#if user}}
        Hello, {{user.name}}!
    {{else}}
        Please log in.
    {{/if}}
</div>
```

## ➡️ What's Next?

Excellent! You now have mastery over advanced grammar techniques. In the next module, we'll learn how to thoroughly test and debug your parsers to ensure they work correctly in all scenarios.

**[Continue to Module 7: Testing and Debugging →](../07-testing-debugging/README.md)**

---

## 🎯 Module 6 Summary

**What you accomplished:**
- ✅ Mastered advanced precedence and conflict resolution
- ✅ Learned to implement external scanners
- ✅ Designed error recovery strategies  
- ✅ Handled complex language features (comments, strings, injection)
- ✅ Optimized grammar performance
- ✅ Built real-world parser examples

**Advanced techniques mastered:**
- **Dynamic precedence** for complex disambiguation
- **External scanners** for context-sensitive parsing
- **Error recovery** for robust parsing
- **Language injection** for embedded languages  
- **Performance optimization** for fast parsing
- **Complex tokenization** patterns

**Real-world patterns learned:**
- String interpolation and templates
- Comment handling (line, block, nested, documentation)
- Operator overloading syntax
- Macro systems and metaprogramming constructs
- Indentation-sensitive languages

You're now ready to handle any parsing challenge! 🎉