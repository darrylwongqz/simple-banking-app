import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBigNumber } from '../../common/validators/is-bignumber.decorator';

export class WithdrawDto {
  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'User UUID performing the withdrawal',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: '150.00',
    description: 'Withdrawal amount as a string to preserve precision',
  })
  @IsString()
  @IsNotEmpty()
  @IsBigNumber(2, {
    message:
      'Amount must be a valid numeric string with no more than 2 decimal places',
  })
  amount: string;
}
