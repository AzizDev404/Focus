import { useState, type CSSProperties } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../types'
import { useFlocusStore } from '../store/useFlocusStore'
import { IconTasks } from './icons/FlocusIcons'

const TAG_COLORS: Record<string, string> = {
  pink: '#FF3DB1',
  green: '#1CDA51',
  blue: '#1DAEFF',
  purple: '#9D3BFF',
  orange: '#FF7714',
  yellow: '#FFB800',
  neutral: '#CCA56A',
  red: '#D91C1C',
}

const EMOJI_PICKS = ['📚', '💻', '🎨', '🏃', '☕', '🧠', '✍️', '🎯', '💡', '🔥', '📝', '🎵']

function TaskClearIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}

function fireConfetti() {
  const accent =
    useFlocusStore.getState().settings.accentColor || '#7432FF'
  const colors = [accent, '#f472b6', '#a78bfa', '#60a5fa', '#fbbf24']
  for (let i = 0; i < 50; i++) {
    const el = document.createElement('div')
    el.className = 'confetti-piece'
    el.style.left = `${Math.random() * 100}vw`
    el.style.background = colors[i % colors.length]
    el.style.animationDelay = `${Math.random() * 0.5}s`
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 3000)
  }
}

function SortableTaskRow({
  task,
  onComplete,
  onRemove,
  onUpdate,
}: {
  task: Task
  onComplete: (id: string) => void
  onRemove: (id: string) => void
  onUpdate: (id: string, partial: Partial<Task>) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const [showEmoji, setShowEmoji] = useState(false)
  const [showTags, setShowTags] = useState(false)

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(task.color
      ? ({
          '--task-tag-color': task.color,
          '--task-border-color': task.color,
        } as CSSProperties)
      : {}),
  }

  return (
    <flocus-listitem
      ref={setNodeRef}
      style={style}
      className={`list__item is-idle js-item task flocus-is-plus${isDragging ? ' is-draggable' : ''}`}
    >
      <button type="button" className="tag-picker" onClick={() => setShowTags((v) => !v)} aria-label="Color tag" />
      <div className={`tag-wrapper${showTags ? ' shown' : ''}`}>
        <button
          type="button"
          className="tag-clear"
          aria-label="Clear color tag"
          onClick={() => onUpdate(task.id, { color: undefined })}
        >
          <TaskClearIcon />
        </button>
        {Object.entries(TAG_COLORS).map(([name, hex]) => (
          <span
            key={name}
            className={name}
            style={{ backgroundColor: hex }}
            data-color={name}
            role="button"
            tabIndex={0}
            onClick={() => {
              onUpdate(task.id, { color: hex })
              setShowTags(false)
            }}
          />
        ))}
      </div>

      <div className="drag-handle js-drag-handle" {...attributes} {...listeners} aria-label="Reorder task" />

      <input
        type="checkbox"
        className="form-check-input"
        checked={false}
        onChange={() => onComplete(task.id)}
        aria-label="Complete task"
      />

      <div className="emoji-button" role="button" tabIndex={0} onClick={() => setShowEmoji((v) => !v)} aria-label="Pick emoji">
        <span className="emoji">{task.emoji || '📎'}</span>
        {task.emoji && (
          <span
            className="emoji-clear"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onUpdate(task.id, { emoji: undefined })
            }}
          >
            <TaskClearIcon />
          </span>
        )}
        {showEmoji && (
          <div className="emoji-tooltip shown tasks-emoji-picker">
            {EMOJI_PICKS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation()
                  onUpdate(task.id, { emoji: e })
                  setShowEmoji(false)
                }}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        type="text"
        value={task.text}
        autoComplete="off"
        placeholder="Type your priority"
        maxLength={120}
        onChange={(e) => onUpdate(task.id, { text: e.target.value })}
      />

      <button type="button" className="task-clear" onClick={() => onRemove(task.id)} aria-label="Remove task">
        <TaskClearIcon />
      </button>
    </flocus-listitem>
  )
}

export function TaskPanel() {
  const tasks = useFlocusStore((s) => s.tasks)
  const settings = useFlocusStore((s) => s.settings)
  const addTask = useFlocusStore((s) => s.addTask)
  const updateTask = useFlocusStore((s) => s.updateTask)
  const completeTask = useFlocusStore((s) => s.completeTask)
  const removeTask = useFlocusStore((s) => s.removeTask)
  const reorderTasks = useFlocusStore((s) => s.reorderTasks)

  const activeRaw = tasks.filter((t) => !t.completed)
  const done = tasks.filter((t) => t.completed)
  const active = activeRaw

  const progressPct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onComplete = (id: string) => {
    const remainingBefore = activeRaw.length
    completeTask(id)
    if (remainingBefore === 1) fireConfetti()
  }

  const onRemove = (id: string) => removeTask(id)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active: dragActive, over } = event
    if (!over || dragActive.id === over.id) return
    const oldIndex = activeRaw.findIndex((t) => t.id === dragActive.id)
    const newIndex = activeRaw.findIndex((t) => t.id === over.id)
    if (oldIndex >= 0 && newIndex >= 0) reorderTasks(oldIndex, newIndex)
  }

  return (
    <div className="tasks-wrapper">
      <div className="tasks-header">
        <div className="tasks-header-icon">
          <IconTasks size={16} />
        </div>
        <div className="tasks-header-text">
          <h3 className="font-bold text-white text-sm">Tasks</h3>
          <div>
            {activeRaw.length > 0 ? (
              <p className="eta-info">
                <span className="task-total-time">{activeRaw.length}</span> remaining · You&apos;ve got this!
              </p>
            ) : (
              <div className="eta-success">
                <strong>You&apos;re all done!</strong> Great work 🙌
              </div>
            )}
          </div>
        </div>
      </div>

      {settings.showTasksProgressBar && tasks.length > 0 && (
        <div className="tasks-progress">
          <div className="progress-info">
            <div className="progress-value">{progressPct}% done</div>
          </div>
          <div className="progress-wrapper">
            <div
              className="progress"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="progress-bar" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={active.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="tasks-list">
            <flocus-listgroup className="list js-list">
              {active.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  onComplete={onComplete}
                  onRemove={onRemove}
                  onUpdate={updateTask}
                />
              ))}
            </flocus-listgroup>
          </div>
        </SortableContext>
      </DndContext>

      <div className="tasks-add">
        <button type="button" className="btn add-task" onClick={() => addTask('')}>
          + Add Task
        </button>
      </div>
    </div>
  )
}
