# Exercise Solutions - Module 1

## Exercise 1 Solutions

### Expressions:
1. `5 + 2 * 3 - 1` → `(5 + (2 * 3)) - 1` (multiplication first, then left-to-right)
2. `((2 + 3) * 4)` → Addition happens first due to parentheses
3. `if (x) { y(); }` → if_statement → condition + body → call_expression

## Exercise 2 Solutions

### Errors:
1. Missing brace: ERROR node at end, but function content parses correctly
2. Invalid operators: ERROR node around `+ *`, but `let x = ` and `2;` parse fine

## Exercise 3 Solutions

### Applications:
- **Syntax highlighter**: Node types map to colors (keyword, identifier, string)
- **Code formatter**: Tree structure determines indentation and spacing
- **Refactoring tool**: Query for `(call_expression function: (identifier) @name)` to find calls