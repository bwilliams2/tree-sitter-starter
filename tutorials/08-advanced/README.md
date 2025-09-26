# Module 8: Advanced Topics

Congratulations on making it to the final module! Here we'll explore cutting-edge Tree-sitter features, learn how to contribute to the ecosystem, and discover how to build production-grade language tooling.

## 🎯 Learning Objectives

By the end of this module, you will:
- Master external scanners for complex tokenization
- Understand language injection and multi-language parsing
- Know how to contribute to Tree-sitter and build parser ecosystems
- Implement advanced language tooling (LSP servers, formatters, etc.)
- Optimize parsers for production deployment
- Build custom Tree-sitter tooling and integrations

## 🔧 External Scanners Deep Dive

External scanners handle complex tokenization that regular expressions can't:

### Advanced External Scanner Example

Let's build a scanner for Python-like indentation:

**`src/scanner.c`**:
```c
#include <tree_sitter/parser.h>
#include <wctype.h>

enum TokenType {
    INDENT,
    DEDENT,
    NEWLINE,
    COMMENT
};

typedef struct {
    int32_t *indents;
    uint32_t indent_length;
    uint32_t indent_capacity;
} Scanner;

void *tree_sitter_language_external_scanner_create() {
    Scanner *scanner = calloc(1, sizeof(Scanner));
    scanner->indents = calloc(1, sizeof(int32_t));
    scanner->indent_capacity = 1;
    scanner->indent_length = 1;
    scanner->indents[0] = 0;
    return scanner;
}

void tree_sitter_language_external_scanner_destroy(void *payload) {
    Scanner *scanner = (Scanner *)payload;
    free(scanner->indents);
    free(scanner);
}

static void advance(TSLexer *lexer) {
    lexer->advance(lexer, false);
}

static void skip(TSLexer *lexer) {
    lexer->advance(lexer, true);
}

static bool scan_indent(Scanner *scanner, TSLexer *lexer) {
    lexer->mark_end(lexer);
    
    int32_t indent_length = 0;
    while (lexer->lookahead == ' ') {
        indent_length++;
        advance(lexer);
    }
    
    // Skip blank lines and comments
    if (lexer->lookahead == '\n' || lexer->lookahead == '#') {
        return false;
    }
    
    int32_t current_indent = scanner->indents[scanner->indent_length - 1];
    
    if (indent_length > current_indent) {
        // Increase indentation
        if (scanner->indent_length == scanner->indent_capacity) {
            scanner->indent_capacity *= 2;
            scanner->indents = realloc(scanner->indents, 
                                     scanner->indent_capacity * sizeof(int32_t));
        }
        scanner->indents[scanner->indent_length] = indent_length;
        scanner->indent_length++;
        lexer->result_symbol = INDENT;
        return true;
    }
    
    if (indent_length < current_indent) {
        // Decrease indentation - might need multiple DEDENTs
        while (scanner->indent_length > 1 && 
               scanner->indents[scanner->indent_length - 1] > indent_length) {
            scanner->indent_length--;
        }
        lexer->result_symbol = DEDENT;
        return true;
    }
    
    return false;
}

bool tree_sitter_language_external_scanner_scan(
    void *payload,
    TSLexer *lexer,
    const bool *valid_symbols
) {
    Scanner *scanner = (Scanner *)payload;
    
    if (valid_symbols[INDENT] || valid_symbols[DEDENT]) {
        return scan_indent(scanner, lexer);
    }
    
    if (valid_symbols[NEWLINE] && lexer->lookahead == '\n') {
        advance(lexer);
        lexer->mark_end(lexer);
        lexer->result_symbol = NEWLINE;
        return true;
    }
    
    return false;
}

unsigned tree_sitter_language_external_scanner_serialize(
    void *payload,
    char *buffer
) {
    Scanner *scanner = (Scanner *)payload;
    
    if (scanner->indent_length * sizeof(int32_t) > TREE_SITTER_SERIALIZATION_BUFFER_SIZE) {
        return 0;
    }
    
    memcpy(buffer, scanner->indents, scanner->indent_length * sizeof(int32_t));
    return scanner->indent_length * sizeof(int32_t);
}

void tree_sitter_language_external_scanner_deserialize(
    void *payload,
    const char *buffer,
    unsigned length
) {
    Scanner *scanner = (Scanner *)payload;
    
    scanner->indent_length = length / sizeof(int32_t);
    if (scanner->indent_length > 0) {
        memcpy(scanner->indents, buffer, length);
    }
}
```

