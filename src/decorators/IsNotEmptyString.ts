import {
  registerDecorator,
  ValidationOptions,
  isString,
  isNotEmpty,
} from 'class-validator';

export function IsNotEmptyString(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isNotEmptyString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return isString(value) && isNotEmpty(value);
        },
        defaultMessage() {
          return '$property must be a non-empty string';
        },
      },
    });
  };
}
