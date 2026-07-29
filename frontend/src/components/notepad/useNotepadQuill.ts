import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

export function useNotepadQuill({
  active,
  content,
  onChange,
}: {
  active: boolean
  content: string
  onChange: (html: string) => void
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!active || !mountRef.current) return

    const mount = mountRef.current
    mount.innerHTML = ''

    const quill = new Quill(mount, {
      theme: 'snow',
      modules: {
        toolbar: { container: '#notepad-toolbar' },
      },
      placeholder: 'Jot down thoughts, ideas, or notes',
    })

    if (content && content !== '<p><br></p>') {
      quill.clipboard.dangerouslyPasteHTML(content, 'silent')
    }

    const handleChange = () => {
      const html = quill.root.innerHTML
      onChangeRef.current(html === '<p><br></p>' ? '' : html)
    }

    quill.on('text-change', handleChange)
    quillRef.current = quill

    return () => {
      quill.off('text-change', handleChange)
      quillRef.current = null
      mount.innerHTML = ''
    }
  }, [active])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill || !active) return
    const empty = !content || content === '<p><br></p>'
    const current = quill.root.innerHTML
    if (empty && quill.getText().trim() === '') return
    if (empty) {
      quill.setText('')
      return
    }
    if (current !== content) {
      quill.clipboard.dangerouslyPasteHTML(content, 'silent')
    }
  }, [content, active])

  const clear = () => {
    const quill = quillRef.current
    if (!quill) return
    quill.setText('')
    onChangeRef.current('')
  }

  return { mountRef, clear }
}
