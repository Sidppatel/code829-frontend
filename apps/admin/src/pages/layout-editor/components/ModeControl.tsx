import { Card, Button, Space } from 'antd';
import { SelectOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { EditorMode } from '../LayoutEditorPage';

interface ModeControlProps {
  editorMode: EditorMode;
  onEditorModeChange: (mode: EditorMode) => void;
  disabled: boolean;
}

const MODE_OPTIONS: { mode: EditorMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'select', icon: <SelectOutlined />, label: 'Select' },
  { mode: 'add', icon: <PlusOutlined />, label: 'Add' },
  { mode: 'delete', icon: <DeleteOutlined />, label: 'Delete' },
];

export default function ModeControl({ editorMode, onEditorModeChange, disabled }: ModeControlProps) {
  return (
    <Card size="small" title="Mode" style={{ marginBottom: 12 }}>
      <Space wrap style={{ width: '100%' }}>
        {MODE_OPTIONS.map((opt) => (
          <Button
            key={opt.mode}
            type={editorMode === opt.mode ? 'primary' : 'default'}
            icon={opt.icon}
            onClick={() => onEditorModeChange(opt.mode)}
            disabled={disabled}
            style={{ borderRadius: 8 }}
          >
            {opt.label}
          </Button>
        ))}
      </Space>
    </Card>
  );
}
