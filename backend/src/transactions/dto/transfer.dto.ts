import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/** 同行转账：付款账号 → 收款账号 */
export class TransferDto {
  @IsString()
  @IsNotEmpty({ message: '付款账户 ID 不能为空' })
  fromAccountId: string;

  @IsString()
  @IsNotEmpty({ message: '收款账号不能为空' })
  toAccountNo: string;

  @IsNumber()
  @Min(0.01, { message: '转账金额须大于 0' })
  amount: number;

  @IsOptional()
  @IsString()
  remark?: string;
}
