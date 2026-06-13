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

import { Order, OrderService } from '../order';
import { calculateCartTotal } from './models-rules';
import { CartService } from './services';
import { CartItem } from './models';
import { CreateOrderDto, PutCartPayload } from '../order/type';

@Controller('api/profile/cart')
export class CartController {
  constructor(
    @Inject(CartService) private cartService: CartService,
    @Inject(OrderService) private orderService: OrderService,
  ) {}

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

    const cart = await this.cartService.findByUserId(userId);

    if (!(cart && cart.items.length)) {
      throw new BadRequestException('Cart is empty');
    }

    const { id: cartId, items } = cart;
    const total = calculateCartTotal(items);
    const order = this.orderService.create({
      userId,
      cartId,
      items: items.map(({ product, count }) => ({
        productId: product.id,
        count,
      })),
      address: body.address,
      total,
    });

    await this.cartService.removeByUserId(userId);

    return { order };
  }

  @Get('order')
  getOrder(): Order[] {
    return this.orderService.getAll();
  }
}
