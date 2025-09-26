#!/usr/bin/env node

// Tree-sitter Installation Test

const { execSync } = require('child_process');

console.log('🧪 Testing Tree-sitter Installation\n');

try {
    console.log('✅ Tree-sitter version:');
    console.log(execSync('tree-sitter --version', { encoding: 'utf8' }));
    
    execSync('tree-sitter --help > /dev/null 2>&1');
    console.log('✅ Help command works');
    
    execSync('tree-sitter generate --help > /dev/null 2>&1');
    console.log('✅ Generate command available');
    
    console.log('\n🎉 Installation looks good!');
    console.log('\nTry these commands:');
    console.log('  tree-sitter init     # Create new parser');
    console.log('  tree-sitter generate # Generate parser code');
    
} catch (error) {
    console.log('❌ Tree-sitter not found. Run install.sh first.');
    process.exit(1);
}