### Grammar Integration

**`grammar.js`**:
```javascript
module.exports = grammar({
  name: 'indented_language',
  
  externals: $ => [
    $.indent,
    $.dedent,  
    $.newline
  ],
  
  extras: $ => [
    /\s+/,
    $.comment
  ],
  
  rules: {
    source_file: $ => repeat($.statement),
    
    statement: $ => choice(
      $.simple_statement,
      $.compound_statement
    ),
    
    simple_statement: $ => seq(
      $.expression,
      $.newline
    ),
    
    compound_statement: $ => seq(
      'if',
      $.expression,
      ':',
      $.newline,
      $.block
    ),
    
    block: $ => seq(
      $.indent,
      repeat1($.statement),
      $.dedent
    ),
    
    expression: $ => choice(
      $.identifier,
      $.number,
      $.binary_expression
    ),
    
    // ... rest of grammar
  }
});
```

## 🌐 Language Injection and Multi-Language Parsing

Handle embedded languages within other languages:

### Template Language with Multiple Injections

**Grammar for template language**:
```javascript
module.exports = grammar({
  name: 'template',
  
  rules: {
    document: $ => repeat(choice(
      $.text,
      $.javascript_block,
      $.css_block,
      $.html_block
    )),
    
    text: $ => /[^<{]+/,
    
    javascript_block: $ => seq(
      '{{',
      field('content', $.javascript_content),
      '}}'
    ),
    
    css_block: $ => seq(
      '<style>',
      field('content', $.css_content),
      '</style>'
    ),
    
    html_block: $ => seq(
      '<template>',
      field('content', $.html_content),
      '</template>'
    ),
    
    javascript_content: $ => /[^}]*/,
    css_content: $ => /[^<]*/,  
    html_content: $ => /[^<]*/
  }
});
```

### Injection Queries

**`queries/injections.scm`**:
```scheme
; Inject JavaScript into {{ }} blocks
((javascript_block
   content: (javascript_content) @javascript))

; Inject CSS into <style> blocks  
((css_block
   content: (css_content) @css))

; Inject HTML into <template> blocks
((html_block
   content: (html_content) @html))
```

### Multi-Language Editor Integration

For editors like Neovim:

**`queries/highlights.scm`**:
```scheme
; Highlight template syntax
"{{" @punctuation.bracket
"}}" @punctuation.bracket

"<style>" @tag
"</style>" @tag
"<template>" @tag
"</template>" @tag

; Let injected languages handle their own highlighting
(javascript_content) @none
(css_content) @none
(html_content) @none
```

## 🏗️ Building Language Tooling

### Language Server Protocol (LSP) Integration

Create an LSP server using Tree-sitter:

