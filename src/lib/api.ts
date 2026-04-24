import { supabase } from './supabase'
import type { Platform } from '../types'

export async function refreshPlatformData(clientId: string, platform: Platform, dateStart: string, dateStop: string) {
  const fnName = platform.replace('_', '-')
  return supabase.functions.invoke(fnName, {
    body: { client_id: clientId, date_start: dateStart, date_stop: dateStop }
  })
}
