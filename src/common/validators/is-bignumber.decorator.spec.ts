import { validate } from 'class-validator';
import { IsBigNumber } from './is-bignumber.decorator';
import { plainToInstance } from 'class-transformer';

// Create test class with the decorator
class TestDto {
  @IsBigNumber(2)
  amount: string;

  constructor(amount: string) {
    this.amount = amount;
  }
}

describe('IsBigNumber', () => {
  // Helper function to test validation
  const validateValue = async (value: string): Promise<boolean> => {
    const dto = plainToInstance(TestDto, { amount: value });
    const errors = await validate(dto);
    return errors.length === 0; // no errors means valid
  };

  // Helper function to test validation error messages
  const getErrorMessage = async (
    value: string,
  ): Promise<string | undefined> => {
    const dto = plainToInstance(TestDto, { amount: value });
    const errors = await validate(dto);
    return errors.length > 0 ? errors[0].constraints?.isBigNumber : undefined;
  };

  it('should validate valid numeric strings', async () => {
    expect(await validateValue('123')).toBe(true);
    expect(await validateValue('123.45')).toBe(true);
    expect(await validateValue('0')).toBe(true);
    expect(await validateValue('0.5')).toBe(true);
    expect(await validateValue('0.05')).toBe(true);
    expect(await validateValue('10000.99')).toBe(true);
  });

  it('should validate negative numeric values', async () => {
    expect(await validateValue('-123')).toBe(true);
    expect(await validateValue('-123.45')).toBe(true);
    expect(await validateValue('-0.5')).toBe(true);
  });

  it('should reject values with too many decimal places', async () => {
    expect(await validateValue('123.456')).toBe(false);
    expect(await validateValue('0.123')).toBe(false);
    expect(await validateValue('-10.999')).toBe(false);
  });

  it('should reject non-numeric strings', async () => {
    expect(await validateValue('abc')).toBe(false);
    expect(await validateValue('123abc')).toBe(false);
    expect(await validateValue('abc123')).toBe(false);
    expect(await validateValue('12.34.56')).toBe(false);
  });

  it('should reject special characters except for decimal point and minus sign', async () => {
    expect(await validateValue('123,45')).toBe(false);
    expect(await validateValue('$123.45')).toBe(false);
    expect(await validateValue('123.45%')).toBe(false);
  });

  it('should reject empty values', async () => {
    expect(await validateValue('')).toBe(false);
  });

  it('should reject NaN and Infinity values', async () => {
    expect(await validateValue('NaN')).toBe(false);
    expect(await validateValue('Infinity')).toBe(false);
    expect(await validateValue('-Infinity')).toBe(false);
  });

  describe('customizable decimal places', () => {
    // Create test classes with different decimal place limits
    class TestDtoNoDecimals {
      @IsBigNumber(0)
      amount: string;
    }

    class TestDtoFourDecimals {
      @IsBigNumber(4)
      amount: string;
    }

    it('should validate based on specified decimal places (0)', async () => {
      const dto = plainToInstance(TestDtoNoDecimals, { amount: '123' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);

      const invalidDto = plainToInstance(TestDtoNoDecimals, {
        amount: '123.1',
      });
      const invalidErrors = await validate(invalidDto);
      expect(invalidErrors.length).toBe(1);
    });

    it('should validate based on specified decimal places (4)', async () => {
      const dto = plainToInstance(TestDtoFourDecimals, { amount: '123.1234' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);

      const invalidDto = plainToInstance(TestDtoFourDecimals, {
        amount: '123.12345',
      });
      const invalidErrors = await validate(invalidDto);
      expect(invalidErrors.length).toBe(1);
    });
  });

  describe('error messages', () => {
    it('should provide appropriate error message for invalid values', async () => {
      const errorMessage = await getErrorMessage('123.456');
      expect(errorMessage).toContain('must be a valid numeric string');
      expect(errorMessage).toContain('2 decimal places');
    });

    it('should provide customized error message when provided', async () => {
      class CustomMessageDto {
        @IsBigNumber(2, { message: 'Custom error message for $property' })
        amount: string;
      }

      const dto = plainToInstance(CustomMessageDto, { amount: '123.456' });
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].constraints?.isBigNumber).toBe(
        'Custom error message for amount',
      );
    });
  });
});
