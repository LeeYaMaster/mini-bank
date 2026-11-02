import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { StoreService } from '../store/store.service';
import { Customer } from '../store/entities';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly store: StoreService) {}

  findAll(): Customer[] {
    return this.store.getSnapshot().customers;
  }

  findOne(id: string): Customer {
    const c = this.store.getSnapshot().customers.find((x) => x.id === id);
    if (!c) throw new NotFoundException(`客户不存在: ${id}`);
    return c;
  }

  /**
   * 开户前置：建立客户档案
   * 面试点：同一证件号不可重复建档（本项目简单唯一校验）
   */
  create(dto: CreateCustomerDto): Customer {
    const data = this.store.getSnapshot();
    if (data.customers.some((c) => c.idNumber === dto.idNumber)) {
      throw new ConflictException('该证件号已建档，请勿重复开立客户');
    }
    const customer: Customer = {
      id: uuid(),
      name: dto.name.trim(),
      idNumber: dto.idNumber.trim(),
      phone: dto.phone.trim(),
      createdAt: new Date().toISOString(),
    };
    data.customers.push(customer);
    this.store.persist();
    return customer;
  }
}
