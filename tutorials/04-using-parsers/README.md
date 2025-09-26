# Module 4: Using Existing Parsers

Now that you understand syntax trees, let's learn how to use Tree-sitter parsers in real applications. This module covers language bindings, querying syntax trees, and building practical tools.

## 🎯 Learning Objectives

By the end of this module, you will:
- Know how to use Tree-sitter in different programming languages
- Master Tree-sitter query language for pattern matching
- Build practical tools using existing parsers
- Understand incremental parsing benefits
- Create custom language tooling

## 🌐 Language Bindings Overview

Tree-sitter provides bindings for many programming languages:

### Available Bindings
- **JavaScript/Node.js** - Most mature, great for CLI tools
- **Python** - Excellent for data analysis and scripting
- **Rust** - High performance, used by many editors
- **Go** - Good for system tools and servers  
- **C/C++** - Direct access to the core library
- **Ruby, Swift, Java, C#** - Community maintained

### Choosing the Right Binding
- **Web tools**: JavaScript
- **Data processing**: Python
- **Editor plugins**: Rust or native language
- **CLI utilities**: JavaScript or Go
- **Performance critical**: Rust or C

## 🚀 JavaScript/Node.js Usage

Let's start with JavaScript since it's widely accessible:

### Installation
```bash
npm init -y
npm install tree-sitter tree-sitter-javascript
```

### Basic Usage Example

Create `parser-example.js`:
```javascript
const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');

const parser = new Parser();
parser.setLanguage(JavaScript);

const sourceCode = `
function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
`;

const tree = parser.parse(sourceCode);
console.log(tree.rootNode.toString());
```

Run it:
```bash
node parser-example.js
```

### Tree Navigation

```javascript
const rootNode = tree.rootNode;

// Access child nodes
console.log('Children count:', rootNode.childCount);
console.log('First child:', rootNode.firstChild.type);

// Navigate the tree
const functionNode = rootNode.firstChild;
console.log('Function name:', functionNode.childForFieldName('name').text);

// Get all nodes of a specific type
function findAllNodes(node, type) {
    let results = [];
    if (node.type === type) {
        results.push(node);
    }
    for (let child of node.children) {
        results.push(...findAllNodes(child, type));
    }
    return results;
}

const identifiers = findAllNodes(rootNode, 'identifier');
identifiers.forEach(id => console.log('Identifier:', id.text));
```

## 🔍 Tree-sitter Query Language

The real power comes from Tree-sitter queries - a pattern matching language for syntax trees.

### Query Syntax Basics

Queries are written in a Lisp-like syntax using `.scm` files:

```scheme
; Find all function declarations
(function_declaration
  name: (identifier) @function.name)

; Find function calls  
(call_expression
  function: (identifier) @function.call)

; Find variable declarations
(variable_declaration
  (variable_declarator
    name: (identifier) @variable.name
    value: (_) @variable.value))
```

### Query Operators

**Capture Operator `@`**
```scheme
(identifier) @variable.name  ; Capture as 'variable.name'
```

**Wildcard `_`**
```scheme
(binary_expression
  left: (_)     ; Match any node type
  operator: "+"
  right: (_))
```

**Optional `?`**
```scheme
(function_declaration
  name: (identifier) @name
  parameters: (formal_parameters)? @params)  ; Optional parameters
```

**One-or-more `+`**
```scheme
(array
  (expression)+ @elements)  ; One or more expressions
```

**Zero-or-more `*`**
```scheme
(statement_block
  (statement)* @statements)  ; Zero or more statements
```

### Practical Query Examples

Create `queries.scm`:
```scheme
; Find all function definitions with their names
(function_declaration
  name: (identifier) @function.definition)

; Find all string literals
(string) @string.literal

; Find all if statements with conditions
(if_statement
  condition: (_) @condition
  consequence: (_) @then
  alternative: (_)? @else)

; Find all binary operations
(binary_expression
  left: (_) @left
  operator: _ @operator
  right: (_) @right)

; Find all method calls on 'console' object
(call_expression
  function: (member_expression
    object: (identifier) @obj
    property: (property_identifier) @method)
  (#eq? @obj "console"))
```

### Using Queries in JavaScript

