export * from './order.service';
import { OrderService } from './order.service';
export * from './seller.service';
import { SellerService } from './seller.service';
export const APIS = [OrderService, SellerService];
