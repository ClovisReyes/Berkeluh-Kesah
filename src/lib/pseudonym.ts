const adjectives = [
  "Gelisah",
  "Overthinker",
  "Sambat",
  "Melamun",
  "Galau",
  "Santuy",
  "Ceria",
  "Mager",
  "Gokil",
  "Bingung",
  "Gundah",
  "Sendu",
  "Kepo",
  "Woles"
]

const animals = [
  "Panda",
  "Bebek",
  "Kucing",
  "Koala",
  "Capung",
  "Tupai",
  "Pinguin",
  "Hamster",
  "Kelinci",
  "Lumba-lumba",
  "Kangguru",
  "Harimau",
  "Singa"
]

function getFingerprint(): string {
  if (typeof window === "undefined") return "server"
  
  let canvasData = ""
  try {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.textBaseline = "top"
      ctx.font = "14px 'Arial'"
      ctx.fillStyle = "#f60"
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = "#069"
      ctx.fillText("Berkeluh Kesah, Anon!", 2, 15)
      canvasData = canvas.toDataURL()
    }
  } catch (e) {
    // Ignore canvas errors
  }

  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    canvasData
  ]
  
  return parts.join("||")
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash)
}

export function generatePseudonym(): string {
  // 1. Fast cache check (localStorage)
  if (typeof window !== "undefined" && window.localStorage) {
    const saved = localStorage.getItem("userPseudonym")
    if (saved) return saved
  }

  // 2. Fallback to Device Fingerprinting (preserves same pseudonym when cache is cleared)
  const fp = getFingerprint()
  const seed = hashCode(fp)

  const adjIndex = seed % adjectives.length
  const animIndex = Math.floor(seed / adjectives.length) % animals.length

  const adj = adjectives[adjIndex]
  const anim = animals[animIndex]
  const newPseudonym = `${anim} ${adj}`

  // Cache in localStorage for subsequent fast lookups
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem("userPseudonym", newPseudonym)
  }

  return newPseudonym
}
