# Module 1 Exercises

Quick exercises to test your understanding of parsing concepts.

## Exercise 1: Predict Tree Structures

For each expression, predict how Tree-sitter would structure it:

1. `5 + 2 * 3 - 1` (remember operator precedence!)
2. `((2 + 3) * 4)` (parentheses change grouping)
3. `if (x) { y(); }` (nested language constructs)

## Exercise 2: Error Analysis

What happens when Tree-sitter encounters these errors?

1. `function test() { return "hello"` (missing closing brace)
2. `let x = + * 2;` (invalid operator sequence)

**Think about:** Where would ERROR nodes appear? What parts parse correctly?

## Exercise 3: Real-World Applications

How would syntax trees help these tools?

1. **Syntax highlighter** - How does it know to color keywords vs variables?
2. **Code formatter** - How does it know where to add indentation?
3. **Refactoring tool** - How does it find all uses of a function?

## Solutions

Check the `solutions/` directory, but try predicting first!