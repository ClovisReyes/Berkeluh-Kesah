import { useEffect, useState } from "react"
import { useInView } from "react-intersection-observer"
import { MessageSquarePlus, Search } from "lucide-react"
import { Header } from "./components/Header"
import { ConfessionCard } from "./components/ConfessionCard"
import { AddConfessionModal } from "./components/AddConfessionModal"
import { CardSkeleton } from "./components/CardSkeleton"
import type { KeluhPost, Comment } from "./types"
import { supabase } from "./lib/supabase"

export default function App() {
  const [posts, setPosts] = useState<KeluhPost[]>([])
  const [isNewPostOpen, setIsNewPostOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest")

  const { ref, inView } = useInView()

  // Load admin state on mount
  useEffect(() => {
    setIsAdmin(localStorage.getItem("isAdmin") === "true")
  }, [])

  // Supabase Real-time updates subscription
  useEffect(() => {
    const channel = supabase
      .channel("realtime-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newPost = payload.new as KeluhPost
            newPost.comments = [] // initial empty comments array
            setPosts((prev) => {
              if (prev.some((p) => p.id === newPost.id)) return prev
              return [newPost, ...prev]
            })
          } else if (payload.eventType === "UPDATE") {
            const updatedPost = payload.new as KeluhPost
            setPosts((prev) =>
              prev.map((post) =>
                post.id === updatedPost.id
                  ? { ...post, ...updatedPost } // merge details but keep existing comments!
                  : post
              )
            )
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id
            setPosts((prev) => prev.filter((post) => post.id !== deletedId))
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newComment = payload.new as Comment
            setPosts((prev) =>
              prev.map((post) => {
                if (post.id === newComment.postId) {
                  const existingComments = post.comments || []
                  if (existingComments.some((c) => c.id === newComment.id)) return post
                  const updatedComments = [newComment, ...existingComments].sort(
                    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  )
                  return { ...post, comments: updatedComments }
                }
                return post
              })
            )
          } else if (payload.eventType === "DELETE") {
            const deletedCommentId = payload.old.id
            setPosts((prev) =>
              prev.map((post) => {
                if (post.comments) {
                  return {
                    ...post,
                    comments: post.comments.filter((c) => c.id !== deletedCommentId),
                  }
                }
                return post
              })
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadPosts = async (reset = false) => {
    const currentPage = reset ? 0 : page
    const startRange = currentPage * 12
    const endRange = startRange + 11

    setLoading(true)
    try {
      let query = supabase
        .from("posts")
        .select("*, comments(*)")

      if (sortBy === "popular") {
        query = query
          .order("isPinned", { ascending: false })
          .order("reactionCount", { ascending: false })
          .order("timestamp", { ascending: false })
      } else {
        query = query
          .order("isPinned", { ascending: false })
          .order("timestamp", { ascending: false })
      }

      const { data, error } = await query.range(startRange, endRange)

      if (error) throw error

      const fetchedPosts = (data as KeluhPost[]) || []

      // Urutkan komentar di dalam setiap post secara descending berdasarkan timestamp
      fetchedPosts.forEach((post) => {
        if (post.comments) {
          post.comments.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        }
      })

      if (reset) {
        setPosts(fetchedPosts)
        setPage(1)
        setHasMore(fetchedPosts.length === 12)
      } else {
        setPosts((prev) => {
          // Hindari post duplikat
          const existingIds = new Set(prev.map((p) => p.id))
          const uniqueNewPosts = fetchedPosts.filter((p) => !existingIds.has(p.id))
          return [...prev, ...uniqueNewPosts]
        })
        setPage((prev) => prev + 1)
        setHasMore(fetchedPosts.length === 12)
      }
    } catch (error) {
      console.error("Error loading posts:", error)
    } finally {
      setLoading(false)
    }
  }

  // Reload posts when sortBy changes (also handles initial load)
  useEffect(() => {
    loadPosts(true)
  }, [sortBy])

  // Infinite Scroll Trigger
  useEffect(() => {
    if (inView && !loading && hasMore) {
      loadPosts(false)
    }
  }, [inView, loading, hasMore])

  // Filter posts client-side for search query
  const filteredPosts = posts.filter((post) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    return (
      post.message.toLowerCase().includes(query) ||
      post.to.toLowerCase().includes(query) ||
      post.from.toLowerCase().includes(query)
    )
  })
  return (
    <main className="relative min-h-screen bg-bg grid-bg text-black dark:text-white transition-colors duration-200">
      <Header 
        isAdmin={isAdmin} 
        setIsAdmin={setIsAdmin} 
      />
      
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-7xl">
        <div className="flex flex-col items-center mb-12 mt-6">
          <div className="text-center mb-6">
            <h1 className="text-4xl sm:text-6xl font-black mb-4 tracking-tight select-none inline-block bg-main dark:bg-white text-black px-6 py-3 border-4 border-black rounded-[5px] shadow-[6px_6px_0px_0px_#000000]">
              Berkeluh Kesah
            </h1>
            <p className="text-xs sm:text-sm text-black dark:text-zinc-300 font-black mt-4 max-w-md mx-auto leading-relaxed uppercase tracking-widest">
              Lelah Jadi WNI? Tuangkan Keluh Kesahmu di Sini.
            </p>
          </div>
          
          <button
            onClick={() => setIsNewPostOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 text-sm font-black bg-main dark:bg-white border-2 border-black text-black rounded-[5px] shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-150 cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4 text-black" />
            <span>Tambah Keluhan</span>
          </button>
        </div>

        {/* Search & Sort Section */}
        <div className="w-full max-w-2xl mx-auto mb-12 flex gap-4 items-center">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Cari keluhan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3.5 pl-11 text-xs sm:text-sm border-2 border-black rounded-[5px] bg-white dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:bg-main/5 transition-all font-bold placeholder-zinc-500 shadow-[3px_3px_0px_0px_#000000]"
            />
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-black dark:text-zinc-400 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="shrink-0 relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "latest" | "popular")}
              className="p-3.5 pr-8 text-xs sm:text-sm border-2 border-black rounded-[5px] bg-white dark:bg-zinc-950 text-black dark:text-white font-bold focus:outline-none focus:bg-main/5 transition-all cursor-pointer shadow-[3px_3px_0px_0px_#000000]"
            >
              <option value="latest">Terbaru</option>
              <option value="popular">Terpopuler</option>
            </select>
          </div>
        </div>

        {/* Post Grid Loader / Content */}
        {loading && posts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <CardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <ConfessionCard
                key={`post-${post.id}`}
                post={post}
                onUpdate={() => loadPosts(true)}
                isAdmin={isAdmin}
              />
            ))}

            {hasMore && (
              <div ref={ref} className="col-span-full flex justify-center py-6">
                <div className="loader" />
              </div>
            )}
          </div>
        ) : (
          <div className="col-span-full text-center py-12 bg-white dark:bg-zinc-900 border-4 border-black rounded-[5px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-md mx-auto">
            <p className="text-lg font-black text-black dark:text-white">
              {posts.length === 0 ? "Belum ada keluhan yang dibagikan" : "Tidak ada keluhan yang cocok"}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 font-bold">
              {posts.length === 0
                ? "Jadilah yang pertama untuk membagikan keluhanmu!"
                : "Coba kata kunci lain atau bersihkan pencarian."}
            </p>
          </div>
        )}

        <AddConfessionModal
          open={isNewPostOpen}
          onOpenChange={setIsNewPostOpen}
          onPostCreated={() => loadPosts(true)}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  )
}
