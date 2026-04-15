import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query, getAll } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const profiles = await getAll(
      `SELECT profile_type, creci, trade_name, cnpj, area_of_operation, is_active, created_at
       FROM user_profiles
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [user.id]
    );

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('GET /api/user/profiles error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { profile_type, creci, trade_name, cnpj, area_of_operation } = body;

    const validTypes = ['autonomo', 'imobiliaria', 'proprietario', 'comprador'];
    if (!profile_type || !validTypes.includes(profile_type)) {
      return NextResponse.json({ error: 'Tipo de perfil inválido' }, { status: 400 });
    }

    // Validate required fields per type
    if (profile_type === 'autonomo') {
      if (!creci || !creci.trim()) {
        return NextResponse.json({ error: 'CRECI é obrigatório para Autônomo' }, { status: 400 });
      }
    }

    if (profile_type === 'imobiliaria') {
      if (!creci || !creci.trim()) {
        return NextResponse.json({ error: 'CRECI é obrigatório para Imobiliária' }, { status: 400 });
      }
      if (!trade_name || !trade_name.trim()) {
        return NextResponse.json({ error: 'Nome fantasia é obrigatório para Imobiliária' }, { status: 400 });
      }
    }

    await query(
      `INSERT INTO user_profiles (user_id, profile_type, creci, trade_name, cnpj, area_of_operation, is_active, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
       ON CONFLICT (user_id, profile_type)
       DO UPDATE SET
         creci = EXCLUDED.creci,
         trade_name = EXCLUDED.trade_name,
         cnpj = EXCLUDED.cnpj,
         area_of_operation = EXCLUDED.area_of_operation,
         is_active = TRUE,
         updated_at = NOW()`,
      [
        user.id,
        profile_type,
        creci?.trim() || null,
        trade_name?.trim() || null,
        cnpj?.trim() || null,
        area_of_operation?.trim() || null,
      ]
    );

    return NextResponse.json({ success: true, profile_type }, { status: 201 });
  } catch (error) {
    console.error('POST /api/user/profiles error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { profile_type } = body;

    if (!profile_type) {
      return NextResponse.json({ error: 'Tipo de perfil é obrigatório' }, { status: 400 });
    }

    if (profile_type === 'comprador') {
      return NextResponse.json({ error: 'O perfil Comprador não pode ser removido' }, { status: 400 });
    }

    await query(
      `DELETE FROM user_profiles WHERE user_id = $1 AND profile_type = $2`,
      [user.id, profile_type]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/user/profiles error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
