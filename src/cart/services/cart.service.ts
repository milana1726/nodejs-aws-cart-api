import { Injectable, Logger } from '@nestjs/common';
import { pool } from '../../shared/db/db';
import { Cart, CartStatuses, CartItem } from '../models';
import { PutCartPayload } from '../../order/type';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  async findByUserId(userId: string): Promise<Cart | null> {
    try {
      this.logger.debug(`Finding cart for user ${userId}`);

      const { rows } = await pool.query(
        `SELECT * FROM carts WHERE user_id = $1 AND status = $2 ORDER BY updated_at DESC LIMIT 1`,
        [userId, CartStatuses.OPEN],
      );

      if (!rows.length) {
        this.logger.debug(`No cart found for user ${userId}`);
        return null;
      }

      const cart = rows[0];

      const { rows: items } = await pool.query(
        'SELECT * FROM cart_items WHERE cart_id = $1',
        [cart.id],
      );

      return {
        ...cart,
        items: items.map(
          (item): CartItem => ({
            product: {
              id: item.product_id,
              title: '',
              description: '',
              price: 0,
            },
            count: item.count,
          }),
        ),
      };
    } catch (error) {
      this.logger.error(`Error finding cart for user ${userId}`, error);
      throw error;
    }
  }

  async createByUserId(userId: string): Promise<Cart> {
    const { rows } = await pool.query(
      `INSERT INTO carts (user_id)
       VALUES ($1)
       RETURNING *`,
      [userId],
    );

    return {
      ...rows[0],
      items: [],
    };
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    let cart = await this.findByUserId(userId);

    if (!cart) {
      cart = await this.createByUserId(userId);
    }

    return cart;
  }

  async updateByUserId(userId: string, payload: PutCartPayload): Promise<Cart> {
    const cart = await this.findOrCreateByUserId(userId);

    if (payload.count === 0) {
      await pool.query(
        'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
        [cart.id, payload.product.id],
      );
    } else {
      await pool.query(
        `INSERT INTO cart_items (cart_id, product_id, count)
         VALUES ($1, $2, $3)
         ON CONFLICT (cart_id, product_id)
         DO UPDATE SET count = EXCLUDED.count`,
        [cart.id, payload.product.id, payload.count],
      );
    }

    await pool.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [
      cart.id,
    ]);

    const updatedCart = await this.findByUserId(userId);

    return updatedCart as Cart;
  }

  async removeByUserId(userId: string): Promise<void> {
    await pool.query(
      `UPDATE carts
       SET status = $1, updated_at = NOW()
       WHERE user_id = $2 AND status = $3`,
      [CartStatuses.ORDERED, userId, CartStatuses.OPEN],
    );
  }
}
