import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RawMaterialsModule } from './raw-materials/raw-materials.module';
import { ProductionModule } from './production/production.module';
import { ClientsModule } from './clients/clients.module';
import { FermentersModule } from './fermenters/fermenters.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BbtsModule } from './bbts/bbts.module';
import { ReportsModule } from './reports/reports.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      
    }),
   
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.get<string>('DB_HOST'),
    port: config.get<number>('DB_PORT'),
    username: config.get<string>('DB_USER'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_NAME'),
    autoLoadEntities: true,
    synchronize: true,
  }),
}),
    RawMaterialsModule,
    ProductionModule,
    ClientsModule,
    FermentersModule,
    AuthModule,
    UsersModule,
    BbtsModule,
    ReportsModule,
  ],
})
export class AppModule {}
