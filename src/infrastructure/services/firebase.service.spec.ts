import { Test, TestingModule } from '@nestjs/testing';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, initializeApp, ServiceAccount } from 'firebase-admin/app';

import { FirebaseService } from './firebase.service';

import { APP_IMPORTS } from '../../app.imports';

const FirebaseAppProvider: Provider<App> = {
  provide: 'FIREBASE_APP',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const json = configService.get<string>('FIREBASE_SERVICE_ACCOUNT');

    if (!json) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
    }

    const serviceAccount = JSON.parse(json) as ServiceAccount;
    return initializeApp({ credential: cert(serviceAccount) });
  },
};

describe('FirebaseService', () => {
  let service: FirebaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...APP_IMPORTS],
      providers: [FirebaseAppProvider, FirebaseService],
    }).compile();

    service = module.get<FirebaseService>(FirebaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
