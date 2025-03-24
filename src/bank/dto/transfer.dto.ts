import { IsString, IsNumber, Min, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({
    example: 'user-uuid',
    description: 'ID of the user initiating the transfer',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'account-uuid-1', description: 'Source account ID' })
  @IsUUID()
  @IsNotEmpty()
  fromAccountId: string;

  @ApiProperty({
    example: 'account-uuid-2',
    description: 'Destination account ID',
  })
  @IsUUID()
  @IsNotEmpty()
  toAccountId: string;

  @ApiProperty({ example: 300, description: 'Transfer amount', minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;
}
