import { IsString, IsNumber, Min, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ example: 'user-uuid', description: 'ID of the owner user' })
  @IsUUID()
  @IsNotEmpty()
  ownerUserId: string;

  @ApiProperty({ example: 'Savings Account', description: 'The account name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1000, description: 'Initial balance', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  startingBalance: number;
}
