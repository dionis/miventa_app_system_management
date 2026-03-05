import { Injectable, NotFoundException } from '@nestjs/common';
import { getSupabaseAdmin } from '../config/supabase';
import { CreateReferrerDto, UpdateReferrerDto } from './dto/referrer.dto';

@Injectable()
export class ReferralsService {
    private get supabase() {
        return getSupabaseAdmin();
    }

    private generateReferralCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'REF-';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async create(dto: CreateReferrerDto) {
        const referralCode = this.generateReferralCode();

        const { data, error } = await this.supabase
            .from('referrers')
            .insert({
                full_name: dto.full_name,
                email: dto.email,
                phone: dto.phone,
                bank_account_number: dto.bank_account_number,
                bank_name: dto.bank_name,
                referral_code: referralCode,
            })
            .select()
            .single();

        if (error) throw error;

        // Log the event
        await this.supabase.from('event_logs').insert({
            action: 'referrer_created',
            entity_type: 'referrer',
            entity_id: data.id,
            details: { full_name: dto.full_name, referral_code: referralCode },
        });

        return data;
    }

    async findAll(page = 1, limit = 20, search?: string) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = this.supabase
            .from('referrers')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,referral_code.ilike.%${search}%`);
        }

        const { data, error, count } = await query.range(from, to);
        if (error) throw error;
        return { data, total: count, page, limit };
    }

    async findOne(id: string) {
        const { data, error } = await this.supabase
            .from('referrers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw new NotFoundException('Referrer not found');
        return data;
    }

    async update(id: string, dto: UpdateReferrerDto) {
        const { data, error } = await this.supabase
            .from('referrers')
            .update({ ...dto, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await this.supabase.from('event_logs').insert({
            action: 'referrer_updated',
            entity_type: 'referrer',
            entity_id: id,
            details: dto,
        });

        return data;
    }

    async remove(id: string) {
        const { error } = await this.supabase
            .from('referrers')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await this.supabase.from('event_logs').insert({
            action: 'referrer_deleted',
            entity_type: 'referrer',
            entity_id: id,
        });

        return { deleted: true };
    }
}
