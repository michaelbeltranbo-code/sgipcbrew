import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RawMaterialsModule } from './raw-materials/raw-materials.module';
import { ProductionModule } from './production/production.module';
import { ClientsModule } from './clients/clients.module';
import { FermentersModule } from './fermenters/fermenters.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BbtsModule } from './bbts/bbts.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false,
      
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
