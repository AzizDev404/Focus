/** Notepad toolbar.
 *  Quill 2 replaces button innerHTML with its SVG icons via buildButtons,
 *  so we keep buttons empty and rely on Quill's icon set. */
export function NotepadToolbar() {
  return (
    <div className="notepad-toolbar">
      <div role="toolbar" className="ql-toolbar ql-snow" id="notepad-toolbar" aria-label="Formatting">
        <span className="ql-formats">
          <button type="button" className="ql-bold" aria-label="Bold" />
          <button type="button" className="ql-italic" aria-label="Italic" />
          <button type="button" className="ql-underline" aria-label="Underline" />
          <button type="button" className="ql-strike" aria-label="Strikethrough" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-header" value="1" aria-label="Heading 1" />
          <button type="button" className="ql-header" value="2" aria-label="Heading 2" />
          <button type="button" className="ql-blockquote" aria-label="Quote" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-list" value="ordered" aria-label="Numbered list" />
          <button type="button" className="ql-list" value="bullet" aria-label="Bullet list" />
          <button type="button" className="ql-list" value="check" aria-label="Checklist" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-indent" value="-1" aria-label="Decrease indent" />
          <button type="button" className="ql-indent" value="+1" aria-label="Increase indent" />
        </span>
        <span className="ql-formats">
          <button type="button" className="ql-clean" aria-label="Clear formatting" />
        </span>
      </div>
    </div>
  )
}
