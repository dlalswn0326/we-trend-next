
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const SYSTEM_USER_NAME = "We-Trend AI";

async function getSystemUserId() {
    const { data: user, error } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("display_name", SYSTEM_USER_NAME)
        .single();

    if (user) return user.id;
    return null;
}

async function fetchNewsFromRSS() {
    console.log("Falling back to Google News RSS...");
    const rssUrl = "https://news.google.com/rss/search?q=AI+when:1d&hl=ko&gl=KR&ceid=KR:ko";
    try {
        const res = await fetch(rssUrl);
        const text = await res.text();

        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(text)) !== null) {
            if (items.length >= 5) break;
            const itemContent = match[1];
            const titleMatch = /<title>(.*?)<\/title>/.exec(itemContent);
            const linkMatch = /<link>(.*?)<\/link>/.exec(itemContent);

            if (titleMatch && linkMatch) {
                items.push({
                    title: titleMatch[1].replace("<![CDATA[", "").replace("]]>", ""),
                    description: titleMatch[1].replace("<![CDATA[", "").replace("]]>", ""),
                    url: linkMatch[1],
                    source: "Google News",
                    publishedAt: new Date().toISOString(),
                    source_type: "GNEWS" // Helper for DB insert
                });
            }
        }
        return items;
    } catch (e) {
        console.error("RSS Fetch Error", e);
        return [];
    }
}

async function fetchNewsFromGNews() {
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey || apiKey === "your_gnews_key") {
        console.log("GNEWS_API_KEY missing or default, using RSS fallback.");
        return await fetchNewsFromRSS();
    }

    const query = "AI OR 인공지능 OR 테크";
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
        query
    )}&lang=ko&country=kr&max=3&apikey=${apiKey}`; // Reduced max to 3 to balance with Naver

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
            return data.articles.map((article: any) => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source.name,
                publishedAt: article.publishedAt,
                source_type: "GNEWS"
            }));
        }
        console.log("GNews returned no articles, trying RSS...");
        return await fetchNewsFromRSS();
    } catch (error) {
        console.error("Error fetching from GNews:", error);
        return await fetchNewsFromRSS();
    }
}

async function fetchNewsFromNaver() {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId === "your_naver_client_id") {
        console.log("Naver API keys missing or default. Skipping Naver.");
        return [];
    }

    const query = "AI OR 인공지능 OR 테크";
    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=3&sort=sim`;

    try {
        const res = await fetch(url, {
            headers: {
                "X-Naver-Client-Id": clientId,
                "X-Naver-Client-Secret": clientSecret,
            },
        });
        const data = await res.json();

        if (data.items) {
            return data.items.map((item: any) => ({
                // Naver Search API returns HTML entities in title/desc, need to clean basic ones if possible.
                // For simplicity, we just strip basic tags.
                title: item.title.replace(/<[^>]*>?/gm, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
                description: item.description.replace(/<[^>]*>?/gm, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
                url: item.link,
                source: "Naver News",
                publishedAt: item.pubDate,
                source_type: "NAVER"
            }));
        }
        return [];
    } catch (e) {
        console.error("Naver Fetch Error", e);
        return [];
    }
}


async function summarizeNews(title: string, description: string) {
    try {
        // User requested gemini-2.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
    다음 뉴스 기사를 한국어로 3줄 요약해서 SNS(트위터/스레드) 스타일로 작성해줘.
    친근하고 트렌디한 말투로 작성해. 이모지를 적절히 사용해.
    
    제목: ${title}
    내용: ${description}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini summarization error:", error);
        return null;
    }
}

export async function GET(request: Request) {
    try {
        console.log("1. Starting News Fetch...");

        const systemUserId = await getSystemUserId();
        if (!systemUserId) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        "System user 'We-Trend AI' not found. Please create a user with this display name in Supabase 'profiles' table.",
                },
                { status: 500 }
            );
        }

        // Parallel fetch
        const [gnewsResults, naverResults] = await Promise.all([
            fetchNewsFromGNews(),
            fetchNewsFromNaver()
        ]);

        const allNews = [...gnewsResults, ...naverResults];

        if (allNews.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No news found from any source.",
            });
        }

        let processedCount = 0;
        const logs = [];

        // Shuffle simply to mix GNews/Naver? Or just iterate.
        // Let's just iterate.

        for (const news of allNews) {
            const { data: existing } = await supabaseAdmin
                .from("posts")
                .select("id")
                .eq("source_url", news.url)
                .single();

            if (existing) {
                logs.push(`Skipped: ${news.title} (Already exists)`);
                continue;
            }

            const summary = await summarizeNews(news.title, news.description);
            if (summary) {
                const { error } = await supabaseAdmin.from("posts").insert({
                    author_id: systemUserId,
                    content: summary,
                    source: news.source_type || "GNEWS", // Use the helper prop to satisfy check constraint
                    source_url: news.url,
                    is_ai_generated: true,
                });

                if (!error) {
                    processedCount++;
                    logs.push(`Posted: ${news.title} [${news.source_type}]`);
                } else {
                    logs.push(`Failed to DB insert: ${news.title} - ${error.message}`);
                    console.error(error);
                }
            } else {
                logs.push(`Failed to summarize: ${news.title}`);
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            logs: logs,
        });
    } catch (e: any) {
        console.error("Fatal Error in Fetch News:", e);
        return NextResponse.json(
            { success: false, error: e.message },
            { status: 500 }
        );
    }
}
