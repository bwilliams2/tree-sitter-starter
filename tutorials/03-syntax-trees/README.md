# Module 3: Understanding Syntax Trees

Now that you have Tree-sitter set up, let's dive deep into understanding syntax trees by exploring real parsers and seeing how they represent code structure.

## 🎯 Learning Objectives

By the end of this module, you will:
- Understand the anatomy of a syntax tree
- Know how to read and interpret tree structures
- Be able to explore any Tree-sitter parser interactively
- Understand the relationship between grammar rules and tree nodes
- Recognize patterns in how different languages are structured

## 🌳 Anatomy of a Syntax Tree

Every Tree-sitter syntax tree has these components:

### 1. **Root Node**
The top-level node representing the entire file:
```
(program ...)     # JavaScript/TypeScript
(module ...)      # Python  
(source_file ...) # Rust/Go
```

### 2. **Named Nodes** 
Semantic constructs defined by the grammar:
```
function_declaration
identifier
binary_expression
if_statement
```

### 3. **Anonymous Nodes**
Literal syntax tokens:
```
"{"
"}"
"if"
"="
"+"
```

### 4. **Fields**
Named relationships between parent and child nodes:
```
name: (identifier)
parameters: (parameter_list)
body: (block)
```

### 5. **Error Nodes**
Represent unparseable text:
```
(ERROR ...)
```

## 🔍 Interactive Exploration

Let's explore real syntax trees! We'll start with JavaScript since it's widely known.

### Grammar Availability (Recap)
This module assumes you completed the global grammar directory setup in **Module 2**. Quick recap (do not repeat if already done):

1. `tree-sitter init-config`
2. Add a directory you control to `parser-directories` in `config.json`
3. Clone required grammars (e.g. `tree-sitter-javascript`, `tree-sitter-python`) into that directory
4. Parse a file to trigger initial build: `tree-sitter parse path/to/file.js`

If you skipped Module 2’s optional section, go back and configure it now—everything here relies on those grammars being discoverable.

If you see the error below when trying to parse:

```
tree-sitter parse tutorials/03-syntax-trees/examples/control-flow.js
```

and saw:

```
No language found
```

that means the CLI cannot find a grammar for that language. Re‑check: repo name, directory listed in `parser-directories`, toolchain installed.

#### Example Files Directory
Example source files live under `tutorials/03-syntax-trees/examples/`. Add or modify files there freely while practicing.

To recreate the directory if missing:
```bash
mkdir -p tutorials/03-syntax-trees/examples
```

### Example 1: Simple Function

Create `function.js`:
```javascript
function greet(name) {
    return "Hello, " + name + "!";
}
```

Parse it:
```bash
tree-sitter parse function.js
```

**Output:**
```
(program
  (function_declaration
    name: (identifier)
    parameters: (formal_parameters
      (identifier))
    body: (statement_block
      (return_statement
        (binary_expression
          left: (binary_expression
            left: (string)
            operator: "+"
            right: (identifier))
          operator: "+"
          right: (string))))))
```

### 🧐 Let's Analyze This Tree

**Top to Bottom:**
1. `program` - Root node (entire file)
2. `function_declaration` - A function definition
3. `name: (identifier)` - Function name "greet"
4. `parameters:` - Parameter list containing one identifier
5. `body:` - Function body (statement block)
6. `return_statement` - A return statement
7. `binary_expression` - String concatenation

**Key Observations:**
- **Nested structure** shows precedence and grouping
- **Fields** (`name:`, `parameters:`, `body:`) make relationships clear
- **Operators** (`"+"`) are anonymous nodes
- **String concatenation** is parsed as nested binary expressions

## 🎮 Interactive Exercise 1: Explore Different Constructs

Try parsing these JavaScript examples and study their trees:

### Variables and Assignments
```javascript
const x = 42;
let y = x * 2;
var z = y + x;
```

### Control Flow
```javascript
if (x > 0) {
    console.log("positive");
} else {
    console.log("not positive");
}
```

### Objects and Arrays
```javascript
const person = {
    name: "Alice",
    age: 30,
    hobbies: ["reading", "coding"]
};
```

**Try it:** Parse each one and identify:
- What's the root structure?
- How are different statement types represented?
- Where do you see fields vs regular children?

## 🗺️ Language Comparison

Let's see how different languages represent similar concepts:

### Function Definition

**JavaScript:**
```javascript
function add(a, b) {
    return a + b;
}
```

**Python:**
```python
def add(a, b):
    return a + b
```

**Rust:**
```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

### Try This Exercise
1. Create files with the same function in different languages
2. Parse each with their respective parsers
3. Compare the tree structures
4. Notice similarities and differences

**What to look for:**
- How are function parameters represented?
- How do return types appear in typed languages?
- What's different about the body structure?

## 📊 Tree Navigation Commands

Tree-sitter provides several ways to explore trees:

### Basic Parsing
```bash
tree-sitter parse file.js
```

### Syntax Highlighting Info
```bash
tree-sitter highlight file.js
```

### Query Testing
```bash
tree-sitter query file.js query.scm
```

### Statistical Info
```bash
tree-sitter stats file.js
```

## 🔍 Deep Dive: Reading Complex Trees

Let's parse a more complex JavaScript example:

Create `complex.js`:
```javascript
class Calculator {
    constructor() {
        this.history = [];
    }
    
    add(a, b) {
        const result = a + b;
        this.history.push({ operation: 'add', a, b, result });
        return result;
    }
    
    getHistory() {
        return this.history.filter(op => op.result > 0);
    }
}

