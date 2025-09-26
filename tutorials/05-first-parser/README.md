# Module 5: Creating Your First Parser

Time for the exciting part - creating your own Tree-sitter parser from scratch! In this module, you'll build a complete parser for a simple calculator language, learning grammar fundamentals along the way.

## 🎯 Learning Objectives

By the end of this module, you will:
- Understand Tree-sitter grammar syntax and structure
- Write grammar rules that generate correct syntax trees
- Handle operator precedence and associativity
- Create a complete parser for a custom language
- Test and debug your grammar effectively
- Follow Tree-sitter best practices

## 🧮 Our Target Language: SimpleCalc

Let's create a parser for a simple calculator language that supports:

```
// Numbers
42
3.14159

// Basic arithmetic
2 + 3
10 - 4
6 * 7
15 / 3

// Parentheses for grouping
(2 + 3) * 4
2 * (3 + 4)

// Variables
let x = 5;
let y = x + 10;

// Simple expressions
x + y * 2
```

This language is simple enough to understand but complex enough to teach important concepts!

## 🏗️ Setting Up Your Parser Project

### Step 1: Create Project Structure
```bash
mkdir tree-sitter-simple-calc
cd tree-sitter-simple-calc

# Initialize the parser
tree-sitter init
```

This creates:
- `grammar.js` - Your grammar definition
- `package.json` - NPM package configuration
- `binding.gyp` - Native module configuration
- `src/` - Generated parser code (created by `tree-sitter generate`)

### Step 2: Examine the Template

Look at the generated `grammar.js`:
```javascript
module.exports = grammar({
  name: 'simple_calc',

  rules: {
    // TODO: add the actual grammar rules
  }
});
```

## 📝 Grammar Fundamentals

### Basic Grammar Structure

Tree-sitter grammars are JavaScript objects with this structure:

```javascript
module.exports = grammar({
  name: 'language_name',           // Parser name
  
  extras: $ => [                   // Tokens to ignore (whitespace, comments)
    /\s/,                          // Whitespace
    $.comment                      // Comments
  ],
  
  rules: {
    // Grammar rules go here
    rule_name: $ => pattern,
  }
});
```

### Core Grammar Functions

**`seq(...)`** - Sequence (all items must match in order)
```javascript
function_call: $ => seq(
  $.identifier,
  '(',
  ')'
)
```

**`choice(...)`** - Alternatives (any one item must match)
```javascript
expression: $ => choice(
  $.number,
  $.identifier,
  $.binary_operation
)
```

**`repeat(...)`** - Zero or more repetitions
```javascript
statement_list: $ => repeat($.statement)
```

**`repeat1(...)`** - One or more repetitions
```javascript
digit_sequence: $ => repeat1(/[0-9]/)
```

**`optional(...)`** - Optional element
```javascript
function_declaration: $ => seq(
  'function',
  $.identifier,
  optional($.parameter_list)
)
```

**`field('name', pattern)`** - Named field
```javascript
assignment: $ => seq(
  field('variable', $.identifier),
  '=',
  field('value', $.expression)
)
```

## 🔧 Building Our Calculator Grammar

Let's build our grammar step by step:

### Step 1: Basic Structure

```javascript
module.exports = grammar({
  name: 'simple_calc',

  extras: $ => [
    /\s+/,        // Whitespace
    $.comment,    // Comments
  ],

  rules: {
    // Start rule - represents the entire program
    source_file: $ => repeat($.statement),

    // A statement can be a declaration or expression
    statement: $ => choice(
      $.variable_declaration,
      $.expression_statement
    ),

    // Comments
    comment: $ => token(seq('//', /.*/)),
  }
});
```

### Step 2: Numbers and Identifiers

```javascript
// Add to rules:
number: $ => {
  const decimal = /[0-9]+/;
  const float = seq(decimal, '.', decimal);
  
  return token(choice(float, decimal));
},

identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
```

### Step 3: Variable Declarations

```javascript
variable_declaration: $ => seq(
  'let',
  field('name', $.identifier),
  '=',
  field('value', $.expression),
  ';'
),
```

### Step 4: Expressions with Precedence

This is the tricky part! We need to handle operator precedence correctly:

```javascript
expression: $ => choice(
  $.identifier,
  $.number,
  $.parenthesized_expression,
  $.binary_expression
),

parenthesized_expression: $ => seq(
  '(',
  $.expression,
  ')'
),

binary_expression: $ => {
  const table = [
    [5, '+', '-'],           // Lowest precedence
    [6, '*', '/'],           // Higher precedence
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
},

expression_statement: $ => seq($.expression, ';'),
```

### Complete Grammar

Here's our complete grammar:

