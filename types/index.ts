
export interface Profile {
    id: string
    display_name: string | null
    avatar_url: string | null
    created_at: string
}

export interface Post {
    id: string
    author_id: string
    content: string
    source: "GNEWS" | "NAVER" | "MANUAL"
    source_url: string | null
    is_ai_generated: boolean
    created_at: string
    updated_at: string
    author?: Profile
    likes_count: number
    comments_count: number
    user_has_liked: boolean
    user_has_bookmarked: boolean
}

export interface Comment {
    id: string
    post_id: string
    author_id: string
    content: string
    created_at: string
    updated_at: string
    author?: Profile
}
