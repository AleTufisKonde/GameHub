import { supabase } from './supabase';
import { Usuario } from './types';
import bcrypt from 'bcryptjs';

const SESSION_KEY = 'gamehub_sesion';

export async function login(email: string, contrasena: string): Promise<Usuario> {
  const { data, error } = await supabase
    .from('usuario')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) throw new Error('Correo o contraseña incorrectos');

  // Compara la contraseña con el hash bcrypt
  const passwordValida = await bcrypt.compare(contrasena, data.contrasena);
  if (!passwordValida) throw new Error('Correo o contraseña incorrectos');

  if (!data.activo) throw new Error('Tu cuenta está inactiva. Contacta al gerente.');

  const usuario = data as Usuario;
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
  }
  return usuario;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function obtenerSesion(): Usuario | null {
  if (typeof window === 'undefined') return null;
  const datos = localStorage.getItem(SESSION_KEY);
  if (!datos) return null;
  try {
    return JSON.parse(datos) as Usuario;
  } catch {
    return null;
  }
}

export function esGerente(): boolean {
  return obtenerSesion()?.rol === 'gerente';
}