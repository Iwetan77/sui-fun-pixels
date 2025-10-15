"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Send } from "lucide-react"
import { useWallet } from "./wallet-provider"

interface Comment {
  id: string
  author: string
  content: string
  timestamp: Date
}

export default function CommentSection() {
  const { address, isConnected } = useWallet()
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "0x1234...5678",
      content: "Amazing pixel art! Love the color palette you used here.",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: "2",
      author: "0xabcd...ef01",
      content: "The image converter feature is so useful. Great work!",
      timestamp: new Date(Date.now() - 7200000),
    },
  ])
  const [newComment, setNewComment] = useState("")

  const handleSubmitComment = () => {
    if (!newComment.trim() || !isConnected || !address) return

    const comment: Comment = {
      id: Date.now().toString(),
      author: address,
      content: newComment,
      timestamp: new Date(),
    }

    setComments([comment, ...comments])
    setNewComment("")
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getInitials = (addr: string) => {
    return addr.slice(2, 4).toUpperCase()
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Comments</h3>
        <span className="text-sm text-muted-foreground">({comments.length})</span>
      </div>

      {/* Comment Input */}
      <div className="space-y-3 mb-6">
        <Textarea
          placeholder={isConnected ? "Share your thoughts..." : "Connect wallet to comment"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!isConnected}
          className="min-h-[100px] resize-none"
        />
        <div className="flex justify-end">
          <Button onClick={handleSubmitComment} disabled={!isConnected || !newComment.trim()} size="sm">
            <Send className="w-4 h-4 mr-2" />
            Post Comment
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(comment.author)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{formatAddress(comment.author)}</span>
                  <span className="text-xs text-muted-foreground">{formatTimestamp(comment.timestamp)}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>
    </Card>
  )
}