```javascript
const fs = require('fs');

// Load query file
const queryString = fs.readFileSync('queries.scm', 'utf8');
const query = JavaScript.query(queryString);

// Execute query
const captures = query.captures(tree.rootNode);

// Process results
captures.forEach(capture => {
    console.log(`${capture.name}: ${capture.node.text}`);
});

// Filter by capture name
const functionNames = captures
    .filter(c => c.name === 'function.definition')
    .map(c => c.node.text);

console.log('Functions found:', functionNames);
```

## 🎮 Interactive Exercise: Building a Code Analyzer

Let's build a practical tool that analyzes JavaScript code:

### Create `code-analyzer.js`:
```javascript
const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');
const fs = require('fs');

class CodeAnalyzer {
    constructor() {
        this.parser = new Parser();
        this.parser.setLanguage(JavaScript);
        
        // Define queries
        this.queries = {
            functions: JavaScript.query(`
                (function_declaration
                  name: (identifier) @name) @function
            `),
            
            variables: JavaScript.query(`
                (variable_declaration
                  (variable_declarator
                    name: (identifier) @name)) @declaration
            `),
            
            calls: JavaScript.query(`
                (call_expression
                  function: (identifier) @name) @call
            `),
            
            complexity: JavaScript.query(`
                [
                  (if_statement) @conditional
                  (while_statement) @loop
                  (for_statement) @loop
                  (switch_statement) @conditional
                ] @complexity
            `)
        };
    }
    
    analyze(sourceCode) {
        const tree = this.parser.parse(sourceCode);
        
        return {
            functions: this.getFunctions(tree),
            variables: this.getVariables(tree),
            calls: this.getCalls(tree),
            complexity: this.getComplexity(tree),
            linesOfCode: sourceCode.split('\n').length
        };
    }
    
    getFunctions(tree) {
        const captures = this.queries.functions.captures(tree.rootNode);
        return captures
            .filter(c => c.name === 'name')
            .map(c => c.node.text);
    }
    
    getVariables(tree) {
        const captures = this.queries.variables.captures(tree.rootNode);
        return captures
            .filter(c => c.name === 'name')
            .map(c => c.node.text);
    }
    
    getCalls(tree) {
        const captures = this.queries.calls.captures(tree.rootNode);
        return captures
            .filter(c => c.name === 'name')
            .map(c => c.node.text);
    }
    
    getComplexity(tree) {
        const captures = this.queries.complexity.captures(tree.rootNode);
        return captures.length + 1; // Base complexity is 1
    }
    
    report(analysis) {
        console.log('\n📊 Code Analysis Report');
        console.log('========================');
        console.log(`Lines of Code: ${analysis.linesOfCode}`);
        console.log(`Functions: ${analysis.functions.length}`);
        console.log(`Variables: ${analysis.variables.length}`);
        console.log(`Function Calls: ${analysis.calls.length}`);
        console.log(`Cyclomatic Complexity: ${analysis.complexity}`);
        
        if (analysis.functions.length > 0) {
            console.log('\n📝 Functions found:');
            analysis.functions.forEach(fn => console.log(`  - ${fn}`));
        }
        
        if (analysis.variables.length > 0) {
            console.log('\n🔧 Variables declared:');
            analysis.variables.forEach(v => console.log(`  - ${v}`));
        }
    }
}

// Usage
const analyzer = new CodeAnalyzer();
const sourceCode = fs.readFileSync('target-file.js', 'utf8');
const analysis = analyzer.analyze(sourceCode);
analyzer.report(analysis);
```

### Test It
Create `target-file.js`:
```javascript
function calculateTotal(items) {
    let total = 0;
    let tax = 0.08;
    
    for (let item of items) {
        if (item.taxable) {
            total += item.price * (1 + tax);
        } else {
            total += item.price;
        }
    }
    
    return total;
}

function processOrder(order) {
    const total = calculateTotal(order.items);
    console.log(`Order total: $${total.toFixed(2)}`);
    return total;
}

const order = {
    items: [
        { name: "Book", price: 15.99, taxable: false },
        { name: "Electronics", price: 99.99, taxable: true }
    ]
};

processOrder(order);
```

Run the analyzer:
```bash
node code-analyzer.js
```

## 🐍 Python Usage

Tree-sitter also works great with Python:

### Installation
```bash
pip install tree-sitter tree-sitter-languages
```

### Python Example

