import { IsString, IsUUID, IsNumber } from 'class-validator';

export class CreateOrderDto {
    @IsUUID()
    plan_id: string;

    @IsString()
    user_id: string;
}
