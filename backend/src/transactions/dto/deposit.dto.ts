import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class DepositDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsNumber()
  @Min(0.01, { message: '存款金额须大于 0' })
  amount: number;

  @IsOptional()
  @IsString()
  remark?: string;
}