Create `python-parser.py`:
```python
import tree_sitter_languages

# Get language parser
parser = tree_sitter_languages.get_parser('javascript')

# Parse code
source_code = b'''
function greet(name) {
    console.log("Hello, " + name);
}
'''

tree = parser.parse(source_code)

def print_tree(node, depth=0):
    indent = "  " * depth
    if node.type:
        print(f"{indent}{node.type}")
        if node.children:
            for child in node.children:
                print_tree(child, depth + 1)

print_tree(tree.root_node)

# Query example
query = tree_sitter_languages.get_language('javascript').query('''
    (function_declaration
      name: (identifier) @function.name)
''')

captures = query.captures(tree.root_node)
for node, capture_name in captures:
    print(f"Found function: {node.text.decode()}")
```

## 🔧 Building Practical Tools

### Tool 1: Function Extractor

Extract function signatures from any JavaScript file:

```javascript
const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');
const fs = require('fs');

class FunctionExtractor {
    constructor() {
        this.parser = new Parser();
        this.parser.setLanguage(JavaScript);
        this.query = JavaScript.query(`
            (function_declaration
              name: (identifier) @name
              parameters: (formal_parameters) @params
              body: (statement_block) @body) @function
        `);
    }
    
    extract(sourceCode) {
        const tree = this.parser.parse(sourceCode);
        const captures = this.query.captures(tree.rootNode);
        
        const functions = [];
        const functionCaptures = captures.filter(c => c.name === 'function');
        
        for (const functionCapture of functionCaptures) {
            const node = functionCapture.node;
            const name = node.childForFieldName('name').text;
            const params = node.childForFieldName('parameters').text;
            const bodyText = node.childForFieldName('body').text;
            
            functions.push({
                name,
                signature: `${name}${params}`,
                bodySize: bodyText.length,
                lineStart: node.startPosition.row + 1,
                lineEnd: node.endPosition.row + 1
            });
        }
        
        return functions;
    }
}
```

### Tool 2: Import Analyzer

Track imports and dependencies:

