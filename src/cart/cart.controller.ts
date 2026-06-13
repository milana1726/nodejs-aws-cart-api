import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  HttpStatus,
  HttpCode,
  BadRequestException,
  Inject,
} from '@nestjs/common';

import { calculateCartTotal } from './models-rules';
import { CartService } from './services';
import { CartItem } from './models';
import { CreateOrderDto, PutCartPayload } from '../order/type';
import { pool } from '../shared/db/db';
import { Order } from 'src/order/models';

@Controller('api/profile/cart')
export class CartController {
  constructor(@Inject(CartService) private cartService: CartService) {}

  @Get()
  async findUserCart(): Promise<CartItem[]> {
    const userId = '11111111-1111-1111-1111-111111111111';

    const cart = await this.cartService.findOrCreateByUserId(userId);

    return cart.items;
  }

  @Put()
  async updateUserCart(@Body() body: PutCartPayload): Promise<CartItem[]> {
    const userId = '11111111-1111-1111-1111-111111111111';

    const cart = await this.cartService.updateByUserId(userId, body);

    return cart.items;
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearUserCart(): Promise<void> {
    const userId = '11111111-1111-1111-1111-111111111111';

    await this.cartService.removeByUserId(userId);
  }

  @Put('order')
  async checkout(@Body() body: CreateOrderDto) {
    const userId = '11111111-1111-1111-1111-111111111111';

    await pool.query('BEGIN');

    try {
      const cart = await this.cartService.findByUserId(userId);

      if (!(cart && cart.items.length)) {
        throw new BadRequestException('Cart is empty');
      }

      const { id: cartId, items } = cart;
      const total = calculateCartTotal(items);

      const { rows } = await pool.query(
        `
      INSERT INTO orders
      (user_id, cart_id, payment, delivery, comments, status, total)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
        [
          userId,
          cartId,
          JSON.stringify({ type: 'card' }),
          JSON.stringify({ address: body.address }),
          '',
          'CREATED',
          total,
        ],
      );

      await pool.query(
        `
      UPDATE carts
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      `,
        ['ORDERED', cartId],
      );

      await pool.query('COMMIT');

      return { order: rows[0] };
    } catch (e) {
      await pool.query('ROLLBACK');
      throw e;
    }
  }

  @Get('order')
  async getOrders(): Promise<Order[]> {
    const { rows } = await pool.query(`
    SELECT * FROM orders ORDER BY created_at DESC
  `);

    return rows;
  }
}
