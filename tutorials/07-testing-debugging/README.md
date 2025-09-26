# Module 7: Testing and Debugging

A parser is only as good as its tests! In this module, you'll learn how to thoroughly test your Tree-sitter parsers, debug parsing issues, and ensure your grammar works correctly in all scenarios.

## 🎯 Learning Objectives

By the end of this module, you will:
- Master Tree-sitter's testing framework and best practices
- Write comprehensive test suites for your parsers
- Debug parsing issues systematically
- Profile and optimize parser performance
- Handle edge cases and error scenarios
- Set up continuous integration for parser projects

## 🧪 Tree-sitter Testing Framework

### Test File Structure

Tree-sitter uses a simple but powerful text-based testing format:

```
================================================================================
Test Name (descriptive title)
================================================================================

input code here

--------------------------------------------------------------------------------

(expected
  (syntax_tree
    (goes_here)))

================================================================================
Another Test
================================================================================

more input

--------------------------------------------------------------------------------

(more
  (expected_output))
```

### Test File Locations

Tests should be organized in the `test/corpus/` directory:

```
test/
└── corpus/
    ├── expressions.txt      # Expression tests
    ├── statements.txt       # Statement tests  
    ├── declarations.txt     # Declaration tests
    ├── edge_cases.txt       # Edge cases and errors
    └── real_world.txt       # Real-world examples
```

## ✍️ Writing Effective Tests

### Basic Test Structure

For our calculator parser:

**`test/corpus/basics.txt`**:
```
================================================================================
Simple number
================================================================================

42

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
Binary expression with precedence
================================================================================

2 + 3 * 4

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

### Testing Best Practices

#### 1. Test Incrementally
Start with simple cases and add complexity:

```
// Start with single tokens
42
"hello"  
identifier

// Then simple combinations  
2 + 3
let x = 5

// Then complex nested structures
(2 + 3) * (4 - 1)
let result = func(a, b + c)
```

#### 2. Test Edge Cases
```
================================================================================
Empty file
================================================================================



--------------------------------------------------------------------------------

(source_file)

================================================================================
Only whitespace and comments  
================================================================================

  // Just a comment
  

--------------------------------------------------------------------------------

(source_file)

================================================================================
Trailing semicolon optional
================================================================================

let x = 5

--------------------------------------------------------------------------------

(source_file
  (variable_declaration
    name: (identifier)
    value: (number)))
```

#### 3. Test Error Scenarios
```
================================================================================
Missing semicolon - should still parse
================================================================================

let x = 5
let y = 10

--------------------------------------------------------------------------------

(source_file
  (variable_declaration
    name: (identifier) 
    value: (number))
  (variable_declaration
    name: (identifier)
    value: (number)))

================================================================================
Incomplete expression - should create ERROR node
================================================================================

let x = 

--------------------------------------------------------------------------------

(source_file
  (variable_declaration
    name: (identifier)
    value: (ERROR)))
```

### Running Tests

```bash
# Run all tests
tree-sitter test

# Run specific test file
tree-sitter test --corpus-directory test/corpus/basics.txt

# Update failing tests (regenerate expected output)
tree-sitter test --update

# Run with debug output
tree-sitter test --debug
```

## 🔍 Debugging Parsing Issues

### Common Debugging Workflow

1. **Identify the problem** - which input isn't parsing correctly?
2. **Isolate the issue** - create a minimal failing example
3. **Analyze the grammar** - check relevant rules
4. **Use debugging tools** - leverage Tree-sitter's debug features
5. **Fix and test** - make targeted changes and verify

### Debug Tools and Techniques

#### 1. Parse with Debug Output
```bash
tree-sitter parse --debug problem-file.calc
```

This shows the parsing process step by step:
```
[DEBUG] Processing rule: source_file
[DEBUG] Processing rule: statement
[DEBUG] Trying choice: variable_declaration
[DEBUG] Matched token: 'let'
[DEBUG] Processing rule: identifier
[DEBUG] Matched token: 'x'
...
```

#### 2. Generate Parser State Logs
```bash
tree-sitter generate --report-states-for-rule binary_expression
```

This creates detailed reports about parser states and conflicts.

#### 3. Interactive Debugging

Create a simple debug script:

```javascript
const Parser = require('tree-sitter');
const Language = require('tree-sitter-simple-calc');