```javascript
module.exports = grammar({
  name: 'simple_calc',

  extras: $ => [
    /\s+/,
    $.comment,
  ],

  rules: {
    source_file: $ => repeat($.statement),

    statement: $ => choice(
      $.variable_declaration,
      $.expression_statement
    ),

    variable_declaration: $ => seq(
      'let',
      field('name', $.identifier),
      '=',
      field('value', $.expression),
      ';'
    ),

    expression_statement: $ => seq($.expression, ';'),

    expression: $ => choice(
      $.identifier,
      $.number,
      $.parenthesized_expression,
      $.binary_expression
    ),

    binary_expression: $ => {
      const table = [
        [1, '+', '-'],
        [2, '*', '/'],
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
    },

    parenthesized_expression: $ => seq(
      '(',
      $.expression,
      ')'
    ),

    number: $ => {
      const decimal = /[0-9]+/;
      const float = seq(decimal, '.', decimal);
      
      return token(choice(float, decimal));
    },

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    comment: $ => token(seq('//', /.*/)),
  }
});
```

## 🔨 Generating and Testing the Parser

### Step 1: Generate the Parser

```bash
tree-sitter generate
```

This creates the C parser code in the `src/` directory.

### Step 2: Test Basic Parsing

Create test files:

**`test1.calc`**:
```
let x = 5;
let y = 10;
x + y;
```

**`test2.calc`**:
```
2 + 3 * 4;
(2 + 3) * 4;
```

Parse them:
```bash
tree-sitter parse test1.calc
tree-sitter parse test2.calc
```

### Step 3: Understanding the Output

For `test1.calc`, you should see:
```
(source_file
  (variable_declaration
    name: (identifier)
    value: (number))
  (variable_declaration
    name: (identifier)
    value: (number))
  (expression_statement
    (binary_expression
      left: (identifier)
      operator: "+"
      right: (identifier))))
```

## 🧪 Writing Tests

Tree-sitter has a built-in testing framework:

### Create Test File

Create `test/corpus/basics.txt`:
```
================================================================================
Simple number
================================================================================

42;

--------------------------------------------------------------------------------

(source_file
  (expression_statement
    (number)))

================================================================================
Variable declaration
================================================================================

let x = 5;

--------------------------------------------------------------------------------

(source_file
  (variable_declaration
    name: (identifier)
    value: (number)))

================================================================================
Binary expression
================================================================================

2 + 3;

--------------------------------------------------------------------------------

(source_file
  (expression_statement
    (binary_expression
      left: (number)
      operator: "+"
      right: (number))))

================================================================================
Precedence test
================================================================================

2 + 3 * 4;

--------------------------------------------------------------------------------

(source_file
  (expression_statement
    (binary_expression
      left: (number)
      operator: "+"
      right: (binary_expression
        left: (number)
        operator: "*"
        right: (number)))))
```

### Run Tests

```bash
tree-sitter test
```

This will validate that your parser produces the expected syntax trees.

## 🐛 Debugging Common Issues

### Issue 1: Parse Errors

**Problem**: `tree-sitter parse` shows ERROR nodes

**Debug steps**:
1. Check for syntax errors in your grammar
2. Ensure all rules are properly defined
3. Use `tree-sitter parse --debug` for detailed info

**Example**:
```bash
tree-sitter parse --debug problematic-file.calc
```

### Issue 2: Wrong Precedence

**Problem**: `2 + 3 * 4` parses as `(2 + 3) * 4` instead of `2 + (3 * 4)`

**Solution**: Check your precedence values - higher numbers = higher precedence

```javascript
const table = [
  [1, '+', '-'],  // Lower precedence
  [2, '*', '/'],  // Higher precedence (binds tighter)
];
```

### Issue 3: Left vs Right Associativity

**Problem**: `2 - 3 - 4` parsing incorrectly

**Solution**: Use `prec.left()` for left-associative operators, `prec.right()` for right-associative:

```javascript
// Left-associative: 2 - 3 - 4 → (2 - 3) - 4
prec.left(1, seq($.expression, '-', $.expression))

// Right-associative: 2 ** 3 ** 4 → 2 ** (3 ** 4)
prec.right(3, seq($.expression, '**', $.expression))
```

## 🎮 Interactive Exercise: Extend the Calculator

Let's add more features to our calculator:

### Exercise 1: Add Unary Operators

Add support for unary minus and plus:
```
-5;
+3;
-(2 + 3);
```

**Hint**: Add a `unary_expression` rule:
```javascript
unary_expression: $ => prec(3, seq(
  field('operator', choice('-', '+')),
  field('operand', $.expression)
)),
```

### Exercise 2: Add Assignment Expressions

Allow assignments within expressions:
```
x = y = 5;
```

### Exercise 3: Add Function Calls

