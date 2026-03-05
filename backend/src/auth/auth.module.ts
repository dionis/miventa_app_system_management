import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SupabaseStrategy } from './supabase.strategy';
import { RolesGuard } from './roles.guard';

@Module({
    imports: [PassportModule.register({ defaultStrategy: 'supabase' })],
    providers: [SupabaseStrategy, RolesGuard],
    exports: [PassportModule, RolesGuard],
})
export class AuthModule { }
