import { IsInt, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class ApplyLoanDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  /** 放款到哪个账户 */
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsNumber()
  @Min(1000, { message: '贷款金额至少 1000 元' })
  principal: number;

  @IsInt()
  @Min(1)
  @Max(60, { message: '期限最长 60 个月（示意）' })
  termMonths: number;
}