**`lsp-server.js`**:
```javascript
const { 
    createConnection, 
    TextDocuments, 
    ProposedFeatures,
    TextDocumentSyncKind
} = require('vscode-languageserver/node');

const Parser = require('tree-sitter');
const Language = require('tree-sitter-simple-calc');

class CalculatorLanguageServer {
    constructor() {
        this.connection = createConnection(ProposedFeatures.all);
        this.documents = new TextDocuments(TextDocumentItem);
        this.parser = new Parser();
        this.parser.setLanguage(Language);
        
        this.setupHandlers();
    }
    
    setupHandlers() {
        // Document synchronization
        this.documents.onDidOpen(this.validateDocument.bind(this));
        this.documents.onDidChangeContent(this.validateDocument.bind(this));
        
        // Language features
        this.connection.onHover(this.handleHover.bind(this));
        this.connection.onDefinition(this.handleDefinition.bind(this));
        this.connection.onCompletion(this.handleCompletion.bind(this));
        this.connection.onDocumentSymbol(this.handleDocumentSymbol.bind(this));
        
        // Lifecycle
        this.connection.onInitialize(this.handleInitialize.bind(this));
        this.connection.onInitialized(() => {
            console.log('Calculator Language Server initialized');
        });
    }
    
    handleInitialize() {
        return {
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Full,
                hoverProvider: true,
                definitionProvider: true,
                completionProvider: {
                    triggerCharacters: ['.', ' ']
                },
                documentSymbolProvider: true
            }
        };
    }
    
    validateDocument(change) {
        const document = change.document;
        const text = document.getText();
        const tree = this.parser.parse(text);
        
        const diagnostics = [];
        
        function findErrors(node) {
            if (node.type === 'ERROR') {
                diagnostics.push({
                    severity: 1, // Error
                    range: {
                        start: document.positionAt(node.startIndex),
                        end: document.positionAt(node.endIndex)
                    },
                    message: 'Syntax error',
                    source: 'calculator-lsp'
                });
            }
            
            for (let child of node.children) {
                findErrors(child);
            }
        }
        
        findErrors(tree.rootNode);
        
        this.connection.sendDiagnostics({
            uri: document.uri,
            diagnostics
        });
    }
    
    handleHover(params) {
        const document = this.documents.get(params.textDocument.uri);
        const position = params.position;
        const offset = document.offsetAt(position);
        
        const tree = this.parser.parse(document.getText());
        const node = tree.rootNode.descendantForIndex(offset);
        
        if (node.type === 'binary_expression') {
            const left = node.childForFieldName('left').text;
            const operator = node.childForFieldName('operator').text;
            const right = node.childForFieldName('right').text;
            
            return {
                contents: {
                    kind: 'markdown',
                    value: `**Binary Expression**\n\nLeft: ${left}\nOperator: ${operator}\nRight: ${right}`
                }
            };
        }
        
        return null;
    }
    
    handleCompletion(params) {
        // Simple completion for variable names and operators
        return {
            isIncomplete: false,
            items: [
                { label: 'let', kind: 14, detail: 'Variable declaration' },
                { label: '+', kind: 12, detail: 'Addition operator' },
                { label: '-', kind: 12, detail: 'Subtraction operator' },
                { label: '*', kind: 12, detail: 'Multiplication operator' },
                { label: '/', kind: 12, detail: 'Division operator' }
            ]
        };
    }
    
    handleDocumentSymbol(params) {
        const document = this.documents.get(params.textDocument.uri);
        const tree = this.parser.parse(document.getText());
        const symbols = [];
        
        function collectSymbols(node) {
            if (node.type === 'variable_declaration') {
                const name = node.childForFieldName('name');
                symbols.push({
                    name: name.text,
                    kind: 13, // Variable
                    range: {
                        start: document.positionAt(node.startIndex),
                        end: document.positionAt(node.endIndex)
                    },
                    selectionRange: {
                        start: document.positionAt(name.startIndex),
                        end: document.positionAt(name.endIndex)
                    }
                });
            }
            
            for (let child of node.children) {
                collectSymbols(child);
            }
        }
        
        collectSymbols(tree.rootNode);
        return symbols;
    }
    
    start() {
        this.documents.listen(this.connection);
        this.connection.listen();
    }
}

// Start the server
const server = new CalculatorLanguageServer();
server.start();
```

### Code Formatter

Build a formatter using Tree-sitter:

