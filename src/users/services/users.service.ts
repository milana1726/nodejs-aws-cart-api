import { Injectable } from '@nestjs/common';
import { User } from '../models';
import { pool } from '../../shared/db/db';

@Injectable()
export class UsersService {
  async findOne(name: string): Promise<User | null> {
    const { rows } = await pool.query('SELECT * FROM users WHERE name = $1', [
      name,
    ]);

    return rows[0] || null;
  }

  async createOne(user: User): Promise<User> {
    const { rows } = await pool.query(
      'INSERT INTO users (name, password) VALUES ($1, $2) RETURNING *',
      [user.name, user.password],
    );

    return rows[0];
  }
}
