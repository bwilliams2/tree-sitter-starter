module.exports = grammar({
  name: 'simple_calc',

  extras: $ => [
    /\s+/,        // Whitespace
    $.comment,    // Comments
  ],

  rules: {
    // Start rule - represents the entire program
    source_file: $ => repeat($.statement),

    // A statement can be a declaration or expression
    statement: $ => choice(
      $.variable_declaration,
      $.expression_statement
    ),

    // Variable declarations: let x = 5;
    variable_declaration: $ => seq(
      'let',
      field('name', $.identifier),
      '=',
      field('value', $.expression),
      ';'
    ),

    // Expression followed by semicolon
    expression_statement: $ => seq($.expression, ';'),

    // All types of expressions
    expression: $ => choice(
      $.identifier,
      $.number,
      $.parenthesized_expression,
      $.binary_expression
    ),

    // Binary operations with precedence
    binary_expression: $ => {
      const table = [
        [1, '+', '-'],    // Addition and subtraction (lowest precedence)
        [2, '*', '/'],    // Multiplication and division (higher precedence)
      ];

      return choice(...table.map(([precedence, ...operators]) =>
        operators.map(operator =>
          prec.left(precedence, seq(
            field('left', $.expression),
            field('operator', operator),
            field('right', $.expression)
          ))
        )
      ).flat());
    },

    // Parenthesized expressions for grouping
    parenthesized_expression: $ => seq(
      '(',
      $.expression,
      ')'
    ),

    // Numbers (integers and floats)
    number: $ => {
      const decimal = /[0-9]+/;
      const float = seq(decimal, '.', decimal);
      
      return token(choice(float, decimal));
    },

    // Identifiers (variable names)
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // Single-line comments
    comment: $ => token(seq('//', /.*/)),
  }
});