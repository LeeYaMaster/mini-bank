import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class RepayLoanDto {
  @IsString()
  @IsNotEmpty()
  loanId: string;

  /** 从哪个账户扣款还款 */
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
