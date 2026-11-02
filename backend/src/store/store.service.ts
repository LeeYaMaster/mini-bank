import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { BankData } from './entities';
import { seedData } from './seed';

/**
 * 简易持久化：内存 + JSON 文件
 * 真实银行核心用数据库 + 事务 + 账务日切；这里为了「好启动」用文件即可
 */
@Injectable()
export class StoreService implements OnModuleInit {
  private readonly filePath = path.join(process.cwd(), 'data', 'bank.json');
  private data!: BankData;

  onModuleInit() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw) as BankData;
        return;
      }
    } catch {
      // 读失败则重新 seed
    }
    this.data = seedData();
    this.persist();
  }

  getSnapshot(): BankData {
    return this.data;
  }

  /** 在内存中修改后调用，写入磁盘 */
  persist() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  /** 重置为种子数据（演示用） */
  reset() {
    this.data = seedData();
    this.persist();
    return this.data;
  }

  nextAccountNo(): string {
    this.data.seq.account += 1;
    // 6222 开头示意银联卡 BIN，后接序号
    return `6222${String(this.data.seq.account).padStart(12, '0')}`;
  }

  nextBizId(prefix: string): string {
    this.data.seq.biz += 1;
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${prefix}${ts}${String(this.data.seq.biz).padStart(6, '0')}`;
  }
}
