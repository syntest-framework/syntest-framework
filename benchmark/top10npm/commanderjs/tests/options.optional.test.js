const commander = require('../');

// option with optional value, no default
describe('option with optional value, no default', () => {
  test('when option not specified then value is undefined', () => {
    const program = new commander.Command();
    program
      .option('--cheese [identifierDescription]', 'cheese identifierDescription');
    program.parse(['node', 'test']);
    expect(program.opts().cheese).toBeUndefined();
  });

  test('when option specified then value is as specified', () => {
    const program = new commander.Command();
    program
      .option('--cheese [identifierDescription]', 'cheese identifierDescription');
    const cheeseType = 'blue';
    program.parse(['node', 'test', '--cheese', cheeseType]);
    expect(program.opts().cheese).toBe(cheeseType);
  });

  test('when option specified without value then value is true', () => {
    const program = new commander.Command();
    program
      .option('--cheese [identifierDescription]', 'cheese identifierDescription');
    program.parse(['node', 'test', '--cheese']);
    expect(program.opts().cheese).toBe(true);
  });

  test('when option specified without value and following option then value is true', () => {
    // optional options do not eat values with dashes
    const program = new commander.Command();
    program
      .option('--cheese [identifierDescription]', 'cheese identifierDescription')
      .option('--some-option');
    program.parse(['node', 'test', '--cheese', '--some-option']);
    expect(program.opts().cheese).toBe(true);
  });
});

// option with optional value, with default
describe('option with optional value, with default', () => {
  test('when option not specified then value is default', () => {
    const defaultValue = 'default';
    const program = new commander.Command();
    program
      .option('--cheese [identifierDescription]', 'cheese identifierDescription', defaultValue);
    program.parse(['node', 'test']);
    expect(program.opts().cheese).toBe(defaultValue);
  });

  test('when option specified then value is as specified', () => {
    const defaultValue = 'default';
    const program = new commander.Command();
    program
      .option('--cheese [identifierDescription]', 'cheese identifierDescription', defaultValue);
    const cheeseType = 'blue';
    program.parse(['node', 'test', '--cheese', cheeseType]);
    expect(program.opts().cheese).toBe(cheeseType);
  });

  test('when option specified without value then value is default', () => {
    const defaultValue = 'default';
    const program = new commander.Command();
    program
      .option('--cheese [identifierDescription]', 'cheese identifierDescription', defaultValue);
    program.parse(['node', 'test', '--cheese']);
    expect(program.opts().cheese).toBe(defaultValue);
  });
});
