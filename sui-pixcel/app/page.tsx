import PixelCanvas from "@/components/pixel-canvas"
import Header from "@/components/header"
import CommentSection from "@/components/comment-section"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3 text-balance">Sui Pixcel</h1>
            <p className="text-base md:text-lg text-muted-foreground text-balance px-4">
              Create stunning pixel art, convert images, and share with the community
            </p>
          </div>
          <PixelCanvas />
          <CommentSection />
        </div>
      </main>
    </div>
  )
}
