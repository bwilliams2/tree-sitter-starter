const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');

// Simple parser usage example
const parser = new Parser();
parser.setLanguage(JavaScript);

const code = `
function greet(name) {
    return "Hello, " + name;
}
greet("World");
`;

console.log('🌳 Parsing JavaScript Code\n');

const tree = parser.parse(code);
console.log('Syntax tree:');
console.log(tree.rootNode.toString());

console.log(`\nTree info:
- Root type: ${tree.rootNode.type}
- Child count: ${tree.rootNode.childCount}
- Has errors: ${tree.rootNode.hasError()}`);

// Access function name
const func = tree.rootNode.firstChild;
if (func.type === 'function_declaration') {
    const name = func.childForFieldName('name');
    console.log(`- Function name: ${name.text}`);
}