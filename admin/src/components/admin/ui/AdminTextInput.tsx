type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> & {
  className?: string
}

export function AdminTextInput({ className = '', ...props }: Props) {
  return <input {...props} className={`adm-input${className ? ` ${className}` : ''}`} />
}
