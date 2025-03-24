import { IsNumber, Min, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({
    example: 'user-uuid',
    description: 'ID of the user performing the deposit',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 200, description: 'Deposit amount', minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;
}
