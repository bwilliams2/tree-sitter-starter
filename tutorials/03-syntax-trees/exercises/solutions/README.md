# Exercise Solutions - Module 3

## Exercise 1: Tree Reading

**For function.js:**
- Root: `program`
- Children: Usually 2 (function declaration + call)
- Fields: `name:`, `parameters:`, `body:`

**Key insight:** Fields create semantic relationships in the tree.

## Exercise 2: Cross-Language Compare

**JavaScript vs Python:**
- Different root nodes: `program` vs `module`
- Different function nodes: `function_declaration` vs `function_definition`
- Different syntax requirements: braces vs indentation

## Exercise 3: Error Recovery

**Missing semicolon:** Usually parses fine (ASI in JavaScript)
**Missing brace:** ERROR node at end, function content still parsed
**Invalid syntax:** ERROR node around invalid operators, rest parses

**Key insight:** Error recovery enables editor features even with broken code.

## Exercise 4: Applications

- **Syntax highlighter:** Maps node types to colors
- **Code formatter:** Uses tree structure for indentation
- **Find-replace:** Precise matching using tree queries