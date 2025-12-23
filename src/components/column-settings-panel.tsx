'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Settings,
  LayoutTemplate,
  Save,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MAIN_CATEGORIES } from '@/lib/rss-feeds'
import {
  type ColumnLayout,
  type Column,
  type ColumnType,
  type ColumnFilter,
  getLayouts,
  getActiveLayout,
  saveLayout,
  setActiveLayout,
  deleteLayout,
  duplicateLayout,
  createBlankLayout,
  addColumn,
  removeColumn,
  updateColumn,
  reorderColumns,
  toggleColumnCollapse,
  DEFAULT_LAYOUTS
} from '@/lib/column-layouts'

interface ColumnSettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLayoutChange: () => void
}

export function ColumnSettingsPanel({
  open,
  onOpenChange,
  onLayoutChange
}: ColumnSettingsPanelProps) {
  const [layouts, setLayouts] = useState<ColumnLayout[]>([])
  const [activeLayout, setActiveLayoutState] = useState<ColumnLayout | null>(null)
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('')
  const [editingColumn, setEditingColumn] = useState<Column | null>(null)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [newLayoutName, setNewLayoutName] = useState('')

  // New column form state
  const [newColumnType, setNewColumnType] = useState<ColumnType>('category')
  const [newColumnCategory, setNewColumnCategory] = useState('Technology')
  const [newColumnLanguage, setNewColumnLanguage] = useState<'en' | 'tr' | 'all'>('en')
  const [newColumnTitle, setNewColumnTitle] = useState('')

  // Load layouts on mount
  useEffect(() => {
    if (open) {
      loadLayouts()
    }
  }, [open])

  const loadLayouts = async () => {
    const loadedLayouts = await getLayouts()
    const active = await getActiveLayout()
    setLayouts(loadedLayouts)
    setActiveLayoutState(active)
    if (active) {
      setSelectedLayoutId(active.id)
    }
  }

  const handleSelectLayout = async (layoutId: string) => {
    setSelectedLayoutId(layoutId)
    const layout = layouts.find(l => l.id === layoutId)
    if (layout) {
      setActiveLayoutState(layout)
      await setActiveLayout(layoutId)
      onLayoutChange()
    }
  }

  const handleCreateLayout = async () => {
    if (!newLayoutName.trim()) return

    const newLayout = createBlankLayout(newLayoutName)
    await saveLayout({ ...newLayout, name: newLayoutName })
    await setActiveLayout(newLayout.id)
    setNewLayoutName('')
    await loadLayouts()
    onLayoutChange()
  }

  const handleDuplicateLayout = async (layoutId: string) => {
    const layout = layouts.find(l => l.id === layoutId)
    if (!layout) return

    const duplicated = await duplicateLayout(layoutId, `${layout.name} (Copy)`)
    await setActiveLayout(duplicated.id)
    await loadLayouts()
    onLayoutChange()
  }

  const handleDeleteLayout = async (layoutId: string) => {
    if (layouts.length <= 1) {
      alert('Cannot delete the last layout')
      return
    }

    if (confirm('Delete this layout?')) {
      await deleteLayout(layoutId)
      await loadLayouts()
      onLayoutChange()
    }
  }

  const handleAddColumn = async () => {
    if (!activeLayout || !newColumnTitle.trim()) return

    const filter: ColumnFilter = { type: newColumnType }

    switch (newColumnType) {
      case 'category':
        filter.category = newColumnCategory
        break
      case 'language':
        filter.language = newColumnLanguage === 'all' ? undefined : newColumnLanguage
        break
    }

    const updated = await addColumn(activeLayout.id, {
      title: newColumnTitle,
      filter,
      width: 50,
      collapsed: false
    })

    setActiveLayoutState(updated)
    setShowAddColumn(false)
    setNewColumnTitle('')
    await loadLayouts()
    onLayoutChange()
  }

  const handleRemoveColumn = async (columnId: string) => {
    if (!activeLayout) return

    if (activeLayout.columns.length <= 1) {
      alert('Cannot remove the last column')
      return
    }

    if (confirm('Remove this column?')) {
      const updated = await removeColumn(activeLayout.id, columnId)
      setActiveLayoutState(updated)
      await loadLayouts()
      onLayoutChange()
    }
  }

  const handleUpdateColumn = async (columnId: string, updates: Partial<Column>) => {
    if (!activeLayout) return

    const updated = await updateColumn(activeLayout.id, columnId, updates)
    setActiveLayoutState(updated)
    await loadLayouts()
    onLayoutChange()
  }

  const handleToggleCollapse = async (columnId: string) => {
    if (!activeLayout) return

    const updated = await toggleColumnCollapse(activeLayout.id, columnId)
    setActiveLayoutState(updated)
    onLayoutChange()
  }

  const handleReorderColumns = async (direction: 'left' | 'right', index: number) => {
    if (!activeLayout) return

    const newOrder = [...activeLayout.columns.map(c => c.id)]
    const temp = newOrder[index]

    if (direction === 'left' && index > 0) {
      newOrder[index] = newOrder[index - 1]
      newOrder[index - 1] = temp
    } else if (direction === 'right' && index < newOrder.length - 1) {
      newOrder[index] = newOrder[index + 1]
      newOrder[index + 1] = temp
    }

    const updated = await reorderColumns(activeLayout.id, newOrder)
    setActiveLayoutState(updated)
    await loadLayouts()
    onLayoutChange()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border-4 border-black">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl">
            [ COLUMN LAYOUT MANAGER ]
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Layout Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs uppercase">Active Layout</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setNewLayoutName('')}
                  className="text-xs font-mono border-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  NEW
                </Button>
              </div>
            </div>

            <Select value={selectedLayoutId} onValueChange={handleSelectLayout}>
              <SelectTrigger className="font-mono border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {layouts.map(layout => (
                  <SelectItem key={layout.id} value={layout.id} className="font-mono">
                    {layout.name} ({layout.columns.length} columns)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* New Layout Form */}
            {newLayoutName !== null && (
              <div className="flex gap-2">
                <Input
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  placeholder="New layout name..."
                  className="font-mono border-2"
                />
                <Button
                  onClick={handleCreateLayout}
                  className="font-mono text-xs border-2"
                >
                  <Save className="w-3 h-3 mr-1" />
                  CREATE
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setNewLayoutName('')}
                  className="font-mono text-xs border-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Layout Actions */}
            {activeLayout && !DEFAULT_LAYOUTS.find(d => d.id === activeLayout.id) && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => activeLayout && handleDuplicateLayout(activeLayout.id)}
                  className="text-xs font-mono border-2"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  DUPLICATE
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => activeLayout && handleDeleteLayout(activeLayout.id)}
                  className="text-xs font-mono border-2 text-red-600 hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  DELETE
                </Button>
              </div>
            )}
          </div>

          {/* Columns List */}
          {activeLayout && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-mono text-xs uppercase">
                  Columns ({activeLayout.columns.length})
                </Label>
                <Button
                  size="sm"
                  onClick={() => setShowAddColumn(true)}
                  className="text-xs font-mono border-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  ADD COLUMN
                </Button>
              </div>

              {/* Add Column Form */}
              {showAddColumn && (
                <div className="border-2 border-black p-4 space-y-3">
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase">Column Title</Label>
                    <Input
                      value={newColumnTitle}
                      onChange={(e) => setNewColumnTitle(e.target.value)}
                      placeholder="My Column"
                      className="font-mono border-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase">Column Type</Label>
                    <Select value={newColumnType} onValueChange={(v: ColumnType) => setNewColumnType(v)}>
                      <SelectTrigger className="font-mono border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Feeds</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="language">Language</SelectItem>
                        <SelectItem value="custom">Custom Feeds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newColumnType === 'category' && (
                    <div className="space-y-2">
                      <Label className="font-mono text-xs uppercase">Category</Label>
                      <Select value={newColumnCategory} onValueChange={setNewColumnCategory}>
                        <SelectTrigger className="font-mono border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MAIN_CATEGORIES.filter(c => c !== 'All').map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {newColumnType === 'language' && (
                    <div className="space-y-2">
                      <Label className="font-mono text-xs uppercase">Language</Label>
                      <Select value={newColumnLanguage} onValueChange={(v: any) => setNewColumnLanguage(v)}>
                        <SelectTrigger className="font-mono border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="tr">Türkçe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddColumn}
                      disabled={!newColumnTitle.trim()}
                      className="flex-1 font-mono text-xs border-2"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      ADD COLUMN
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowAddColumn(false)}
                      className="font-mono text-xs border-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Columns */}
              <div className="space-y-2">
                {activeLayout.columns
                  .sort((a, b) => a.order - b.order)
                  .map((column, index) => (
                    <div
                      key={column.id}
                      className="border-2 border-black p-3 flex items-center gap-3"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold">
                            {column.title}
                          </span>
                          <span className="text-xs font-mono text-gray-500">
                            ({Math.round(column.width)}%)
                          </span>
                        </div>
                        <div className="text-xs font-mono text-gray-500">
                          Type: {column.filter.type}
                          {column.filter.category && ` > ${column.filter.category}`}
                          {column.filter.language && ` > ${column.filter.language}`}
                        </div>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReorderColumns('left', index)}
                          disabled={index === 0}
                          className="p-1 border"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReorderColumns('right', index)}
                          disabled={index === activeLayout.columns.length - 1}
                          className="p-1 border"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Collapse Toggle */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleCollapse(column.id)}
                        className="p-1 border"
                        title={column.collapsed ? 'Expand' : 'Collapse'}
                      >
                        {column.collapsed ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronUp className="w-3 h-3" />
                        )}
                      </Button>

                      {/* Remove Column */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveColumn(column.id)}
                        disabled={activeLayout.columns.length <= 1}
                        className="p-1 border text-red-600 hover:text-red-500"
                        title="Remove column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Preset Layouts */}
          <div className="space-y-3">
            <Label className="font-mono text-xs uppercase">Preset Layouts</Label>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_LAYOUTS.map(layout => (
                <Button
                  key={layout.id}
                  variant="ghost"
                  onClick={() => handleSelectLayout(layout.id)}
                  className={`text-xs font-mono border-2 h-auto py-3 flex flex-col ${
                    selectedLayoutId === layout.id ? 'bg-black text-white' : ''
                  }`}
                >
                  <span className="font-bold">{layout.name}</span>
                  <span className="text-xs opacity-70">{layout.columns.length} columns</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
