import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { get, type Batch, type BatchSummary } from './api'
import { selectBatch } from './field'
import { keep, remember } from './useSampleQueue'

// The batch the officer works in, remembered per device and shared by the field pages.
export function useCurrentBatch() {
  const batches = useQuery({ queryKey: ['batches'], queryFn: () => get<BatchSummary[]>('/batches') })
  const [chosen, setChosen] = useState<number | null>(() => Number(remember('batch')) || null)
  const batchId = selectBatch(chosen, batches.data?.map((b) => b.id))
  const batch = useQuery({ queryKey: ['batch', batchId], enabled: !!batchId, queryFn: () => get<Batch>(`/batches/${batchId}`) })
  const choose = (id: number | null) => {
    setChosen(id)
    keep('batch', id ? String(id) : '')
  }
  return { batches, batchId, batch, choose }
}
