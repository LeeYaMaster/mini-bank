import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

/** 开立客户（银行侧：建 CIF / 客户信息建档） */
export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  name: string;

  @IsString()
  @Length(15, 18, { message: '证件号长度应为 15 或 18 位（示意）' })
  idNumber: string;

  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确（示意：1 开头 11 位）' })
  phone: string;
}
