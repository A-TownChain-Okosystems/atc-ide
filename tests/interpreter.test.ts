import assert from 'node:assert/strict';
import test from 'node:test';

import { Lexer } from '../src/interpreter/lexer';
import { Parser } from '../src/interpreter/parser';
import { TokenType } from '../src/interpreter/types';

test('lexer recognizes keywords, identifiers, numbers, and operators', () => {
  const lexer = new Lexer('let answer = 42 + 1 == 43');
  const actual: Array<[TokenType, string]> = [];

  for (;;) {
    const token = lexer.nextToken();
    actual.push([token.type, token.literal]);
    if (token.type === TokenType.EOF) break;
  }

  assert.deepEqual(actual, [
    [TokenType.LET, 'let'],
    [TokenType.IDENTIFIER, 'answer'],
    [TokenType.ASSIGN, '='],
    [TokenType.NUMBER, '42'],
    [TokenType.PLUS, '+'],
    [TokenType.NUMBER, '1'],
    [TokenType.EQ, '=='],
    [TokenType.NUMBER, '43'],
    [TokenType.EOF, ''],
  ]);
});

test('parser preserves arithmetic precedence in let and print statements', () => {
  const parser = new Parser(new Lexer('let answer = 1 + 2 * 3\nprint answer'));
  const program = parser.parseProgram();

  assert.deepEqual(parser.errors, []);
  assert.equal(program.statements.length, 2);

  const declaration = program.statements[0];
  assert.equal(declaration.type, 'LetStatement');
  if (declaration.type !== 'LetStatement') {
    assert.fail('expected a let statement');
  }

  assert.equal(declaration.name.value, 'answer');
  assert.equal(declaration.value.type, 'BinaryExpression');
  if (declaration.value.type !== 'BinaryExpression') {
    assert.fail('expected an additive binary expression');
  }

  assert.equal(declaration.value.operator, '+');
  assert.equal(declaration.value.right.type, 'BinaryExpression');
  if (declaration.value.right.type !== 'BinaryExpression') {
    assert.fail('expected multiplication to bind more tightly than addition');
  }
  assert.equal(declaration.value.right.operator, '*');

  const output = program.statements[1];
  assert.equal(output.type, 'PrintStatement');
  if (output.type === 'PrintStatement') {
    assert.deepEqual(output.value, { type: 'Identifier', value: 'answer' });
  }
});
