import { useEffect, useRef, useState } from "react"
import { Calendar, MessageCircle, Pin, Trash2 } from "lucide-react"
import type { KeluhPost } from "../types"
import { filterBadWords } from "../lib/sensor"
import { supabase } from "../lib/supabase"
import { generatePseudonym } from "../lib/pseudonym"

interface KeluhCardProps {
  post: KeluhPost
  onUpdate: () => void
  isAdmin: boolean
}



export function ConfessionCard({ post, onUpdate, isAdmin }: KeluhCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isCommentLoading, setIsCommentLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [activeReaction, setActiveReaction] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState("")
  const [myComments, setMyComments] = useState<string[]>([])
  
  // Custom modal confirmation states
  const [isDeletePostOpen, setIsDeletePostOpen] = useState(false)
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<{ id: string; from: string; text: string } | null>(null)

  // Admin action triggers
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
  const touchStartRef = useRef<number>(0)
  const longPressTimer = useRef<any>(null)
  const isTouchRef = useRef<boolean>(false)

  const handleTouchStart = () => {
    isTouchRef.current = true
    touchStartRef.current = Date.now()
    
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    longPressTimer.current = setTimeout(() => {
      if (isAdmin && isTouchRef.current) {
        setIsAdminMenuOpen(true)
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      }
    }, 600)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
    
    const duration = Date.now() - touchStartRef.current
    if (duration < 600) {
      setIsOpen(true)
    }
    setTimeout(() => {
      isTouchRef.current = false
    }, 100)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isTouchRef.current) {
      return
    }
    setIsOpen(true)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isAdmin) {
      e.preventDefault()
      e.stopPropagation()
      setIsAdminMenuOpen(true)
    }
  }

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("myComments") || "[]")
    setMyComments(saved)
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    }
  }, [])

  const commentRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const postReactions = JSON.parse(localStorage.getItem("postReactions") || "{}")
    setActiveReaction(postReactions[post.id] || null)
  }, [post.id])

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

  const handleReact = async (reactionType: 'love' | 'sad' | 'angry' | 'laugh', e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      const postReactions = JSON.parse(localStorage.getItem("postReactions") || "{}")
      const oldReaction = postReactions[post.id] || null

      const updates: any = {}

      if (oldReaction === reactionType) {
        // Klik reaksi yang sama => unlike / hapus reaksi
        const oldField = `${oldReaction}Count`
        updates[oldField] = Math.max(0, (post[oldField as keyof KeluhPost] as number || 0) - 1)
        delete postReactions[post.id]
        setActiveReaction(null)
      } else {
        // Kurangi reaksi lama jika ada
        if (oldReaction) {
          const oldField = `${oldReaction}Count`
          updates[oldField] = Math.max(0, (post[oldField as keyof KeluhPost] as number || 0) - 1)
        }
        // Tambah reaksi baru
        const newField = `${reactionType}Count`
        updates[newField] = ((post[newField as keyof KeluhPost] as number) || 0) + 1
        
        postReactions[post.id] = reactionType
        setActiveReaction(reactionType)
      }

      // Calculate total reactions
      const currentTotal = (post.loveCount || 0) + (post.sadCount || 0) + (post.angryCount || 0) + (post.laughCount || 0)
      let change = 0
      if (oldReaction === reactionType) {
        change = -1
      } else {
        change = oldReaction ? 0 : 1
      }
      updates.reactionCount = Math.max(0, currentTotal + change)

      const { error } = await supabase
        .from("posts")
        .update(updates)
        .eq("id", post.id)

      if (error) throw error

      localStorage.setItem("postReactions", JSON.stringify(postReactions))
      onUpdate()
    } catch (error: any) {
      showToast(error?.message || "Terjadi masalah saat memberikan reaksi.")
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cooldown > 0) return

    const commentText = commentRef.current?.value.trim()

    if (!commentText) return

    setIsCommentLoading(true)
    try {
      const filteredComment = filterBadWords(commentText)
      const resolvedCommentFrom = generatePseudonym()

      let finalCommentText = filteredComment
      if (replyingTo) {
        finalCommentText = `[reply:${replyingTo.id}:${replyingTo.from}]${filteredComment}`
      }

      // Cek duplikasi spam komentar sederhana di client
      const existingSpam = post.comments?.find(
        (c) => c.text === finalCommentText && c.from === resolvedCommentFrom
      )

      if (existingSpam) {
        throw new Error("Sekali aja ya, jangan spam.")
      }

      const { data, error } = await supabase
        .from("comments")
        .insert([
          {
            postId: post.id,
            text: finalCommentText,
            from: resolvedCommentFrom,
          },
        ])
        .select()
        .single()

      if (error) throw error

      if (data) {
        const saved = JSON.parse(localStorage.getItem("myComments") || "[]")
        const newComments = [...saved, data.id]
        localStorage.setItem("myComments", JSON.stringify(newComments))
        setMyComments(newComments)
      }

      if (commentRef.current) commentRef.current.value = ""
      setReplyingTo(null)

      onUpdate()
      showToast("Komentar berhasil ditambahkan")
      setCooldown(5)
    } catch (error: any) {
      showToast(error?.message || "Terjadi masalah, coba lagi.")
    } finally {
      setIsCommentLoading(false)
    }
  }

  const handlePinToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { error } = await supabase
        .from("posts")
        .update({ isPinned: !post.isPinned })
        .eq("id", post.id)

      if (error) throw error
      onUpdate()
      showToast(post.isPinned ? "Sematkan dilepas" : "Keluhan berhasil disematkan")
    } catch (error: any) {
      showToast(error?.message || "Gagal menyematkan keluhan.")
    }
  }

  const handleDeletePostClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeletePostOpen(true)
  }

  const executeDeletePost = async () => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id)

      if (error) throw error
      setIsDeletePostOpen(false)
      setIsOpen(false)
      onUpdate()
      showToast("Keluhan berhasil dihapus")
    } catch (error: any) {
      showToast(error?.message || "Gagal menghapus keluhan.")
    }
  }

  const handleDeleteCommentClick = (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteCommentId(commentId)
  }

  const executeDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)

      if (error) throw error
      setDeleteCommentId(null)
      onUpdate()
      showToast("Komentar berhasil dihapus")
    } catch (error: any) {
      showToast(error?.message || "Gagal menghapus komentar.")
    }
  }

  const date = new Date(post.timestamp)
  const formattedDateTime = date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const reactionsList = [
    { type: "love", icon: "❤️", label: "Love", count: post.loveCount || 0 },
    { type: "sad", icon: "😢", label: "Sad", count: post.sadCount || 0 },
    { type: "angry", icon: "😡", label: "Angry", count: post.angryCount || 0 },
    { type: "laugh", icon: "😂", label: "Ngakak", count: post.laughCount || 0 },
  ]



  return (
    <>
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[100] bg-white dark:bg-zinc-800 text-black dark:text-white border-2 border-black px-4 py-2.5 rounded-[5px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-bottom-5 duration-300 text-xs font-bold">
          {toastMsg}
        </div>
      )}

      {/* Card Element */}
      <div
        className={`p-6 border-2 border-black rounded-[5px] cursor-pointer flex flex-col justify-between relative group overflow-hidden neobrutalism-card ${
          post.isPinned ? "border-4" : ""
        } bg-main dark:bg-white text-black`}
        style={{
          '--card-accent': '#FFD93D'
        } as React.CSSProperties}
        onClick={handleCardClick}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {post.isAdminPost && (
          <div className="absolute top-0 right-0 w-24 h-24 bg-black/5 blur-2xl rounded-full -mr-5 -mt-5" />
        )}
        
        <div>
          <div className="flex flex-col gap-2 mb-4">
            {/* Row 1: Sender & Date */}
            <div className="flex justify-between items-center text-[10px] text-black/75 font-extrabold tracking-wider">
              <p className="uppercase truncate max-w-[50%]">Dari: {post.from}</p>
              <div className="flex items-center gap-1 shrink-0 font-bold">
                {post.isPinned && <Pin className="w-3.5 h-3.5 text-black shrink-0 fill-current animate-bounce" />}
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDateTime}</span>
              </div>
            </div>

            {/* Row 2: Recipient Badge */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 text-[10px] font-black bg-black text-white border border-black rounded-[3px] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] max-w-full truncate">
                Untuk: {post.to}
              </span>
              {post.isAdminPost && (
                <span className="px-2 py-0.5 text-[9px] font-extrabold bg-[#FFD93D] dark:bg-white text-black border border-black rounded-[3px] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] uppercase select-none tracking-wider shrink-0">
                  ★ Admin
                </span>
              )}
            </div>
          </div>

          <div className="h-14 overflow-hidden mb-4">
            <p className="text-sm line-clamp-2 leading-relaxed text-black font-bold">{post.message}</p>
          </div>
        </div>

        <div className="pt-4 border-t-2 border-black/10 space-y-3">
          {/* Reaction Console Grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {reactionsList.map((react) => {
              const isSelected = activeReaction === react.type
              return (
                <button
                  key={react.type}
                  className={`flex items-center justify-center gap-1 px-1 py-1.5 text-[10px] font-bold border-2 border-black rounded-[5px] transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer shadow-[2px_2px_0px_0px_#000000] ${
                    isSelected 
                      ? "bg-[#FFD93D] dark:bg-white text-black" 
                      : "bg-white dark:bg-zinc-950 text-black dark:text-white"
                  }`}
                  onClick={(e) => handleReact(react.type as any, e)}
                  title={react.label}
                >
                  <span className="text-xs">{react.icon}</span>
                  <span className="font-extrabold">{react.count}</span>
                </button>
              )
            })}
          </div>

          {/* Action Row */}
          <div className="w-full">
            <button
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] font-black bg-white dark:bg-zinc-950 border-2 border-black text-black dark:text-white rounded-[5px] hover:bg-[#FFD93D] dark:hover:bg-white hover:text-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(true)
                setShowComments(true)
              }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="font-extrabold">Komentar ({post.comments?.length || 0})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Actions Modal (Desktop Click / Mobile Long Press) */}
      {isAdminMenuOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={(e) => {
            e.stopPropagation()
            setIsAdminMenuOpen(false)
          }}
        >
          <div 
            className="bg-white dark:bg-zinc-900 text-black dark:text-white border-4 border-black p-6 rounded-[5px] max-w-xs w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black mb-4 border-b-2 border-black pb-2 text-center">Menu Admin</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsAdminMenuOpen(false)
                  setIsOpen(true)
                }}
                className="w-full py-2.5 font-black bg-white dark:bg-zinc-950 border-2 border-black text-black dark:text-white rounded-[5px] hover:bg-main transition-all duration-150 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none text-center block"
              >
                Buka Detail
              </button>
              <button
                onClick={async (e) => {
                  setIsAdminMenuOpen(false)
                  await handlePinToggle(e)
                }}
                className="w-full py-2.5 font-black bg-white dark:bg-zinc-950 border-2 border-black text-black dark:text-white rounded-[5px] hover:bg-main transition-all duration-150 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none text-center block"
              >
                {post.isPinned ? "Unpin" : "Pin"}
              </button>
              <button
                onClick={(e) => {
                  setIsAdminMenuOpen(false)
                  handleDeletePostClick(e)
                }}
                className="w-full py-2.5 font-black bg-red-400 border-2 border-black text-black rounded-[5px] hover:bg-red-500 transition-all duration-150 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none text-center block"
              >
                Hapus Postingan
              </button>
              <button
                onClick={() => setIsAdminMenuOpen(false)}
                className="w-full py-2.5 font-black bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-2 border-black rounded-[5px] cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all duration-150"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Dialog Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-zinc-900 text-black dark:text-white border-4 border-black p-6 rounded-[5px] max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center mb-5 border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-black bg-black text-white dark:bg-white dark:text-black border border-black rounded-[3px]">
                  Untuk: {post.to}
                </span>
                {post.isAdminPost && (
                  <span className="px-2 py-0.5 text-[9px] font-extrabold bg-[#FFD93D] dark:bg-white text-black border border-black rounded-[3px] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] uppercase select-none tracking-wider">
                    ★ Admin
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center font-black text-sm border-2 border-black rounded-[5px] bg-white dark:bg-zinc-950 text-black dark:text-white hover:bg-red-400 hover:text-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_#000000]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex justify-between items-center text-xs">
                <p className="text-black dark:text-zinc-300 font-bold">Dari: <span className="font-extrabold underline">@{post.from}</span></p>
                <p className="text-black/70 dark:text-zinc-400 flex items-center gap-1.5 font-bold">
                  {post.isPinned && <Pin className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />}
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedDateTime}</span>
                </p>
              </div>

              <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap bg-white dark:bg-zinc-950 p-4 border-2 border-black rounded-[5px] text-black dark:text-white font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                {post.message}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t-2 border-b-2 border-black pb-4 pt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {reactionsList.map((react) => {
                    const isSelected = activeReaction === react.type
                    return (
                      <button
                        key={`modal-${react.type}`}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border-2 border-black rounded-[5px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap ${
                          isSelected 
                            ? "bg-[#FFD93D] dark:bg-white text-black" 
                            : "bg-white dark:bg-zinc-900 border-2 border-black text-black dark:text-white"
                        }`}
                        onClick={(e) => handleReact(react.type as any, e)}
                        title={react.label}
                      >
                        <span className="text-sm">{react.icon}</span>
                        <span className="font-black">{react.count}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-2 justify-end flex-wrap">
                  {isAdmin && (
                    <>
                      <button
                        onClick={handlePinToggle}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold border-2 border-black rounded-[5px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none whitespace-nowrap ${
                          post.isPinned 
                            ? "bg-[#FFD93D] dark:bg-white text-black" 
                            : "bg-white dark:bg-zinc-950 text-black dark:text-white"
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        <span>{post.isPinned ? "Lepas Pin" : "Pin"}</span>
                      </button>
                      <button
                        onClick={handleDeletePostClick}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-red-400 border-2 border-black text-black rounded-[5px] transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </>
                  )}
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-bold bg-white dark:bg-zinc-950 border-2 border-black text-black dark:text-white rounded-[5px] hover:bg-[#FFD93D] dark:hover:bg-white hover:text-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none whitespace-nowrap"
                    onClick={() => setShowComments(!showComments)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments?.length || 0} Komentar</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {showComments && (
                <div className="space-y-4 pt-2">
                  {replyingTo && (
                    <div className="flex justify-between items-center bg-[#FFD93D] dark:bg-white text-black text-xs font-bold px-3 py-2 border-2 border-black rounded-[5px] mb-2 shadow-[2px_2px_0px_0px_#000000] animate-in fade-in slide-in-from-top-1 duration-200">
                      <span className="truncate">
                        Membalas <span className="underline">@{replyingTo.from}</span>: "{replyingTo.text}"
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setReplyingTo(null)} 
                        className="font-black hover:text-red-500 cursor-pointer ml-2"
                        title="Batal membalas"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleComment} className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Tambahkan komentar..."
                      ref={commentRef}
                      maxLength={250}
                      required
                      className="flex-1 p-2.5 text-sm border-2 border-black rounded-[5px] bg-white dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:bg-[#FFD93D]/10 dark:focus:bg-white/10 transition-all font-bold placeholder-zinc-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    />
                    <button
                      type="submit"
                      disabled={isCommentLoading || cooldown > 0}
                      className="px-4 py-2.5 text-sm font-black bg-green-400 hover:bg-green-500 border-2 border-black text-black rounded-[5px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isCommentLoading ? <div className="loader" /> : cooldown > 0 ? `${cooldown}s` : "Kirim"}
                    </button>
                  </form>

                  <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                    {(() => {
                      if (!post.comments || post.comments.length === 0) {
                        return <p className="text-center text-xs text-zinc-500 py-4 font-bold">Belum ada komentar.</p>
                      }

                      // 1. Parsing all comments to check for reply prefix
                      const replyRegex = /^\[reply:([^:]+):([^\]]+)\](.*)$/s
                      const parsedComments = post.comments.map((comment) => {
                        const match = comment.text.match(replyRegex)
                        let displayCommentText = comment.text
                        let replyToCommentId = null
                        let replyToAuthor = null

                        if (match) {
                          replyToCommentId = match[1]
                          replyToAuthor = match[2]
                          displayCommentText = match[3]
                        }

                        return {
                          ...comment,
                          displayCommentText,
                          replyToCommentId,
                          replyToAuthor,
                          replies: [] as any[]
                        }
                      })

                      // Create a map of parsed comments for lookup
                      const parsedMap = new Map<string, typeof parsedComments[0]>()
                      parsedComments.forEach(c => parsedMap.set(c.id, c))

                      // 2. Separate into roots and replies
                      const rootComments: typeof parsedComments = []
                      const replyComments: typeof parsedComments = []

                      parsedComments.forEach((comment) => {
                        if (!comment.replyToCommentId) {
                          rootComments.push(comment)
                        } else {
                          replyComments.push(comment)
                        }
                      })

                      // 3. Associate replies with their root parent
                      replyComments.forEach((reply) => {
                        let parentId = reply.replyToCommentId
                        let currentParent = parentId ? parsedMap.get(parentId) : null

                        // Traverse up to find the root parent
                        while (currentParent && currentParent.replyToCommentId) {
                          const nextParent = parsedMap.get(currentParent.replyToCommentId)
                          if (!nextParent) break
                          currentParent = nextParent
                        }

                        if (currentParent) {
                          currentParent.replies.push(reply)
                        } else {
                          // Parent comment was deleted/not found, treat it as a root comment
                          rootComments.push(reply)
                        }
                      })

                      // Sort replies within each root comment chronologically (oldest first for natural flow)
                      rootComments.forEach((root) => {
                        root.replies.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      })

                      // Sort root comments chronologically descending (latest first)
                      rootComments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

                      return rootComments.map((rootComment) => {
                        const rootDate = new Date(rootComment.timestamp)
                        return (
                          <div key={rootComment.id} className="space-y-2.5">
                            {/* Root Comment Container */}
                            <div className="p-3.5 bg-white dark:bg-zinc-950 border-2 border-black rounded-[5px] flex justify-between items-start text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              <div className="space-y-1 flex-1 mr-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-extrabold text-xs text-black dark:text-zinc-400">@{rootComment.from}</p>
                                  <button
                                    onClick={() => setReplyingTo({ id: rootComment.id, from: rootComment.from, text: rootComment.displayCommentText })}
                                    className="text-[10px] font-black text-zinc-500 hover:text-green-500 dark:hover:text-white underline cursor-pointer"
                                    title="Balas komentar ini"
                                  >
                                    Balas
                                  </button>
                                </div>
                                <p className="text-black dark:text-zinc-200 font-bold leading-relaxed">{rootComment.displayCommentText}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">
                                  {rootDate.toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {(isAdmin || myComments.includes(rootComment.id)) && (
                                  <button
                                    onClick={(e) => handleDeleteCommentClick(rootComment.id, e)}
                                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-0.5 cursor-pointer"
                                    title="Hapus Komentar"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Nested Replies Container */}
                            {rootComment.replies.length > 0 && (
                              <div className="ml-6 pl-4 border-l-2 border-black/20 dark:border-white/20 space-y-2 mt-2">
                                {rootComment.replies.map((reply) => {
                                  const replyDate = new Date(reply.timestamp)
                                  return (
                                    <div
                                      key={reply.id}
                                      className="p-2.5 bg-white dark:bg-zinc-950 border-2 border-black rounded-[5px] flex justify-between items-start text-xs shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                      <div className="space-y-1 flex-1 mr-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <p className="font-extrabold text-[10px] text-black/80 dark:text-zinc-400">@{reply.from}</p>
                                          <button
                                            onClick={() => setReplyingTo({ id: reply.id, from: reply.from, text: reply.displayCommentText })}
                                            className="text-[9px] font-black text-zinc-500 hover:text-green-500 dark:hover:text-white underline cursor-pointer"
                                            title="Balas komentar ini"
                                          >
                                            Balas
                                          </button>
                                        </div>
                                        <p className="text-black dark:text-zinc-200 font-bold leading-relaxed">
                                          {reply.replyToAuthor && (
                                            <span className="text-zinc-500 dark:text-zinc-400 font-extrabold mr-1">@{reply.replyToAuthor}</span>
                                          )}
                                          {reply.displayCommentText}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold">
                                          {replyDate.toLocaleDateString([], {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                        {(isAdmin || myComments.includes(reply.id)) && (
                                          <button
                                            onClick={(e) => handleDeleteCommentClick(reply.id, e)}
                                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-0.5 cursor-pointer"
                                            title="Hapus Komentar"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {(isDeletePostOpen || deleteCommentId !== null) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-zinc-900 text-black dark:text-white border-4 border-black p-6 rounded-[5px] max-w-sm w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black mb-3">Konfirmasi Tindakan</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed font-bold">
              {isDeletePostOpen 
                ? "Apakah Anda yakin ingin menghapus keluhan ini beserta seluruh komentarnya secara permanen?" 
                : "Apakah Anda yakin ingin menghapus komentar ini secara permanen?"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDeletePostOpen(false)
                  setDeleteCommentId(null)
                }}
                className="flex-1 py-2 text-sm font-black bg-white dark:bg-zinc-950 border-2 border-black text-black dark:text-white rounded-[5px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (isDeletePostOpen) {
                    await executeDeletePost()
                  } else if (deleteCommentId !== null) {
                    await executeDeleteComment(deleteCommentId)
                  }
                }}
                className="flex-1 py-2 text-sm font-black bg-red-400 border-2 border-black text-black rounded-[5px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
