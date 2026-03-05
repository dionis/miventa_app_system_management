import { Injectable } from '@nestjs/common';
import { getSupabaseAdmin } from '../config/supabase';

@Injectable()
export class LogsService {
    private get supabase() {
        return getSupabaseAdmin();
    }

    async findAll(page = 1, limit = 50, entityType?: string) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = this.supabase
            .from('event_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (entityType) {
            query = query.eq('entity_type', entityType);
        }

        const { data, error, count } = await query.range(from, to);
        if (error) throw error;
        return { data, total: count, page, limit };
    }
}
