import { IsString, IsNumber, Min, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawDto {
  @ApiProperty({
    example: 'user-uuid',
    description: 'ID of the user performing the withdrawal',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 150, description: 'Withdrawal amount', minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;
}
