import { Injectable } from '@nestjs/common';
import { getSupabaseAdmin } from '../config/supabase';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  private get supabase() {
    return getSupabaseAdmin();
  }

  async create(dto: CreateLeadDto) {
    const { data, error } = await this.supabase
      .from('leads')
      .insert({
        full_name: dto.full_name,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        message: dto.message,
        source: 'contact_form',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findAll(page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, total: count, page, limit };
  }

  async markAsRead(id: string) {
    const { data, error } = await this.supabase
      .from('leads')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
