# Module 3 Exercises

Practice reading and understanding syntax trees.

## Exercise 1: Tree Reading

Parse the example files and identify:
1. Root node type
2. How many top-level children  
3. Field names (name:, body:, etc.)

```bash
# Note: Requires JavaScript parser
tree-sitter parse ../examples/function.js
```

## Exercise 2: Cross-Language Compare

Compare how JavaScript vs Python represent:
- Function definitions
- Variable assignments  
- Control flow

What structural differences do you notice?

## Exercise 3: Error Recovery

Add errors to the examples:
1. Remove a semicolon
2. Remove a closing brace
3. Add invalid syntax: `let x = + * 2;`

**Question:** Where do ERROR nodes appear? What parses correctly?

## Exercise 4: Practical Applications  

How would syntax trees help these tools:
1. Syntax highlighter
2. Code formatter
3. Find-and-replace tool

Check `solutions/` for detailed analysis.