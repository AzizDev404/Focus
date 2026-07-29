import { IconNotepad } from './icons/FlocusIcons'
import { NotepadToolbar } from './notepad/NotepadToolbar'
import { useNotepadQuill } from './notepad/useNotepadQuill'
import { useFlocusStore } from '../store/useFlocusStore'

function countWords(html: string) {
  const text = html.replace(/<[^>]+>/g, ' ').trim()
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

function countChars(html: string) {
  return html.replace(/<[^>]+>/g, '').length
}

export function NotepadPanel() {
  const notepad = useFlocusStore((s) => s.notepad)
  const setNotepad = useFlocusStore((s) => s.setNotepad)
  const profile = useFlocusStore((s) => s.profile)

  const words = countWords(notepad)
  const chars = countChars(notepad)

  const { mountRef, clear } = useNotepadQuill({
    active: true,
    content: notepad,
    onChange: setNotepad,
  })

  return (
    <div className="notepad-wrapper">
      <div className="notepad-header">
        <div className="notepad-header-icon">
          <IconNotepad size={16} />
        </div>
        <div className="notepad-header-text">
          <h3 className="font-bold text-white text-sm">Notepad</h3>
          <div className="word-count">
            <span className="word-count-value">{words}</span> words &middot;{' '}
            <span className="character-count-value">{chars}</span> chars
          </div>
        </div>
        <button
          type="button"
          className="notepad-header-icon clear-editor"
          onClick={clear}
          title="Clear notepad"
          aria-label="Clear notepad"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <NotepadToolbar />

      <div className="notepad-editor">
        <div id="editor" className="notepad-quill-root">
          <div ref={mountRef} className="notepad-quill-mount" />
        </div>
      </div>

      <div className="notepad-footer">
        <div>
          {profile ? "Today's notes sync to your account" : 'Sign in to save notes across devices'}
        </div>
      </div>
    </div>
  )
}
