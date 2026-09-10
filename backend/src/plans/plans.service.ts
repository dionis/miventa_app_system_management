import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { getSupabaseAdmin } from '../config/supabase';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Injectable()
export class PlansService {
  private get supabase() {
    return getSupabaseAdmin();
  }

  /** Admin: todos los planes (activos e inactivos) para gestionar servicios y precios. */
  async findAllAdmin(tier?: string) {
    let query = this.supabase
      .from('plans')
      .select('*')
      .order('tier', { ascending: true })
      .order('is_enterprise', { ascending: true })
      .order('duration_months', { ascending: true });
    if (tier === 'normal' || tier === 'premium') {
      query = query.eq('tier', tier);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async create(dto: CreatePlanDto, actorId?: string) {
    const { data, error } = await this.supabase
      .from('plans')
      .insert({
        key: dto.key,
        name: dto.name,
        description: dto.description ?? null,
        duration_months: dto.duration_months,
        price: dto.price,
        currency: dto.currency ?? 'USD',
        tier: dto.tier ?? 'normal',
        is_enterprise: dto.is_enterprise ?? false,
        features: dto.features ?? [],
        is_active: dto.is_active ?? true,
      })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('Plan key already exists');
      }
      throw error;
    }
    await this.supabase.from('event_logs').insert({
      actor_id: actorId ?? null,
      action: 'plan_created',
      entity_type: 'plan',
      entity_id: data.id,
      details: { key: data.key, price: data.price },
    });
    return data;
  }

  async update(id: string, dto: UpdatePlanDto, actorId?: string) {
    // No permitir cambiar el key (es el vínculo i18n)
    const { data, error } = await this.supabase
      .from('plans')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new NotFoundException('Plan not found');
    await this.supabase.from('event_logs').insert({
      actor_id: actorId ?? null,
      action: 'plan_updated',
      entity_type: 'plan',
      entity_id: id,
      details: dto,
    });
    return data;
  }

  async remove(id: string, actorId?: string) {
    // Bloquear borrado si hay suscripciones o pagos asociados
    const [{ count: subs }, { count: pays }] = await Promise.all([
      this.supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', id),
      this.supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', id),
    ]);
    if ((subs || 0) > 0 || (pays || 0) > 0) {
      throw new ConflictException(
        'Plan has subscriptions/payments. Deactivate it instead of deleting.',
      );
    }
    const { error } = await this.supabase.from('plans').delete().eq('id', id);
    if (error) throw error;
    await this.supabase.from('event_logs').insert({
      actor_id: actorId ?? null,
      action: 'plan_deleted',
      entity_type: 'plan',
      entity_id: id,
    });
    return { deleted: true };
  }
}
