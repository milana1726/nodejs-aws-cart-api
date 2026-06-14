import {
  Controller,
  Get,
  Delete,
  Put,
  Body,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  BadRequestException,
  Inject,
} from '@nestjs/common';

import { BasicAuthGuard } from '../auth';
import { AppRequest, getUserIdFromRequest } from '../shared';

import { calculateCartTotal } from './models-rules';
import { CartService } from './services';
import { CartItem } from './models';

import { CreateOrderDto, PutCartPayload } from '../order/type';
import { pool } from '../shared/db/db';

@Controller('api/profile/cart')
export class CartController {
  constructor(@Inject(CartService) private cartService: CartService) {}

  @UseGuards(BasicAuthGuard)
  @Get()
  async findUserCart(@Req() req: AppRequest): Promise<CartItem[]> {
    const userId = getUserIdFromRequest(req);
    const cart = await this.cartService.findOrCreateByUserId(userId);

    return cart.items;
  }

  @UseGuards(BasicAuthGuard)
  @Put()
  async updateUserCart(
    @Req() req: AppRequest,
    @Body() body: PutCartPayload,
  ): Promise<CartItem[]> {
    const userId = getUserIdFromRequest(req);
    const cart = await this.cartService.updateByUserId(userId, body);

    return cart.items;
  }

  @UseGuards(BasicAuthGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearUserCart(@Req() req: AppRequest): Promise<void> {
    const userId = getUserIdFromRequest(req);
    await this.cartService.removeByUserId(userId);
  }

  @UseGuards(BasicAuthGuard)
  @Put('order')
  async checkout(@Req() req: AppRequest, @Body() body: CreateOrderDto) {
    const userId = getUserIdFromRequest(req);

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

      const order = rows[0];

      return [
        {
          ...order,
          status: 'ORDERED',
          items: items.map((item) => ({
            productId: item.product.id,
            count: item.count,
          })),
          statusHistory: [
            {
              status: 'ORDERED',
              timestamp: order.created_at,
              comment: '',
            },
          ],
        },
      ];
    } catch (e) {
      await pool.query('ROLLBACK');
      throw e;
    }
  }

  @UseGuards(BasicAuthGuard)
  @Get('order')
  async getOrders(@Req() req: AppRequest): Promise<any[]> {
    const userId = getUserIdFromRequest(req);

    const { rows } = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );

    return Promise.all(
      rows.map(async (order) => {
        let items: { product_id: string; count: number }[] = [];

        try {
          const res = await pool.query(
            `
            SELECT product_id, count
            FROM cart_items
            WHERE cart_id = $1
            `,
            [order.cart_id],
          );

          items = res.rows;
        } catch (e) {
          console.error('Items fetch error:', e);
        }

        return {
          ...order,
          items: items.map((item) => ({
            productId: item.product_id,
            count: item.count,
          })),
          statusHistory: [
            {
              status: order.status,
              timestamp: order.created_at,
              comment: '',
            },
          ],
        };
      }),
    );
  }
}
