import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import BigNumber from 'bignumber.js';

export function IsBigNumber(
  maxDecimalPlaces: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBigNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any): boolean {
          try {
            const bn = new BigNumber(value);
            // Verify it's a finite number, not NaN, and has at most maxDecimalPlaces.
            return bn.isFinite() && !bn.isNaN() && bn.dp() <= maxDecimalPlaces;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid numeric string convertible to BigNumber with no more than ${maxDecimalPlaces} decimal places`;
        },
      },
    });
  };
}
