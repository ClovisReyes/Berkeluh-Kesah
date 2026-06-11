import { useEffect, useRef, useState } from "react"
import { filterBadWords } from "../lib/sensor"
import { supabase } from "../lib/supabase"
import { generatePseudonym } from "../lib/pseudonym"

interface AddConfessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPostCreated: () => void
  isAdmin: boolean
}

export function AddConfessionModal({ open, onOpenChange, onPostCreated, isAdmin }: AddConfessionModalProps) {
  const toRef = useRef<HTMLInputElement>(null)

  const [messageText, setMessageText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [toastMsg, setToastMsg] = useState("")
  const [isAdminPost, setIsAdminPost] = useState(false)

  useEffect(() => {
    if (open) {
      setIsAdminPost(isAdmin)
    }
  }, [open, isAdmin])

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cooldown > 0) return

    const resolvedFrom = generatePseudonym()
    const toVal = toRef.current?.value.trim() || ""
    const messageVal = messageText.trim()

    if (!toVal || !messageVal) return

    setIsSubmitting(true)

    try {
      const filteredTo = filterBadWords(toVal)
      const filteredMessage = filterBadWords(messageVal)

      // Cek duplikasi spam keluhan sederhana di database
      const { data: duplicateCheck, error: checkError } = await supabase
        .from("posts")
        .select("id")
        .eq("message", filteredMessage)
        .eq("from", resolvedFrom)
        .limit(1)

      if (checkError) throw checkError

      if (duplicateCheck && duplicateCheck.length > 0) {
        throw new Error("Dilarang spam ya")
      }

      const { error } = await supabase
        .from("posts")
        .insert([
          {
            from: resolvedFrom,
            to: filteredTo,
            message: filteredMessage,
            isAdminPost: isAdminPost,
          },
        ])

      if (error) throw error

      // Reset Form
      if (toRef.current) toRef.current.value = ""
      setMessageText("")

      onOpenChange(false)
      onPostCreated()
      setCooldown(5)
      showToast("Keluhanmu telah berhasil ditambahkan")
    } catch (error: any) {
      showToast(error?.message || "Terjadi masalah, coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[100] bg-white dark:bg-zinc-800 text-black dark:text-white border-2 border-black px-4 py-2.5 rounded-[5px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-bottom-5 duration-300 text-xs font-bold">
          {toastMsg}
        </div>
      )}

      {/* Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="bg-white dark:bg-zinc-900 text-black dark:text-white border-4 border-black p-6 rounded-[5px] max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-in fade-in zoom-in-95 duration-200">
          
          <div className="flex justify-between items-center mb-5 pb-3 border-b-2 border-black">
            <h3 className="text-xl font-black">Mulai Mengeluh</h3>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 flex items-center justify-center font-black text-sm border-2 border-black rounded-[5px] bg-white dark:bg-zinc-950 text-black dark:text-white hover:bg-red-400 hover:text-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_#000000]"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-xs font-black mb-1.5 text-black dark:text-zinc-300 uppercase tracking-wider">Untuk</label>
              <input
                type="text"
                placeholder="Siapa yang dituju?"
                ref={toRef}
                required
                maxLength={30}
                className="w-full p-2.5 text-sm border-2 border-black rounded-[5px] bg-white dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:bg-[#FFD93D]/10 dark:focus:bg-white/10 transition-all font-bold placeholder-zinc-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-black text-black dark:text-zinc-300 uppercase tracking-wider">Keluhanmu</label>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-[3px] border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000000] ${
                  messageText.length >= 900 
                    ? "text-black bg-red-400" 
                    : "text-black bg-[#FFD93D] dark:bg-white"
                }`}>
                  {messageText.length} / 1000
                </span>
              </div>
              <textarea
                placeholder="Tuliskan keresahan hatimu di sini..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                required
                rows={4}
                maxLength={1000}
                className="w-full p-2.5 text-sm border-2 border-black rounded-[5px] bg-white dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:bg-[#FFD93D]/10 dark:focus:bg-white/10 transition-all font-bold placeholder-zinc-500 resize-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            {isAdmin && (
              <div className="flex items-center gap-3 bg-[#FFD93D]/10 dark:bg-white/10 p-3.5 rounded-[5px] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <input
                  type="checkbox"
                  id="admin-post"
                  checked={isAdminPost}
                  onChange={(e) => setIsAdminPost(e.target.checked)}
                  className="w-4 h-4 accent-black dark:accent-white border-2 border-black cursor-pointer"
                />
                <label htmlFor="admin-post" className="text-xs font-extrabold select-none cursor-pointer text-black dark:text-zinc-200">
                  Kirim sebagai Administrator (Badge Terverifikasi)
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || cooldown > 0}
              className="w-full py-3.5 mt-4 font-black bg-[#FFD93D] dark:bg-white border-2 border-black text-black rounded-[5px] shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-150 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex justify-center items-center gap-2">
                  <div className="loader" />
                  <span>Mengirim...</span>
                </div>
              ) : cooldown > 0 ? (
                `Tunggu ${cooldown} detik...`
              ) : (
                "Tambah Keluhan"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