const parser = new Parser();
parser.setLanguage(Language);

function debugParse(code) {
    console.log('Input:', code);
    const tree = parser.parse(code);
    console.log('Tree:', tree.rootNode.toString());
    
    // Check for errors
    function findErrors(node) {
        if (node.type === 'ERROR') {
            console.log('ERROR node found:', node.toString());
            console.log('Position:', node.startPosition, 'to', node.endPosition);
        }
        for (let child of node.children) {
            findErrors(child);
        }
    }
    
    findErrors(tree.rootNode);
}

// Test problematic cases
debugParse('let x = ');  // Missing value
debugParse('2 + + 3');   // Double operator
debugParse('let = 5');   // Missing identifier
```

### Common Parsing Problems and Solutions

#### Problem 1: Unexpected ERROR Nodes

**Symptom**: Input looks valid but produces ERROR nodes

**Debug steps**:
1. Check if all tokens are properly defined
2. Verify rule precedence
3. Look for conflicts in grammar

**Example**:
```javascript
// Problem: Missing rule for unary expressions
// Input: -5
// Output: (ERROR "-" (number))

// Solution: Add unary expression rule
unary_expression: $ => seq(
  choice('-', '+'),
  $.expression
)
```

#### Problem 2: Wrong Precedence

**Symptom**: Operators grouping incorrectly

**Debug steps**:
1. Check precedence values in binary expression rules
2. Verify left vs right associativity
3. Test with parentheses to confirm expected behavior

**Example**:
```javascript
// Problem: 2 + 3 * 4 parsing as (2 + 3) * 4
// Issue: Addition has higher precedence than multiplication

// Fix precedence values:
const table = [
  [1, '+', '-'],    // Lower precedence  
  [2, '*', '/'],    // Higher precedence (correct)
];
```

#### Problem 3: Infinite Recursion

**Symptom**: Parser hangs or stack overflow

**Debug steps**:
1. Look for left-recursive rules
2. Check for cycles in grammar
3. Use precedence to break recursion

**Example**:
```javascript
// Problem: Direct left recursion
expression: $ => choice(
  seq($.expression, '+', $.expression),  // Left recursive!
  $.number
)

// Solution: Use precedence
expression: $ => choice(
  prec.left(1, seq($.expression, '+', $.expression)),
  $.number
)
```

#### Problem 4: Conflicts and Ambiguities

**Symptom**: Warnings during generation, unexpected parsing behavior

**Debug steps**:
1. Check for ambiguous grammar rules
2. Use conflicts array if ambiguity is intentional
3. Add precedence to resolve conflicts

**Example**:
```javascript
// Problem: Ambiguous if-else (dangling else)
// Solution: Use precedence and conflicts
module.exports = grammar({
  conflicts: $ => [
    [$.if_statement]
  ],
  
  rules: {
    if_statement: $ => prec.right(seq(
      'if', $.expression, $.statement,
      optional(seq('else', $.statement))
    ))
  }
})
```

## 🎯 Performance Testing and Profiling

### Measuring Parse Performance

Create performance test scripts:

```javascript
const fs = require('fs');
const Parser = require('tree-sitter');
const Language = require('tree-sitter-simple-calc');

const parser = new Parser();
parser.setLanguage(Language);

function benchmarkParsing(filename, iterations = 100) {
    const code = fs.readFileSync(filename, 'utf8');
    
    console.log(`Benchmarking ${filename} (${code.length} chars)`);
    
    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
        parser.parse(code);
    }
    const end = Date.now();
    
    const totalTime = end - start;
    const avgTime = totalTime / iterations;
    
    console.log(`Total: ${totalTime}ms, Average: ${avgTime.toFixed(2)}ms`);
    console.log(`Speed: ${(code.length / avgTime * 1000).toFixed(0)} chars/sec`);
}

