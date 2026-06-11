import { useState, useEffect } from 'react'
import { Github, Sun, Moon, Unlock, Lock } from 'lucide-react'

interface HeaderProps {
  isAdmin: boolean
  setIsAdmin: (value: boolean) => void
}

export function Header({ isAdmin, setIsAdmin }: HeaderProps) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [passcode, setPasscode] = useState("")
  const [loginError, setLoginError] = useState("")

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  // Secret admin login trigger via URL query: ?admin=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') === 'true' && !isAdmin) {
      setIsLoginOpen(true)
      // Clean query parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [isAdmin])

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const correctPasscode = import.meta.env.VITE_ADMIN_PASSCODE || "admin123"
    if (passcode === correctPasscode) {
      setIsAdmin(true)
      localStorage.setItem("isAdmin", "true")
      setIsLoginOpen(false)
      setPasscode("")
      setLoginError("")
    } else {
      setLoginError("Passcode salah!")
    }
  }

  const handleLogout = () => {
    setIsAdmin(false)
    localStorage.removeItem("isAdmin")
  }

  return (
    <nav className="fixed top-0 right-0 w-full z-50 border-b-4 border-black dark:border-white bg-white dark:bg-zinc-900 text-black dark:text-white transition-all duration-200">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="font-black text-xl tracking-tight select-none text-black dark:text-white flex items-center gap-2">
          <span>Berkeluh Kesah</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAboutOpen(true)}
            className="px-4 py-2 text-xs font-bold bg-white dark:bg-zinc-950 border-2 border-black text-black dark:text-white rounded-[5px] transition-all duration-150 cursor-pointer shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            Tentang
          </button>
          
          <a
            href="https://github.com/ClovisReyes/Berkeluh-Kesah"
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 flex items-center justify-center bg-white dark:bg-zinc-950 border-2 border-black rounded-[5px] transition-all duration-150 cursor-pointer shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            <Github className="w-4 h-4 text-black dark:text-white" />
          </a>

          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center bg-white dark:bg-zinc-950 border-2 border-black rounded-[5px] transition-all duration-150 cursor-pointer shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-black" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>

          {/* Admin Logout Button */}
          {isAdmin && (
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center border-2 border-black rounded-[5px] bg-amber-400 hover:bg-amber-500 text-black transition-all duration-150 cursor-pointer shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              title="Keluar Mode Admin"
            >
              <Unlock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* About Dialog Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-zinc-900 text-black dark:text-white border-4 border-black p-6 rounded-[5px] max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black mb-3 border-b-2 border-black pb-2">Tentang Berkeluh Kesah</h3>
            <p className="text-sm text-gray-700 dark:text-zinc-300 mb-6 leading-relaxed font-medium">
              Berkeluh Kesah adalah tempat bagi siapa saja untuk mencurahkan isi hati dan berbagi pengalaman secara anonim. Platform ini dibuat dengan tujuan untuk mengurangi angka stress di Indonesia.
            </p>

            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6 font-bold">
              Dibuat oleh <a href="https://github.com/ClovisReyes" target="_blank" rel="noopener noreferrer" className="text-black dark:text-white font-black underline hover:text-amber-500">Ahmad Muhni</a>
            </p>

            <button
              onClick={() => setIsAboutOpen(false)}
              className="w-full py-2.5 font-bold bg-main border-2 border-black text-black rounded-[5px] transition-all duration-150 cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleLogin}
            className="bg-white dark:bg-zinc-900 text-black dark:text-white border-4 border-black p-6 rounded-[5px] max-w-sm w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-in fade-in zoom-in-95 duration-200"
          >
            <h3 className="text-xl font-black mb-3 flex items-center gap-2 border-b-2 border-black pb-2">
              <Lock className="w-5 h-5 text-black dark:text-white" />
              <span>Login Administrator</span>
            </h3>
            
            <p className="text-xs text-gray-600 dark:text-zinc-400 mb-4 leading-relaxed font-bold">
              Masukkan passcode rahasia untuk masuk ke mode admin dan mengaktifkan fitur moderasi.
            </p>

            <div className="mb-6">
              <input
                type="password"
                placeholder="Passcode..."
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value)
                  if (loginError) setLoginError("")
                }}
                required
                className="w-full p-3 text-sm border-2 border-black rounded-[5px] bg-white dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:bg-main/10 transition-all font-bold placeholder-zinc-500"
              />
              {loginError && (
                <p className="text-xs text-red-600 font-bold mt-1.5">{loginError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsLoginOpen(false)
                  setPasscode("")
                  setLoginError("")
                }}
                className="flex-1 py-2.5 text-sm font-bold bg-white dark:bg-zinc-950 border-2 border-black text-black dark:text-white rounded-[5px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-sm font-bold bg-main border-2 border-black text-black rounded-[5px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
              >
                Masuk
              </button>
            </div>
          </form>
        </div>
      )}
    </nav>
  )
}
