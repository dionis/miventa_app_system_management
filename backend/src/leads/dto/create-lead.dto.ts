import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateLeadDto {
    @IsString()
    full_name: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    company?: string;

    @IsString()
    message: string;
}
