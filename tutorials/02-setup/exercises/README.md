# Module 2 Exercises

Practice setting up Tree-sitter.

## Exercise 1: Installation

1. Run the installation script: `./examples/install.sh`
2. Test with: `node examples/test-install.js`
3. Try: `tree-sitter --version` and `tree-sitter --help`

## Exercise 2: First Parser Project

```bash
mkdir my-parser
cd my-parser
tree-sitter init
```

**Questions:**
- What files were created?
- Look at `grammar.js` - what's in it?
- Try `tree-sitter generate` - what happens?

## Exercise 3: Simple Test

Create a test file and try to parse it:
```bash
echo "hello" > test.txt
tree-sitter parse test.txt
```

**Expected:** It should fail because there's no grammar yet. This is normal!

Check `solutions/` for detailed explanations.