const calc = new Calculator();
console.log(calc.add(5, 3));
```

**Challenge:** Before parsing, predict:
1. What will be the main top-level nodes?
2. How will the class structure be represented?
3. How will method calls appear?

Parse it and check your predictions!

## 🧩 Understanding Grammar-to-Tree Mapping

The magic happens in `grammar.js` files. Let's look at how grammar rules create tree nodes:

### Grammar Rule → Tree Node

**Grammar (simplified):**
```javascript
function_declaration: $ => seq(
  'function',
  field('name', $.identifier),
  field('parameters', $.formal_parameters),
  field('body', $.statement_block)
)
```

**Input:**
```javascript
function test() { return 42; }
```

**Tree:**
```
(function_declaration
  name: (identifier)
  parameters: (formal_parameters)  
  body: (statement_block
    (return_statement ...)))
```

**The Connection:**
- `seq()` creates a sequence of children
- `field()` creates named fields
- `$.identifier` references another rule
- `'function'` creates an anonymous node

## 🎯 Practice: Tree Reading Challenges

### Challenge 1: Predict the Tree
Before parsing, try to predict the tree structure for:

```javascript
const users = [
    { name: "Alice", active: true },
    { name: "Bob", active: false }
];

const activeUsers = users.filter(user => user.active);
```

### Challenge 2: Find the Pattern
Parse these similar but different statements:
```javascript
x = 5;
x += 5;
x++;
++x;
```

**Question:** How does Tree-sitter represent different assignment operators?

### Challenge 3: Error Recovery
Parse this intentionally broken code:
```javascript
function broken( {
    let x = ;
    return x
    console.log("after missing semicolon")
}
```

**Observe:** 
- Where do ERROR nodes appear?
- What gets parsed successfully despite errors?
- How does error recovery help editing tools?

## 🔧 Working with Different File Types

Let's explore parsers for different languages:

### Install More Parsers
```bash
npm install tree-sitter-python
npm install tree-sitter-json
npm install tree-sitter-html
npm install tree-sitter-css
```

### Python Example
```python
def factorial(n):
    if n <= 1:
        return 1
    else:
        return n * factorial(n - 1)
        
result = factorial(5)
print(f"5! = {result}")
```

### JSON Example
```json
{
    "name": "my-project",
    "version": "1.0.0",
    "dependencies": {
        "tree-sitter": "^0.20.0"
    },
    "scripts": {
        "test": "tree-sitter test"
    }
}
```

**Exercise:** Parse both and compare:
- How are function definitions different between Python and JavaScript?
- How does JSON structure compare to JavaScript objects?
- What nodes are specific to each language?

## 🎨 Visualizing Trees

### Tree Structure Patterns

**Sequential Structure (Statements):**
```
(program
  (statement_1)
  (statement_2)  
  (statement_3))
```

**Nested Structure (Expressions):**
```
(binary_expression
  left: (binary_expression
    left: (number)
    operator: "*"
    right: (number))
  operator: "+"
  right: (number))
```

**Fielded Structure (Declarations):**
```
(function_declaration
  name: (identifier)
  parameters: (parameter_list)
  body: (block))
```

## 💡 Pro Tips for Reading Trees

### 1. **Start from the Root**
Always begin with the root node and work down level by level.

### 2. **Focus on Fields**
Fields (`name:`, `body:`, etc.) are the most important relationships.

### 3. **Ignore Anonymous Nodes Initially**
Focus on named nodes first, then consider the punctuation/keywords.

### 4. **Look for Patterns**
Similar constructs often have similar tree structures.

### 5. **Use Indentation**
The indentation in tree output shows parent-child relationships.

## 🔄 Common Tree Patterns

### Pattern 1: Lists
```
(array
  (element)
  (element)
  (element))
```

### Pattern 2: Binary Operations  
```
(binary_expression
  left: (...)
  operator: "+"
  right: (...))
```

### Pattern 3: Declarations
```
(variable_declaration
  declarator: (variable_declarator
    name: (identifier)
    value: (...)))
```

## 🧪 Hands-on Lab

### Lab 1: Compare Language Features

Create equivalent programs in 2-3 languages and compare their trees:

**Program:** A function that finds the maximum of two numbers

1. Implement in JavaScript, Python, and one other language
2. Parse each version
3. Create a comparison chart of the tree structures
4. Note what's similar and what's different

### Lab 2: Error Recovery Testing

Create a file with multiple intentional errors:
1. Missing semicolons
2. Unmatched brackets
3. Invalid syntax

Parse it and document:
- Where ERROR nodes appear
- What gets recovered
- How much of the file remains parseable

## 📈 Tree Metrics Understanding  

Use `tree-sitter stats` to understand parser performance:

```bash
tree-sitter stats large-file.js
```

**What the numbers mean:**
- **Total nodes**: Size of the syntax tree
- **Named nodes**: Semantic constructs vs punctuation
- **Parse time**: How fast the parsing was
- **Tree size**: Memory usage

## ➡️ What's Next?

Fantastic! You now have a deep understanding of how syntax trees work and can read them like a pro. In the next module, we'll learn how to actually use these trees in practical applications.

**[Continue to Module 4: Using Existing Parsers →](../04-using-parsers/README.md)**

---

## 🎯 Module 3 Summary

**What you accomplished:**
- ✅ Learned the anatomy of syntax trees
- ✅ Explored trees interactively with multiple languages  
- ✅ Understood the grammar-to-tree mapping
- ✅ Practiced reading complex tree structures
- ✅ Discovered common patterns across languages

**Key skills developed:**
- Reading and interpreting syntax tree output
- Predicting tree structure from code
- Understanding error recovery mechanisms
- Comparing tree structures across languages
- Using Tree-sitter CLI tools for exploration

**Important concepts mastered:**
- **Named vs anonymous nodes**
- **Field relationships**
- **Tree navigation patterns**
- **Error recovery behavior**
- **Grammar rule mapping**

You're now ready to start using these trees in real applications! 🚀