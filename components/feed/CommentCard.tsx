import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

interface CommentCardProps {
    comment: {
        id: string
        content: string
        created_at: string
        post_id: string
        post?: {
            id: string
            content: string
            author: {
                display_name: string
                avatar_url: string
            }
        }
    }
}

export function CommentCard({ comment }: CommentCardProps) {
    return (
        <Link href={`/posts/${comment.post_id}`} className="block">
            <div className="p-4 border-b hover:bg-accent/50 transition-colors">
                <div className="flex gap-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), {
                                    addSuffix: true,
                                    locale: ko
                                })}
                            </span>
                        </div>

                        <p className="text-sm mb-3">{comment.content}</p>

                        {comment.post && (
                            <div className="pl-4 border-l-2 border-muted">
                                <div className="flex items-center gap-2 mb-1">
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={comment.post.author.avatar_url} />
                                        <AvatarFallback>{comment.post.author.display_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground">
                                        {comment.post.author.display_name}의 게시글
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {comment.post.content}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}
