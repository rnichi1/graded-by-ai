import { validateSync } from 'class-validator';
import { IsNotEmptyString } from './IsNotEmptyString'; // Adjust import according to your structure

class TestClass {
  @IsNotEmptyString({ message: 'Name should not be empty' })
  name: string;
}

describe('IsNotEmptyString', () => {
  it('should validate a non-empty string', () => {
    const instance = new TestClass();
    instance.name = 'John Doe'; // Valid non-empty string

    const errors = validateSync(instance);
    expect(errors.length).toBe(0); // No validation errors expected
  });

  it('should return an error for an empty string', () => {
    const instance = new TestClass();
    instance.name = ''; // Invalid empty string

    const errors = validateSync(instance);
    expect(errors.length).toBe(1); // Expect one validation error
    expect(errors[0].constraints).toHaveProperty(
      'isNotEmptyString',
      'Name should not be empty',
    );
  });

  it('should return an error for null value', () => {
    const instance = new TestClass();
    // @ts-expect-error Testing invalid input
    instance.name = null; // Invalid null value

    const errors = validateSync(instance);
    expect(errors.length).toBe(1); // Expect one validation error
    expect(errors[0].constraints).toHaveProperty(
      'isNotEmptyString',
      'Name should not be empty',
    );
  });

  it('should return an error for a non-string value', () => {
    const instance = new TestClass();
    instance.name = 123 as any; // Invalid non-string value

    const errors = validateSync(instance);
    expect(errors.length).toBe(1); // Expect one validation error
    expect(errors[0].constraints).toHaveProperty(
      'isNotEmptyString',
      'Name should not be empty',
    );
  });
});
