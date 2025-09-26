const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');

class CodeAnalyzer {
    constructor() {
        this.parser = new Parser();
        this.parser.setLanguage(JavaScript);
    }
    
    analyze(code) {
        const tree = this.parser.parse(code);
        
        // Simple query for functions
        const functionQuery = JavaScript.query(`
            (function_declaration name: (identifier) @name) @function
        `);
        
        // Simple query for variables
        const variableQuery = JavaScript.query(`
            (variable_declaration 
              (variable_declarator name: (identifier) @name)) @variable
        `);
        
        const functions = functionQuery.captures(tree.rootNode)
            .filter(c => c.name === 'name')
            .map(c => c.node.text);
            
        const variables = variableQuery.captures(tree.rootNode)
            .filter(c => c.name === 'name')
            .map(c => c.node.text);
        
        console.log('📊 Code Analysis Results');
        console.log('========================');
        console.log(`Functions: ${functions.join(', ') || 'none'}`);
        console.log(`Variables: ${variables.join(', ') || 'none'}`);
        console.log(`Lines: ${code.split('\n').length}`);
        console.log(`Has errors: ${tree.rootNode.hasError()}`);
        
        return { functions, variables, tree };
    }
}

// Example usage
const code = `
function calculateArea(radius) {
    const pi = 3.14159;
    return pi * radius * radius;
}

const result = calculateArea(5);
console.log(result);
`;

const analyzer = new CodeAnalyzer();
analyzer.analyze(code);