**`formatter.js`**:
```javascript
class CalculatorFormatter {
    constructor() {
        this.parser = new Parser();
        this.parser.setLanguage(Language);
    }
    
    format(code, options = {}) {
        const tree = this.parser.parse(code);
        return this.formatNode(tree.rootNode, 0, options);
    }
    
    formatNode(node, indent, options) {
        const indentStr = ' '.repeat(indent * (options.tabSize || 2));
        
        switch (node.type) {
            case 'source_file':
                return node.children
                    .map(child => this.formatNode(child, indent, options))
                    .join('\n') + '\n';
                    
            case 'variable_declaration':
                const name = node.childForFieldName('name').text;
                const value = this.formatNode(node.childForFieldName('value'), 0, options);
                return `${indentStr}let ${name} = ${value};`;
                
            case 'binary_expression':
                const left = this.formatNode(node.childForFieldName('left'), 0, options);
                const operator = node.childForFieldName('operator').text;
                const right = this.formatNode(node.childForFieldName('right'), 0, options);
                return `${left} ${operator} ${right}`;
                
            case 'parenthesized_expression':
                const expr = node.children[1]; // Skip opening paren
                return `(${this.formatNode(expr, 0, options)})`;
                
            case 'number':
            case 'identifier':
                return node.text;
                
            default:
                return node.text;
        }
    }
}

// Usage
const formatter = new CalculatorFormatter();
const formatted = formatter.format('let x=5+3*2;', { tabSize: 4 });
console.log(formatted); // "let x = 5 + 3 * 2;\n"
```

### Linter/Static Analyzer

Create a linter using Tree-sitter queries:

**`linter.js`**:
```javascript
class CalculatorLinter {
    constructor() {
        this.parser = new Parser();
        this.parser.setLanguage(Language);
        this.setupRules();
    }
    
    setupRules() {
        this.rules = {
            'no-unused-variables': Language.query(`
                (variable_declaration
                  name: (identifier) @var.name) @declaration
            `),
            
            'prefer-const': Language.query(`
                (variable_declaration
                  name: (identifier) @name
                  value: (number) @value) @declaration
            `),
            
            'no-complex-expressions': Language.query(`
                (binary_expression
                  left: (binary_expression) @nested.left
                  right: (binary_expression) @nested.right) @complex
            `)
        };
    }
    
    lint(code) {
        const tree = this.parser.parse(code);
        const issues = [];
        
        // Check for unused variables
        const declarations = this.rules['no-unused-variables'].captures(tree.rootNode);
        const declaredVars = new Set();
        const usedVars = new Set();
        
        declarations.forEach(capture => {
            if (capture.name === 'var.name') {
                declaredVars.add(capture.node.text);
            }
        });
        
        // Find variable usage
        function findUsage(node) {
            if (node.type === 'identifier' && node.parent.type !== 'variable_declaration') {
                usedVars.add(node.text);
            }
            for (let child of node.children) {
                findUsage(child);
            }
        }
        findUsage(tree.rootNode);
        
        // Report unused variables
        declaredVars.forEach(varName => {
            if (!usedVars.has(varName)) {
                issues.push({
                    rule: 'no-unused-variables',
                    severity: 'warning',
                    message: `Variable '${varName}' is declared but never used`,
                    // position would be added from capture node
                });
            }
        });
        
        // Check for complex expressions
        const complexExprs = this.rules['no-complex-expressions'].captures(tree.rootNode);
        complexExprs.forEach(capture => {
            if (capture.name === 'complex') {
                issues.push({
                    rule: 'no-complex-expressions',
                    severity: 'info',
                    message: 'Consider breaking complex expression into multiple lines',
                    // position from capture.node
                });
            }
        });
        
        return issues;
    }
}
```

## 🌟 Contributing to Tree-sitter Ecosystem

### Creating High-Quality Parser Packages

#### Package Structure
```
tree-sitter-mylang/
├── grammar.js              # Grammar definition
├── src/                    # Generated parser code
│   ├── parser.c
│   ├── scanner.c          # Optional external scanner
│   └── tree_sitter/
├── test/
│   └── corpus/            # Test files
├── queries/               # Editor integration
│   ├── highlights.scm     # Syntax highlighting
│   ├── injections.scm     # Language injection
│   ├── locals.scm         # Local variable scoping
│   └── tags.scm           # Symbol tagging
├── examples/              # Example code files
├── package.json
├── binding.gyp            # Native module build
├── Cargo.toml            # Rust bindings
└── README.md
```

