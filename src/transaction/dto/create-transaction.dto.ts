import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsDate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBigNumber } from '../../common/validators/is-bignumber.decorator';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Unique transaction ID',
    example: 'a7f1e4c2-3b7d-4b68-9a4f-1a2d3e4f5678',
  })
  @IsUUID()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({
    description: 'Associated bank account ID',
    example: 'b8f2e4c3-4c8e-5c79-0b5f-2b3d4e5f6789',
  })
  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ description: 'Type of transaction', example: 'DEPOSIT' })
  @IsString()
  @IsNotEmpty()
  transactionType: string;

  @ApiProperty({
    description: 'Amount of the transaction as a string',
    example: '500.00',
  })
  @IsString()
  @IsNotEmpty()
  @IsBigNumber(2, {
    message:
      'Amount must be a valid numeric string with no more than 2 decimal places',
  })
  amount: string;

  @ApiProperty({
    description: 'Timestamp of the transaction',
    example: new Date().toISOString(),
  })
  @IsDate()
  timestamp: Date;

  @ApiPropertyOptional({
    description: 'Related account ID for transfers',
    example: 'c9f3e5d4-5d9f-6e80-1c6g-3c4e5f6g7890',
  })
  @IsOptional()
  @IsUUID()
  relatedAccount?: string;
}