Add simple function calls:
```
sqrt(16);
max(2, 5);
```

## 🚀 Advanced Grammar Techniques

### Handling Whitespace

By default, Tree-sitter ignores patterns in the `extras` array between tokens. For languages where whitespace is significant:

```javascript
// For whitespace-sensitive languages
extras: $ => [
  $.comment,
  // Don't include whitespace in extras
],

// Explicitly handle whitespace where needed
indented_block: $ => seq(
  /\n+/,
  /[ \t]+/,  // Indentation
  repeat(seq($.statement, /\n+/))
)
```

### External Scanners

For complex tokenization (like Python's indentation), use external scanners:

```javascript
module.exports = grammar({
  name: 'language',
  
  externals: $ => [
    $.indent,
    $.dedent,
    $.newline,
  ],
  
  // ... rest of grammar
});
```

### Conflicts and GLR Parsing

When your grammar has ambiguities, Tree-sitter might need help:

```javascript
module.exports = grammar({
  name: 'language',
  
  conflicts: $ => [
    [$.expression, $.statement],  // Tell Tree-sitter about known conflicts
  ],
  
  // ... rules
});
```

## 📊 Performance Considerations

### Optimizing Grammar Performance

1. **Avoid Deep Left Recursion**: Can cause stack overflow
```javascript
// Bad
expression: $ => choice(
  seq($.expression, '+', $.expression),  // Left recursive
  $.number
)

// Good  
expression: $ => prec.left(1, seq(
  $.expression, '+', $.expression
))
```

2. **Use `token()` for Complex Patterns**:
```javascript
// For complex tokens that shouldn't be split
string_literal: $ => token(seq(
  '"',
  repeat(choice(
    /[^"\\]/,
    seq('\\', /./)
  )),
  '"'
))
```

3. **Minimize Backtracking**: Avoid ambiguous patterns
```javascript
// Potentially ambiguous
statement: $ => choice(
  seq($.identifier, '=', $.expression),
  $.expression
)

// Better - more specific
statement: $ => choice(
  $.assignment_statement,
  $.expression_statement
)
```

## 🔍 Grammar Analysis Tools

### Visualize Your Grammar

```bash
# Generate a graph of your grammar
tree-sitter build-wasm
# Open the generated .wasm file in Tree-sitter playground
```

### Check for Conflicts

```bash
tree-sitter generate --report-states-for-rule expression
```

### Performance Testing

```bash
# Test parsing performance
time tree-sitter parse large-file.calc
```

## 🎯 Best Practices Summary

1. **Start Simple**: Begin with basic constructs and add complexity gradually
2. **Test Early and Often**: Write tests as you develop rules
3. **Handle Precedence Carefully**: Use precedence tables for operators
4. **Use Fields Consistently**: Field names improve tree usability
5. **Follow Naming Conventions**: Use snake_case for rule names
6. **Document Your Grammar**: Add comments explaining complex rules
7. **Study Existing Parsers**: Learn from Tree-sitter organization repos

## 🧪 Final Challenge: Complete Calculator

Extend your calculator to support:

1. **Multiple data types**: strings, booleans
2. **Comparison operators**: `>`, `<`, `==`, `!=`
3. **Logical operators**: `&&`, `||`, `!`
4. **Control flow**: `if` statements
5. **Functions**: definition and calls

**Example target code**:
```
let name = "Calculator";
let version = 1.0;

function square(x) {
    return x * x;
}

if (version > 0.5) {
    let result = square(5);
    print("Square of 5 is " + result);
}
```

## ➡️ What's Next?

Congratulations! You've built your first Tree-sitter parser from scratch. In the next module, we'll dive deeper into advanced grammar features and handle more complex language constructs.

**[Continue to Module 6: Grammar Deep Dive →](../06-grammar-deep-dive/README.md)**

---

## 🎯 Module 5 Summary

**What you accomplished:**
- ✅ Created a complete Tree-sitter parser from scratch
- ✅ Learned grammar syntax and structure
- ✅ Handled operator precedence and associativity
- ✅ Wrote comprehensive tests for your parser
- ✅ Debugged common grammar issues
- ✅ Applied Tree-sitter best practices

**Key concepts mastered:**
- **Grammar functions**: `seq()`, `choice()`, `repeat()`, etc.
- **Precedence handling**: `prec.left()`, `prec.right()`
- **Field definitions**: Named relationships in trees
- **Testing framework**: Writing and running parser tests
- **Debugging techniques**: Finding and fixing grammar issues

**Your parser now supports:**
- Numbers (integers and floats)
- Variables and assignments
- Binary arithmetic operations
- Parenthesized expressions
- Proper operator precedence
- Comments

You're now ready for advanced grammar techniques! 🚀