#### Quality Checklist

- [ ] **Comprehensive grammar** covering all language features
- [ ] **Extensive tests** with good coverage
- [ ] **Performance optimized** for large files
- [ ] **Editor queries** for highlighting and navigation
- [ ] **Documentation** with examples and usage
- [ ] **CI/CD setup** for automated testing
- [ ] **Multiple bindings** (Node.js, Python, Rust, etc.)

#### Publishing Process

1. **Test thoroughly** across platforms and use cases
2. **Document everything** - grammar rules, usage, examples
3. **Follow naming conventions** - `tree-sitter-{language}`
4. **Submit to Tree-sitter org** via GitHub discussion
5. **Maintain actively** - respond to issues and PRs

### Parser Ecosystem Contributions

#### Grammar Libraries
```javascript
// Reusable grammar components
const common = require('tree-sitter-common');

module.exports = grammar({
  name: 'mylang',
  
  rules: {
    // Use common patterns
    string_literal: common.string_literal,
    comment: common.c_style_comment,
    identifier: common.identifier,
    
    // Language-specific rules
    function_declaration: $ => seq(
      'function',
      $.identifier,
      common.parameter_list($),
      $.block
    )
  }
});
```

#### Editor Integration Packages

Create editor-specific packages:

**Neovim plugin**:
```lua
-- nvim-treesitter integration
require'nvim-treesitter.configs'.setup {
  ensure_installed = {"mylang"},
  highlight = {
    enable = true,
  },
  indent = {
    enable = true
  },
  textobjects = {
    enable = true,
    select = {
      keymaps = {
        ["af"] = "@function.outer",
        ["if"] = "@function.inner",
        ["ac"] = "@class.outer",
        ["ic"] = "@class.inner",
      },
    },
  },
}
```

**VS Code extension**:
```json
{
  "name": "mylang-support",
  "engines": { "vscode": "^1.60.0" },
  "contributes": {
    "languages": [{
      "id": "mylang",
      "extensions": [".mylang"],
      "configuration": "./language-configuration.json"
    }],
    "grammars": [{
      "language": "mylang", 
      "scopeName": "source.mylang",
      "path": "./syntaxes/mylang.json"
    }]
  },
  "dependencies": {
    "tree-sitter-mylang": "^1.0.0"
  }
}
```

## 🚀 Production Optimization

### Parser Performance Optimization

#### Benchmark-Driven Development
```javascript
const benchmark = require('benchmark');

const suite = new benchmark.Suite();

// Test different grammar approaches
suite
    .add('Approach A', () => {
        parser.setLanguage(LanguageA);
        parser.parse(testCode);
    })
    .add('Approach B', () => {
        parser.setLanguage(LanguageB);
        parser.parse(testCode);
    })
    .on('cycle', (event) => {
        console.log(String(event.target));
    })
    .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    .run({ async: true });
```

#### Memory Optimization
```javascript
class OptimizedParser {
    constructor() {
        this.parser = new Parser();
        this.language = null;
        this.parseCache = new Map();
    }
    
    setLanguage(language) {
        if (this.language !== language) {
            this.language = language;
            this.parser.setLanguage(language);
            this.parseCache.clear(); // Clear cache on language change
        }
    }
    
    parse(text, tree = null) {
        // Simple caching for identical inputs
        const cacheKey = text;
        if (this.parseCache.has(cacheKey) && !tree) {
            return this.parseCache.get(cacheKey);
        }
        
        const result = this.parser.parse(text, tree);
        
        if (!tree && this.parseCache.size < 100) { // Limit cache size
            this.parseCache.set(cacheKey, result);
        }
        
        return result;
    }
}
```

#### Web Assembly Optimization

Build optimized WASM parsers:

```bash
# Build with optimizations
tree-sitter build-wasm --docker

# Use specific emscripten flags
emcc -O3 -s WASM=1 -s EXPORTED_FUNCTIONS="['_tree_sitter_mylang']" \
     src/parser.c -o tree-sitter-mylang.wasm
```

