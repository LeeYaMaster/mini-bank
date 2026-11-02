import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export enum AccountTypeDto {
  CHECKING = 'CHECKING',
  FIXED = 'FIXED',
}

/** 开立账户 DTO（银行侧：开户 / 签约存款产品） */
export class OpenAccountDto {
  @IsString()
  @IsNotEmpty({ message: '客户 ID 不能为空' })
  customerId: string;

  @IsEnum(AccountTypeDto, { message: '账户类型须为 CHECKING（活期）或 FIXED（定期）' })
  type: AccountTypeDto;

  /** 开户初始存入金额 */
  @IsNumber({}, { message: '初始金额须为数字' })
  @Min(0, { message: '初始金额不能为负' })
  initialDeposit: number;

  /** 定期存期（月），活期可不传 */
  @ValidateIf((o) => o.type === AccountTypeDto.FIXED)
  @IsNumber()
  @Min(1, { message: '定期存期至少 1 个月' })
  termMonths?: number;
}