```javascript
const importQuery = JavaScript.query(`
    [
      (import_statement
        source: (string) @source)
      (call_expression
        function: (identifier) @func
        arguments: (arguments (string) @source)
        (#eq? @func "require"))
    ] @import
`);

class ImportAnalyzer {
    analyze(sourceCode) {
        const tree = this.parser.parse(sourceCode);
        const captures = importQuery.captures(tree.rootNode);
        
        const imports = captures
            .filter(c => c.name === 'source')
            .map(c => c.node.text.slice(1, -1)); // Remove quotes
        
        return [...new Set(imports)]; // Remove duplicates
    }
}
```

### Tool 3: Complexity Calculator

Calculate cyclomatic complexity:

```javascript
const complexityQuery = JavaScript.query(`
    [
      (if_statement) @branch
      (while_statement) @branch
      (for_statement) @branch  
      (for_in_statement) @branch
      (switch_case) @branch
      (catch_clause) @branch
      (conditional_expression) @branch
      (logical_expression
        operator: "&&") @branch
      (logical_expression
        operator: "||") @branch
    ] @complexity
`);

function calculateComplexity(sourceCode) {
    const tree = parser.parse(sourceCode);
    const captures = complexityQuery.captures(tree.rootNode);
    return captures.length + 1; // Base complexity is 1
}
```

## ⚡ Incremental Parsing

One of Tree-sitter's killer features is incremental parsing:

### Basic Incremental Parsing
```javascript
const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');

const parser = new Parser();
parser.setLanguage(JavaScript);

// Initial parse
let sourceCode = "function test() { return 42; }";
let tree = parser.parse(sourceCode);

// Make an edit
sourceCode = "function test() { return 43; }";

// Tell the parser what changed
tree.edit({
    startIndex: 26,    // Position of change
    oldEndIndex: 28,   // End of old content  
    newEndIndex: 28,   // End of new content
    startPosition: {row: 0, column: 26},
    oldEndPosition: {row: 0, column: 28},
    newEndPosition: {row: 0, column: 28}
});

// Incremental parse (much faster!)
const newTree = parser.parse(sourceCode, tree);
```

### Edit Tracking Helper
```javascript
class EditTracker {
    constructor(parser) {
        this.parser = parser;
        this.tree = null;
    }
    
    parse(sourceCode) {
        this.tree = this.parser.parse(sourceCode, this.tree);
        return this.tree;
    }
    
    edit(startIndex, oldEndIndex, newEndIndex, sourceCode) {
        if (this.tree) {
            this.tree.edit({
                startIndex,
                oldEndIndex,
                newEndIndex,
                startPosition: this.indexToPosition(startIndex, sourceCode),
                oldEndPosition: this.indexToPosition(oldEndIndex, sourceCode),
                newEndPosition: this.indexToPosition(newEndIndex, sourceCode)
            });
        }
    }
    
    indexToPosition(index, sourceCode) {
        let row = 0, column = 0;
        for (let i = 0; i < index; i++) {
            if (sourceCode[i] === '\n') {
                row++;
                column = 0;
            } else {
                column++;
            }
        }
        return { row, column };
    }
}
```

## 🔍 Advanced Query Techniques

### Conditional Queries
```scheme
; Find console.log calls specifically
(call_expression
  function: (member_expression
    object: (identifier) @obj
    property: (property_identifier) @method)
  (#eq? @obj "console")
  (#eq? @method "log"))

; Find functions with specific parameter count
(function_declaration
  parameters: (formal_parameters) @params
  (#match? @params "^\\([^,]*\\)$"))  ; Single parameter
```

### Complex Pattern Matching
```scheme
; Find all assignments to object properties
(assignment_expression
  left: (member_expression
    object: (identifier) @obj
    property: (_) @prop)
  right: (_) @value)

; Find all try-catch blocks
(try_statement
  body: (statement_block) @try_body
  handler: (catch_clause
    parameter: (identifier) @error_var
    body: (statement_block) @catch_body))
```

## 🧪 Hands-on Lab: Build a Code Quality Checker

Create a comprehensive code quality tool:

### Requirements
1. **Function Analysis**: Find functions longer than 20 lines
2. **Complexity Check**: Identify functions with complexity > 5
3. **Naming Conventions**: Check for camelCase violations
4. **Import Organization**: List all dependencies
5. **Dead Code**: Find unused variables (simplified)

### Starter Code
```javascript
class CodeQualityChecker {
    constructor() {
        this.parser = new Parser();
        this.parser.setLanguage(JavaScript);
        this.setupQueries();
    }
    
    setupQueries() {
        this.queries = {
            // Add your queries here
        };
    }
    
    check(sourceCode) {
        const tree = this.parser.parse(sourceCode);
        return {
            longFunctions: this.checkFunctionLength(tree),
            complexFunctions: this.checkComplexity(tree),
            namingIssues: this.checkNaming(tree),
            imports: this.analyzeImports(tree)
        };
    }
    
    // Implement these methods
    checkFunctionLength(tree) { /* TODO */ }
    checkComplexity(tree) { /* TODO */ }
    checkNaming(tree) { /* TODO */ }
    analyzeImports(tree) { /* TODO */ }
}
```

## 📊 Performance Tips

### Optimize Query Performance
1. **Specific Patterns**: Use specific node types instead of wildcards when possible
2. **Early Filtering**: Use predicates to filter early
3. **Reuse Queries**: Compile queries once, use many times
4. **Incremental Updates**: Use incremental parsing for real-time tools

### Memory Management
```javascript
// Good: Reuse parser instance
const parser = new Parser();
parser.setLanguage(JavaScript);

// Bad: Create new parser each time
function parseCode(code) {
    const parser = new Parser(); // Expensive!
    parser.setLanguage(JavaScript);
    return parser.parse(code);
}
```

## ➡️ What's Next?

Excellent work! You now know how to use existing Tree-sitter parsers to build powerful language tooling. In the next module, we'll learn how to create your own parser from scratch.

**[Continue to Module 5: Creating Your First Parser →](../05-first-parser/README.md)**

---

## 🎯 Module 4 Summary

**What you accomplished:**
- ✅ Learned to use Tree-sitter in JavaScript and Python
- ✅ Mastered the Tree-sitter query language
- ✅ Built practical code analysis tools
- ✅ Understood incremental parsing benefits  
- ✅ Created custom language tooling

**Key skills developed:**
- Writing Tree-sitter queries for pattern matching
- Building code analysis and quality checking tools
- Using language bindings effectively
- Implementing incremental parsing
- Optimizing parser performance

**Tools you can now build:**
- Code analyzers and metrics tools
- Import/dependency trackers
- Code quality checkers
- Refactoring assistants
- Custom language servers

You're now ready to create your own parser! 🎉