// Test with different file sizes
benchmarkParsing('small.calc');
benchmarkParsing('medium.calc'); 
benchmarkParsing('large.calc');
```

### Profiling Large Files

```bash
# Use time to measure parsing performance
time tree-sitter parse large-file.calc

# Generate performance stats
tree-sitter parse --time large-file.calc
```

### Optimizing Performance

#### 1. Minimize Backtracking
```javascript
// Bad: Requires backtracking
statement: $ => choice(
  seq('let', $.identifier, '=', $.expression),
  seq($.identifier, '=', $.expression),
  $.expression
)

// Better: Use precedence to guide parsing
statement: $ => choice(
  prec(2, $.variable_declaration),
  prec(1, $.assignment_statement), 
  $.expression_statement
)
```

#### 2. Use token() for Complex Patterns
```javascript
// Bad: Each part parsed separately
string_literal: $ => seq(
  '"',
  repeat(choice(/[^"\\]/, seq('\\', /./)), 
  '"'
)

// Better: Single token
string_literal: $ => token(seq(
  '"',
  repeat(choice(/[^"\\]/, seq('\\', /./))),
  '"'
))
```

#### 3. Optimize Repetition Patterns
```javascript
// Less efficient
many_statements: $ => choice(
  $.statement,
  seq($.statement, $.many_statements)
)

// More efficient  
many_statements: $ => repeat1($.statement)
```

## 🧪 Advanced Testing Strategies

### Property-Based Testing

Generate random inputs to find edge cases:

```javascript
const { fc, test } = require('fast-check');

test('all valid expressions should parse without errors', () => {
    fc.assert(fc.property(
        // Generate random valid expressions
        fc.oneof(
            fc.integer(),                                    // Numbers
            fc.string({ minLength: 1, maxLength: 10 })       // Identifiers
                .filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
            fc.tuple(fc.integer(), fc.constantFrom('+', '-', '*', '/'), fc.integer())
                .map(([a, op, b]) => `${a} ${op} ${b}`)      // Binary expressions
        ),
        (input) => {
            const tree = parser.parse(input);
            // Should have no ERROR nodes
            const hasErrors = tree.rootNode.toString().includes('ERROR');
            return !hasErrors;
        }
    ));
});
```

### Regression Testing

Save problematic inputs that were fixed:

```javascript
// test/corpus/regressions.txt
================================================================================
Issue #123: Parsing empty parentheses
================================================================================

()

--------------------------------------------------------------------------------

(source_file
  (expression_statement
    (parenthesized_expression)))

================================================================================
Issue #124: Negative numbers in expressions  
================================================================================

x + -5

--------------------------------------------------------------------------------

(source_file
  (expression_statement
    (binary_expression
      left: (identifier)
      operator: "+"
      right: (unary_expression
        operator: "-"
        operand: (number)))))
```

### Fuzzing

Use tools to generate random inputs and find crashes:

```bash
# Install American Fuzzy Lop (AFL)
sudo apt install afl++

# Create fuzzing wrapper
echo "tree-sitter parse \$1" > fuzz-wrapper.sh
chmod +x fuzz-wrapper.sh

# Run fuzzing  
mkdir fuzz-inputs
echo "let x = 5;" > fuzz-inputs/basic.calc

afl-fuzz -i fuzz-inputs -o fuzz-outputs ./fuzz-wrapper.sh @@
```

## 🔄 Continuous Integration

### GitHub Actions for Parser Testing

Create `.github/workflows/test.yml`:

```yaml
name: Test Parser

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        
    - name: Install Tree-sitter CLI
      run: npm install -g tree-sitter-cli
      
    - name: Install dependencies
      run: npm install
      
    - name: Generate parser
      run: tree-sitter generate
      
    - name: Run tests
      run: tree-sitter test
      
    - name: Test parsing examples
      run: |
        for file in examples/*.calc; do
          echo "Testing $file"
          tree-sitter parse "$file" || exit 1
        done
        
    - name: Performance benchmarks
      run: node benchmark.js
```

### Cross-Platform Testing

Test on multiple platforms:

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [14, 16, 18]
    
runs-on: ${{ matrix.os }}
```

## 📊 Test Coverage Analysis

### Measuring Grammar Coverage

Create a tool to check which grammar rules are tested:

```javascript
const fs = require('fs');

class GrammarCoverageAnalyzer {
    constructor(grammarFile, testDir) {
        this.grammar = require(grammarFile);
        this.testDir = testDir;
        this.coverage = new Map();
    }
    
    analyzeTests() {
        const testFiles = fs.readdirSync(this.testDir);
        
        for (const file of testFiles) {
            if (file.endsWith('.txt')) {
                this.analyzeTestFile(path.join(this.testDir, file));
            }
        }
        
        return this.generateReport();
    }
    
    analyzeTestFile(filename) {
        const content = fs.readFileSync(filename, 'utf8');
        const expectedTrees = this.extractExpectedTrees(content);
        
        for (const tree of expectedTrees) {
            this.countNodesInTree(tree);
        }
    }
    
    countNodesInTree(tree) {
        // Parse tree string and count each node type
        const nodeTypes = tree.match(/\([a-z_]+/g) || [];
        for (const nodeType of nodeTypes) {
            const type = nodeType.substring(1);
            this.coverage.set(type, (this.coverage.get(type) || 0) + 1);
        }
    }
    
    generateReport() {
        const grammarRules = Object.keys(this.grammar.rules);
        const testedRules = Array.from(this.coverage.keys());
        const untestedRules = grammarRules.filter(rule => !testedRules.includes(rule));
        
        return {
            totalRules: grammarRules.length,
            testedRules: testedRules.length,
            coverage: (testedRules.length / grammarRules.length * 100).toFixed(1),
            untestedRules: untestedRules
        };
    }
}
```

## 🚨 Error Testing Strategies

### Testing Error Recovery

Create specific tests for error scenarios:

```
================================================================================
Missing semicolon recovery
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

================================================================================
Invalid token recovery
================================================================================

let x = 5 @#$% let y = 10;

--------------------------------------------------------------------------------

(source_file
  (variable_declaration
    name: (identifier)
    value: (number))
  (ERROR)
  (variable_declaration
    name: (identifier)
    value: (number)))
```

### Boundary Testing

Test limits and edge cases:

```javascript
// Generate large expressions to test parser limits
function generateDeepExpression(depth) {
    if (depth === 0) return '1';
    return `(${generateDeepExpression(depth - 1)} + ${generateDeepExpression(depth - 1)})`;
}

// Test with various depths
for (let depth = 1; depth <= 100; depth += 10) {
    const expr = generateDeepExpression(depth);
    console.log(`Testing depth ${depth}: ${expr.length} chars`);
    const tree = parser.parse(expr);
    console.log(`Success: ${!tree.rootNode.hasError()}`);
}
```

## ➡️ What's Next?

Outstanding! You now have comprehensive testing and debugging skills for Tree-sitter parsers. In our final module, we'll explore advanced topics like contributing to Tree-sitter, optimizing for production use, and building parser ecosystems.

**[Continue to Module 8: Advanced Topics →](../08-advanced/README.md)**

---

## 🎯 Module 7 Summary

**What you accomplished:**
- ✅ Mastered Tree-sitter testing framework and best practices
- ✅ Learned systematic debugging approaches for parsing issues
- ✅ Implemented performance testing and profiling
- ✅ Set up comprehensive test coverage and CI/CD
- ✅ Created robust error testing strategies
- ✅ Built tools for analyzing grammar coverage

**Testing skills developed:**
- **Writing comprehensive test suites** with proper organization
- **Debugging parsing issues** systematically with Tree-sitter tools
- **Performance testing and optimization** for production use
- **Error recovery testing** to ensure robust parsing
- **Continuous integration** for automated parser validation
- **Property-based and fuzz testing** for edge case discovery

**Tools and techniques mastered:**
- Tree-sitter test corpus format and organization  
- Debug parsing with `--debug` and state reports
- Performance benchmarking and profiling scripts
- Grammar coverage analysis tools
- Cross-platform CI/CD with GitHub Actions
- Regression testing and error boundary testing

You're now equipped to build production-quality parsers! 🎉