### Deployment Strategies

#### Docker Container for Parser Services
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Pre-compile parsers
RUN tree-sitter build-wasm

EXPOSE 3000

CMD ["node", "server.js"]
```

#### Serverless Parser Functions
```javascript
// AWS Lambda function
exports.handler = async (event) => {
    const { language, code } = JSON.parse(event.body);
    
    // Lazy load parser
    const Parser = require('tree-sitter');
    const Language = require(`tree-sitter-${language}`);
    
    const parser = new Parser();
    parser.setLanguage(Language);
    
    const tree = parser.parse(code);
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            tree: tree.rootNode.toString(),
            hasErrors: tree.rootNode.hasError()
        })
    };
};
```

## 🔮 Future of Tree-sitter

### Emerging Trends

1. **Incremental Compilation** - Using Tree-sitter for faster builds
2. **AI-Assisted Parsing** - ML models trained on Tree-sitter trees
3. **Language Servers** - More LSP implementations using Tree-sitter
4. **Web IDE Integration** - Browser-based development tools
5. **Multi-modal Parsing** - Handling code mixed with documentation

### Research Directions

- **Error Correction** - Automatic syntax error fixes
- **Semantic Analysis** - Type checking and advanced analysis
- **Code Generation** - Template-based code generation
- **Cross-Language Analysis** - Multi-language project analysis

## 🎓 Final Project: Complete Language Toolchain

Create a complete toolchain for a simple language:

### Project Requirements

1. **Parser** - Complete grammar with error recovery
2. **Language Server** - LSP with hover, completion, diagnostics
3. **Formatter** - Code formatting with configurable style
4. **Linter** - Static analysis with custom rules
5. **Editor Integration** - VS Code extension or Vim plugin
6. **CLI Tools** - Parse, format, lint commands
7. **Documentation** - User guide and API docs
8. **Tests** - Comprehensive test suite with CI/CD

### Implementation Plan

1. **Week 1**: Design language and core grammar
2. **Week 2**: Implement parser with tests
3. **Week 3**: Build language server features
4. **Week 4**: Create formatter and linter
5. **Week 5**: Editor integration and CLI tools
6. **Week 6**: Documentation and polish

## 🎉 Congratulations!

You've completed the comprehensive Tree-sitter tutorial series! You now have the knowledge and skills to:

- Build parsers for any programming language
- Create sophisticated language tooling
- Contribute to the Tree-sitter ecosystem
- Optimize parsers for production use
- Build the future of language processing tools

## 🔗 Resources and Next Steps

### Essential Resources
- **Tree-sitter Documentation**: https://tree-sitter.github.io/tree-sitter/
- **GitHub Organization**: https://github.com/tree-sitter
- **Discussions Forum**: https://github.com/tree-sitter/tree-sitter/discussions
- **Parser Registry**: Complete list of available parsers

### Community

- **Discord**: Tree-sitter community chat
- **Reddit**: r/treesitter discussions
- **Twitter**: Follow @tree_sitter for updates

### Contributing

1. **Parser Development**: Create parsers for new languages
2. **Tool Building**: Build language servers, formatters, linters
3. **Editor Integration**: Improve editor support
4. **Documentation**: Help others learn Tree-sitter
5. **Core Development**: Contribute to Tree-sitter itself

---

## 🎯 Final Summary

**What you've mastered:**

✅ **Parser Development** - From simple grammars to complex languages
✅ **Advanced Techniques** - External scanners, injection, error recovery  
✅ **Testing & Debugging** - Comprehensive testing and systematic debugging
✅ **Language Tooling** - LSP servers, formatters, linters, analyzers
✅ **Production Deployment** - Performance optimization and scaling
✅ **Ecosystem Contribution** - Building and sharing parser tools

**Your journey continues:**
- Join the Tree-sitter community
- Build parsers for languages you love
- Create innovative language tooling
- Share your knowledge with others
- Push the boundaries of what's possible with parsing

**The future of language tooling is in your hands!** 🚀

Go forth and parse! 🌳✨