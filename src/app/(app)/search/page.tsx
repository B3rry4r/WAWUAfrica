"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon, Skeleton, EmptyState, ErrorState, VerificationBadge, BackLink } from "@/components/ui";
import type { IconName } from "@/components/ui/Icon";
import { ContentCard } from "@/components/content/ContentCard";
import { FollowButton } from "@/components/shared/FollowButton";
import { searchAll, getPopularSearches, getSuggestedCreators, getClosestResults, getRecentSearches } from "@/lib/api/search";
import { joinCommunity } from "@/lib/api/communities";
import type { ContentPiece, ContentType } from "@/types/content";
import type { SearchCommunityResult, SearchCreatorResult, SearchResults, SearchTab } from "@/types/search";

type Screen = "idle" | "loading" | "results" | "error";

const typeLabel: Record<ContentType, string> = {
  video: "video",
  course: "course",
  audio: "audio",
  pdf: "PDF",
  image: "art",
  template: "template",
};

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [screen, setScreen] = useState<Screen>("idle");
  const [tab, setTab] = useState<SearchTab>("all");
  const [results, setResults] = useState<SearchResults>({ content: [], creators: [], communities: [] });
  const [popular, setPopular] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestedCreators, setSuggestedCreators] = useState<SearchCreatorResult[]>([]);
  const [closest, setClosest] = useState<ContentPiece[]>([]);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    getPopularSearches().then(setPopular).catch(() => {});
    getSuggestedCreators().then(setSuggestedCreators).catch(() => {});
    getRecentSearches().then(setRecent).catch(() => {});
  }, []);

  const runSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setScreen("idle");
      return;
    }
    setScreen("loading");
    searchAll(trimmed)
      .then((res) => {
        setResults(res.results);
        setTab("all");
        setScreen("results");
        setRecent((prev) => [trimmed, ...prev.filter((r) => r !== trimmed)].slice(0, 5));
        if (
          res.results.content.length === 0 &&
          res.results.creators.length === 0 &&
          res.results.communities.length === 0
        ) {
          getClosestResults(trimmed).then(setClosest).catch(() => setClosest([]));
        } else {
          setClosest([]);
        }
      })
      .catch(() => setScreen("error"));
  };

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (timer.current) window.clearTimeout(timer.current);
    if (!value.trim()) {
      setScreen("idle");
      return;
    }
    timer.current = window.setTimeout(() => runSearch(value), 350);
  };

  const counts = {
    all: results.content.length + results.creators.length + results.communities.length,
    content: results.content.length,
    creators: results.creators.length,
    communities: results.communities.length,
  };

  const noResults = screen === "results" && counts.all === 0;
  const words = query.trim().split(/\s+/).filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col bg-surface-page xl:mx-auto xl:w-full xl:max-w-[700px]">
      <div className="px-4 pt-3 xl:px-0"><BackLink /></div>
      {/* Search header */}
      <div className="flex items-center gap-3 border-b border-hairline px-4 py-3.5 xl:sticky xl:top-0 xl:z-10 xl:h-[68px] xl:bg-page xl:px-6 xl:py-0">
        <div className="flex h-[42px] flex-1 items-center gap-2.5 rounded-full border border-hairline bg-input px-4 xl:h-10">
          <Icon name="Search" size={16} color="var(--text-muted)" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search WAWU"
            autoFocus
            className="w-full bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-disabled"
            aria-label="Search WAWU"
          />
          {query ? (
            <button type="button" onClick={() => onQueryChange("")} aria-label="Clear" className="text-text-muted hover:text-text-primary">
              <Icon name="X" size={16} />
            </button>
          ) : null}
        </div>
        <button type="button" onClick={() => router.push("/home")} className="shrink-0 text-[14.5px] font-semibold text-accent hover:text-text-primary">
          Cancel
        </button>
      </div>

      {screen === "idle" ? (
        <div className="flex flex-col gap-6 px-4 pb-8 pt-4">
          {/* Recent */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center">
              <span className="flex-1 text-[13px] font-bold uppercase tracking-[0.06em] text-text-muted">Recent</span>
              {recent.length ? (
                <button type="button" onClick={() => setRecent([])} className="text-[12.5px] font-semibold text-accent hover:text-text-primary">
                  Clear
                </button>
              ) : null}
            </div>
            {recent.length ? (
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setQuery(r);
                      runSearch(r);
                    }}
                    className="inline-flex h-[34px] items-center gap-1.5 rounded-button border border-hairline bg-tag px-3.5 text-[13.5px] font-medium text-text-secondary hover:bg-surface-hover active:bg-surface-press"
                  >
                    <Icon name="Clock" size={13} color="var(--text-muted)" />
                    {r}
                  </button>
                ))}
              </div>
            ) : (
              <p className="m-0 text-[13px] text-text-muted">No recent searches yet.</p>
            )}
          </section>

          {/* Trending */}
          <section className="flex flex-col gap-3">
            <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-text-muted">People are searching</span>
            <div className="flex flex-wrap gap-2">
              {popular.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setQuery(p);
                    runSearch(p);
                  }}
                  className="inline-flex h-[34px] items-center gap-1.5 rounded-button border border-hairline bg-tag px-3.5 text-[13.5px] font-medium text-text-secondary hover:bg-surface-hover active:bg-surface-press"
                >
                  <Icon name="TrendingUp" size={13} color="var(--accent)" />
                  {p}
                </button>
              ))}
            </div>
          </section>

          {/* Creators to know */}
          <section className="flex flex-col gap-3">
            <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-text-muted">Creators to know</span>
            {/* The identity link is split in two (avatar + name) with Follow
                outside both, so the hover belongs to the row and is keyed off
                the links — Follow must not light a row it does not open. */}
            <div className="flex flex-col overflow-hidden rounded-card border border-hairline bg-card">
              {suggestedCreators.map((c, i) => (
                <div key={c.wawuId} className={`flex items-center gap-3 px-4 py-3.5 has-[a:hover]:bg-state-hover ${i ? "border-t border-hairline" : ""}`}>
                  <Link href={`/profile/${c.wawuId}`} className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full bg-accent-tint text-[14px] font-semibold text-accent-hover">
                    {c.fullName.charAt(0)}
                  </Link>
                  <Link href={`/profile/${c.wawuId}`} className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-semibold">{c.fullName}</span>
                      <VerificationBadge tier={c.verificationLevel} />
                    </span>
                    <span className="truncate text-[12px] text-text-muted">
                      {c.headline} · {c.pieceCount} pieces{c.location ? ` · ${c.location}` : ""}
                    </span>
                  </Link>
                  <FollowButton wawuId={c.wawuId} initial={false} size="sm" />
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {screen === "error" ? (
        <ErrorState title="Search is unavailable" body="We could not reach search right now. Try again in a moment." onRetry={() => runSearch(query)} />
      ) : null}

      {screen === "loading" ? (
        <div className="flex flex-col gap-4 px-4 pt-4">
          <div className="flex gap-2">
            {["All", "Content", "Creators", "Communities"].map((t) => (
              <Skeleton key={t} className="h-[34px] w-[84px] rounded-button" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-[52px] w-[52px] rounded-card" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-[55%] rounded" />
                <Skeleton className="h-3 w-[38%] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {screen === "results" && !noResults ? (
        <div className="flex flex-col gap-4 px-4 pb-8 pt-4">
          {/* Tabs */}
          <div className="wawu-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5">
            {(Object.keys(counts) as SearchTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`inline-flex h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-button px-[14px] text-[13.5px] font-semibold transition-colors ${
                  tab === t ? "bg-accent text-on-accent" : "border border-hairline bg-tag text-text-secondary hover:bg-surface-hover active:bg-surface-press"
                }`}
              >
                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                <span className="opacity-70 [font-feature-settings:var(--font-feature-tabular)]">
                  {counts[t]}
                </span>
              </button>
            ))}
          </div>

          {(tab === "all" || tab === "content") && results.content.length ? (
            <section className="flex flex-col gap-2">
              <ContentResults items={tab === "all" ? results.content.slice(0, 3) : results.content} />
            </section>
          ) : null}

          {(tab === "all" || tab === "creators") && results.creators.length ? (
            <section className="flex flex-col gap-2">
              {(tab === "all" ? results.creators.slice(0, 2) : results.creators).map((c) => (
                <div key={c.wawuId} className="flex items-center gap-3 rounded-card border border-hairline bg-card px-4 py-3.5 has-[a:hover]:bg-surface-hover">
                  <Link href={`/profile/${c.wawuId}`} className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full bg-accent-tint text-[14px] font-semibold text-accent-hover">
                    {c.fullName.charAt(0)}
                  </Link>
                  <Link href={`/profile/${c.wawuId}`} className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-semibold">{c.fullName}</span>
                      <VerificationBadge tier={c.verificationLevel} />
                    </span>
                    <span className="truncate text-[12px] text-text-muted">
                      {c.headline} · {c.pieceCount} pieces{c.location ? ` · ${c.location}` : ""}
                    </span>
                  </Link>
                  <FollowButton wawuId={c.wawuId} initial={false} size="sm" />
                </div>
              ))}
            </section>
          ) : null}

          {(tab === "all" || tab === "communities") && results.communities.length ? (
            <section className="flex flex-col gap-2">
              {(tab === "all" ? results.communities.slice(0, 2) : results.communities).map((c) => (
                <CommunityRow key={c.id} community={c} />
              ))}
            </section>
          ) : null}
        </div>
      ) : null}

      {noResults ? (
        <div className="flex flex-col gap-5 px-4 pb-8 pt-4">
          <div className="flex flex-col gap-1">
            <p className="m-0 text-[15px] font-semibold">Try a shorter search</p>
            <p className="m-0 text-[13px] text-text-muted">Fewer words usually finds more.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {words.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setQuery(w);
                  runSearch(w);
                }}
                className="inline-flex h-[34px] items-center rounded-button border border-hairline bg-tag px-3.5 text-[13.5px] font-medium text-text-secondary hover:bg-surface-hover active:bg-surface-press"
              >
                {w}
              </button>
            ))}
          </div>
          {closest.length ? (
            <section className="flex flex-col gap-2">
              <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-text-muted">Closest things we have</span>
              <ContentResults items={closest.slice(0, 3)} />
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CommunityRow({ community }: { community: SearchCommunityResult }) {
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-card border border-hairline bg-card px-4 py-3.5 has-[a:hover]:bg-surface-hover">
      <Link href={`/communities/${community.id}`} className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full bg-tag text-text-secondary">
        <Icon name="Users" size={18} />
      </Link>
      <Link href={`/communities/${community.id}`} className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[14px] font-semibold">{community.name}</span>
        <span className="truncate text-[12px] text-text-muted">
          {community.memberCount.toLocaleString("en-NG")} members · {community.visibility}
        </span>
      </Link>
      <button
        type="button"
        disabled={joined || joining}
        onClick={() => {
          setJoining(true);
          joinCommunity(community.id)
            .then(() => setJoined(true))
            .finally(() => setJoining(false));
        }}
        className="shrink-0 rounded-button border border-hairline bg-tag px-3.5 py-2 text-[12.5px] font-semibold enabled:hover:bg-surface-hover enabled:active:bg-surface-press disabled:opacity-60"
      >
        {joined ? "Joined" : "Join"}
      </button>
    </div>
  );
}

function typeIcon(type: ContentType): IconName {
  const icons: Record<ContentType, IconName> = {
    video: "Play",
    course: "GraduationCap",
    audio: "Headphones",
    pdf: "FileText",
    image: "Image",
    template: "LayoutTemplate",
  };
  return icons[type];
}

/**
 * Content-type search results (design D15: "cards for content, rows for
 * people and things"). Mobile keeps its compact icon rows; desktop swaps to
 * the shared ContentCard grid used across feed/profile/purchases.
 */
function ContentResults({ items }: { items: ContentPiece[] }) {
  return (
    <>
      <div className="flex flex-col gap-2 xl:hidden">
        {items.map((c) => (
          <Link key={c.id} href={`/content/${c.id}`} className="flex items-center gap-3.5 rounded-card border border-hairline bg-card px-4 py-3.5 hover:border-strong hover:bg-surface-hover active:bg-surface-press">
            <span
              className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-card border border-hairline bg-[repeating-linear-gradient(135deg,var(--surface-tag)_0_10px,var(--surface-card)_10px_20px)] text-text-secondary"
            >
              <Icon name={typeIcon(c.contentType)} size={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[14.5px] font-semibold">{c.title}</span>
              <span className="truncate text-[12.5px] text-text-muted">
                {c.creator.fullName} · {typeLabel[c.contentType]}
              </span>
            </span>
            <Icon name="ChevronRight" size={16} color="var(--text-muted)" />
          </Link>
        ))}
      </div>
      <div className="hidden grid-cols-2 gap-4 xl:grid">
        {items.map((c) => (
          <ContentCard key={c.id} content={c} ratio="16 / 9" />
        ))}
      </div>
    </>
  );
}
