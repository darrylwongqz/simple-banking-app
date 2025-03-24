import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBigNumber } from '../../common/validators/is-bignumber.decorator';

export class CreateAccountDto {
  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'Owner user UUID',
  })
  @IsUUID()
  @IsNotEmpty()
  ownerUserId: string;

  @ApiProperty({ example: 'Savings Account', description: 'The account name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '1000.00',
    description: 'Initial balance as a string to preserve precision',
    minimum: 0,
  })
  @IsString()
  @IsNotEmpty()
  @IsBigNumber(2, {
    message:
      'Initial balance must be a valid numeric string with no more than 2 decimal places',
  })
  startingBalance: string;
}
