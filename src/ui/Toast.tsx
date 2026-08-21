import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

/** 결과 한 줄 알림. 모달을 연달아 띄우지 않기 위해 쓴다. */
const Ctx = createContext<(msg: string) => void>(() => {})

export const useToast = () => useContext(Ctx)

export function ToastHost({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)

  const show = useCallback((m: string) => {
    setMsg(m)
    window.setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 2200)
  }, [])

  return (
    <Ctx.Provider value={show}>
      {children}
      {msg && <div className="toast" onClick={() => setMsg(null)}>{msg}</div>}
    </Ctx.Provider>
  )
}
