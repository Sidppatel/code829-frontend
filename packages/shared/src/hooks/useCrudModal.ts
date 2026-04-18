import { useCallback, useState } from 'react';

export type CrudMode = 'create' | 'edit';

export interface UseCrudModalResult<T> {
  open: boolean;
  mode: CrudMode;
  entity: T | null;
  saving: boolean;
  setSaving: (b: boolean) => void;
  openCreate: () => void;
  openEdit: (entity: T) => void;
  close: () => void;
}

export function useCrudModal<T = unknown>(): UseCrudModalResult<T> {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CrudMode>('create');
  const [entity, setEntity] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = useCallback(() => {
    setEntity(null);
    setMode('create');
    setSaving(false);
    setOpen(true);
  }, []);

  const openEdit = useCallback((e: T) => {
    setEntity(e);
    setMode('edit');
    setSaving(false);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setSaving(false);
  }, []);

  return { open, mode, entity, saving, setSaving, openCreate, openEdit, close };
}
