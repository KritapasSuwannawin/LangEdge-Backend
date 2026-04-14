import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/infrastructure/database/entities/user.entity';
import type { IUserRepository, UpsertUserInput } from '@/repositories/user/i-user.repository';
import type { UserRecord } from '@/domain/user/user.record';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string): Promise<UserRecord | null> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    return toUserRecord(entity);
  }

  async upsert(data: UpsertUserInput): Promise<UserRecord> {
    const existing = await this.repo.findOne({ where: { id: data.id } });

    if (!existing) {
      const created = this.repo.create({
        id: data.id,
        email: data.email,
        name: data.name,
        picture_url: data.pictureUrl,
      });
      const saved = await this.repo.save(created);
      return toUserRecord(saved);
    }

    existing.email = data.email;
    existing.name = data.name;
    if (data.pictureUrl !== null) {
      existing.picture_url = data.pictureUrl;
    }
    const saved = await this.repo.save(existing);
    return toUserRecord(saved);
  }

  async updateLastUsedLanguageId(userId: string, languageId: number | null): Promise<void> {
    await this.repo.update({ id: userId }, { last_used_language_id: languageId });
  }
}

function toUserRecord(entity: User): UserRecord {
  return {
    id: entity.id,
    email: entity.email,
    name: entity.name,
    pictureUrl: entity.picture_url,
    createdAt: entity.created_at,
    lastUsedLanguageId: entity.last_used_language_id,
  };
}
