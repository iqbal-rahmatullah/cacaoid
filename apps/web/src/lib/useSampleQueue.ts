import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { post } from './api'
import { deviceStore, flushQueue, loadQueue, submitSample, type FlushResult, type Pending } from './queue'

const send = (p: Pending) => post(`/batches/${p.batchId}/samples`, p.body)

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

// Field remembers batch, garden and officer between samples (per device).
export const remember = (k: string) => deviceStore()?.getItem(`lap.${k}`) ?? ''
export const keep = (k: string, v: string) => {
  try {
    deviceStore()?.setItem(`lap.${k}`, v)
  } catch {
    /* storage full or blocked: the form still works, it just won't remember */
  }
}

export function useSampleQueue() {
  const qc = useQueryClient()
  const online = useSyncExternalStore(subscribe, () => navigator.onLine)
  const [pending, setPending] = useState(() => loadQueue(deviceStore()).length)
  const [rejected, setRejected] = useState<FlushResult['rejected']>([])

  const sync = useCallback(async () => {
    const out = await flushQueue(deviceStore(), send)
    if (out.rejected.length) setRejected((r) => [...r, ...out.rejected])
    setPending(loadQueue(deviceStore()).length)
    if (out.sent.length) for (const key of ['batch', 'tasks', 'dashboard']) qc.invalidateQueries({ queryKey: [key] })
  }, [qc])

  useEffect(() => {
    sync()
    window.addEventListener('online', sync)
    return () => window.removeEventListener('online', sync)
  }, [sync])

  const submit = async (p: Pending) => {
    const how = await submitSample(deviceStore(), send, p)
    setPending(loadQueue(deviceStore()).length)
    if (how === 'terkirim') for (const key of [['batch', p.batchId], ['tasks'], ['dashboard']]) qc.invalidateQueries({ queryKey: key })
    return how
  }

  return { online, pending, rejected, sync, submit }
}
