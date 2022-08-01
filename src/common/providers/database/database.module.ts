import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { connectionSource } from './datasource';

@Module({
  imports: [TypeOrmModule.forRoot(connectionSource.options), DatabaseModule],
})
export class DatabaseModule {}
