import { Test, TestingModule } from '@nestjs/testing';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';

describe('ApiGatewayController', () => {
  let apiGatewayController: ApiGatewayController;

  const mockClientProxy = {
    send: () => of(''),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ApiGatewayController],
      providers: [
        ApiGatewayService,
        {
          provide: 'PRODUCTS_SERVICE',
          useValue: mockClientProxy,
        },
        {
          provide: 'ORDERS_SERVICE',
          useValue: mockClientProxy,
        },
        {
          provide: 'PAYMENTS_SERVICE',
          useValue: mockClientProxy,
        },
        {
          provide: 'ADMIN_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    apiGatewayController = app.get<ApiGatewayController>(ApiGatewayController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(apiGatewayController.getHello()).toBe(
        'Vai Coxinha API Gateway - Online!',
      );
    });
  });
});
