import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBigNumber } from '../../common/validators/is-bignumber.decorator';

export class TransferDto {
  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'User UUID initiating the transfer',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7g8h-9i10-j11k12l13m14',
    description: 'Source account UUID',
  })
  @IsUUID()
  @IsNotEmpty()
  fromAccountId: string;

  @ApiProperty({
    example: 'n15o16p17-q18r19s20-t21u22v23',
    description: 'Destination account UUID',
  })
  @IsUUID()
  @IsNotEmpty()
  toAccountId: string;

  @ApiProperty({
    example: '300.00',
    description: 'Transfer amount as a string to preserve precision',
    minimum: 1,
  })
  @IsString()
  @IsNotEmpty()
  @IsBigNumber(2, {
    message:
      'Amount must be a valid numeric string with no more than 2 decimal places',
  })
  amount: string;
}
