"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/session-client";
import { Avatar } from "@/components/social/Avatar";
import { FollowButton } from "@/components/social/FollowButton";
import { PostCard, FeedPost } from "@/components/social/PostCard";
import { toast } from "@/components/ui/toast";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

type ProfileAlbum = {
  id: string;
  title: string;
  description: string | null;
  images: { id: string; url: string; position: number }[];
};

type Profile = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  coverImage: string | null;
  bio: string | null;
  createdAt: string;
  isFollowing: boolean;
  accountPrivate?: boolean;
  theme?: string | null;
  followRequested?: boolean;
  albums: ProfileAlbum[];
  _count: { posts: number; followers: number; following: number };
};

type FollowRequest = {
  id: string;
  follower: { id: string; name: string | null; username: string | null; image: string | null };
};

type Person = { id: string; name: string | null; username: string | null; image: string | null };

/* Shared glass-card surface from the profile bento design. */
const GLASS = "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md";
const GLASS_INNER = "rounded-xl border border-white/10 bg-white/5";
const MUTED = "text-white/50";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [followers, setFollowers] = useState<Person[] | null>(null);
  const [following, setFollowing] = useState<Person[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [privacyBusy, setPrivacyBusy] = useState(false);

  const loadPosts = useCallback(async () => {
    // A private account the viewer does not follow answers 403; treat that
    // as an empty (locked) feed rather than showing stale or misleading posts.
    const res = await fetch(`/api/profiles/${id}/posts`);
    if (res.ok) {
      const data = await res.json();
      setPosts(data.items ?? []);
    } else {
      setPosts([]);
    }
  }, [id]);

  const loadFollowers = useCallback(async () => {
    const res = await fetch(`/api/users/${id}/followers`);
    if (!res.ok) return;
    const rows = await res.json();
    setFollowers(Array.isArray(rows) ? rows.map((r: { follower: Person }) => r.follower) : []);
  }, [id]);

  const loadFollowing = useCallback(async () => {
    const res = await fetch(`/api/users/${id}/following`);
    if (!res.ok) return;
    const rows = await res.json();
    setFollowing(Array.isArray(rows) ? rows.map((r: { following: Person }) => r.following) : []);
  }, [id]);

  // Refresh after follow/unfollow: follow state decides what the visitor sees.
  const refresh = useCallback(async () => {
    const [p] = await Promise.all([
      fetch(`/api/profiles/${id}`).then((r) => (r.ok ? r.json() : null)),
      loadPosts(),
    ]);
    if (p) setProfile(p);
  }, [id, loadPosts]);

  useEffect(() => {
    if (status !== "authenticated" && status !== "unauthenticated") return;
    Promise.all([
      fetch(`/api/profiles/${id}`).then((r) => (r.ok ? r.json() : null)),
      loadPosts(),
    ])
      .then(async ([p]) => {
        setProfile(p);
        // Own profile: surface pending follow requests to approve or decline.
        if (p?.id && p.id === session?.user?.id) {
          const res = await fetch("/api/follow-requests");
          if (res.ok) {
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [id, status, loadPosts, session?.user?.id]);

  if (loading || !profile) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-4 rounded-3xl bg-[#0A0A0C] p-4 md:grid-cols-3 md:p-6">
          <div className="md:col-span-2">
            <div className="h-[540px] animate-pulse rounded-2xl bg-white/5" />
          </div>
          <div className="h-[540px] animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  const isMe = session?.user?.id === profile.id;
  // Private accounts only show posts to the account holder and their followers.
  const locked = Boolean(profile.accountPrivate) && !isMe && !profile.isFollowing;
  // The API zeroes the count for locked profiles; keep the UI honest even if
  // a stale payload slips through.
  const visiblePostCount = locked ? 0 : profile._count.posts;

  async function respondToRequest(requestId: string, accept: boolean) {
    const res = await fetch(`/api/follow-requests/${requestId}/${accept ? "accept" : "decline"}`, {
      method: "POST",
    });
    if (!res.ok) return;
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    if (accept) refresh(); // The new follower's count changed.
  }

  async function togglePrivacy() {
    if (privacyBusy) return;
    setPrivacyBusy(true);
    const next = !(profile?.accountPrivate ?? false);
    try {
      const res = await fetch("/api/profiles/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountPrivate: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Could not update privacy");
      }
      setProfile((p) => (p ? { ...p, accountPrivate: next } : p));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update privacy");
    } finally {
      setPrivacyBusy(false);
    }
  }

  return (
    <div className={`theme-${profile.theme || "gold"} mx-auto max-w-6xl px-4 py-8`}>
      <div className="grid grid-cols-1 gap-4 rounded-3xl bg-[#0A0A0C] p-4 text-white md:grid-cols-3 md:p-6">

        {/* ================= Main Content / Hero (col-span-2) ================= */}
        <div className={`${GLASS} p-6 md:col-span-2`}>
          <div className="relative mb-12">
            <div
              className={`h-44 rounded-2xl overflow-hidden ${
                profile.coverImage ? "" : "bg-gradient-to-r from-gold to-gold-light"
              }`}
            >
              {profile.coverImage && (
                <Image src={profile.coverImage} alt="" width={1200} height={400} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="absolute -bottom-10 left-6 ring-4 ring-white/15 rounded-full">
              <Avatar user={profile} size={88} />
            </div>
            <div className="absolute -bottom-8 right-6 flex gap-2">
              {isMe ? (
                <Link
                  href="/profile/edit"
                  className="rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition-colors"
                >
                  {t("editProfile")}
                </Link>
              ) : (
                <FollowButton
                  userId={profile.id}
                  initialFollowing={profile.isFollowing}
                  initialRequested={Boolean(profile.followRequested)}
                  onChange={refresh}
                />
              )}
            </div>
          </div>

          {/* Identity */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">{profile.name || profile.username}</h1>
            {profile.username && <p className={`mt-0.5 ${MUTED}`}>@{profile.username}</p>}
            {profile.bio && <p className="mt-3 whitespace-pre-wrap text-white/80">{profile.bio}</p>}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>
                <strong className="text-white">{visiblePostCount}</strong>{" "}
                <span className={MUTED}>{t("posts")}</span>
              </span>
              <span>
                <strong className="text-white">{profile._count.followers}</strong>{" "}
                <span className={MUTED}>{t("followersTab")}</span>
              </span>
              <span>
                <strong className="text-white">{profile._count.following}</strong>{" "}
                <span className={MUTED}>{t("followingTab")}</span>
              </span>
              <span className={MUTED}>
                {t("memberSince", { date: new Date(profile.createdAt).toLocaleDateString() })}
              </span>
            </div>
          </div>

          {/* Posts feed */}
          {profile.image && (
            <figure className="mb-6 overflow-hidden rounded-2xl border border-white/10">
              <figcaption className={`px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] ${MUTED}`}>
                {t("highlightedPicture")}
              </figcaption>
              <Image
                src={profile.image}
                alt={profile.name || profile.username || t("profilePictureAlt")}
                width={1200}
                height={900}
                className="max-h-[28rem] w-full object-cover"
              />
            </figure>
          )}
          {locked ? (
            <div className={`${GLASS_INNER} py-12 px-6 text-center`}>
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
                <Lock size={22} />
              </span>
              <h2 className="text-lg font-bold text-white">{t("lockedTitle")}</h2>
              <p className={`mt-1 text-sm ${MUTED}`}>
                {t("lockedText")}
              </p>
            </div>
          ) : posts.length === 0 ? (
            <p className={`text-center ${MUTED} py-10`}>No posts yet.</p>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDeleted={(pid) => setPosts((prev) => prev.filter((p) => p.id !== pid))}
                  onEdited={(updated) =>
                    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* ================= Sidebar / Secondary Card (col-span-1) ================= */}
        <div className={`${GLASS} space-y-6 p-6`}>

          {/* Follow requests (own profile only) */}
          {isMe && requests.length > 0 && (
            <section>
              <h2 className={`mb-3 text-xs font-bold uppercase tracking-wider ${MUTED}`}>
                {t("followRequests")}
              </h2>
              <div className="space-y-3">
                {requests.map((r) => (
                  <div key={r.id} className={`${GLASS_INNER} flex items-center gap-3 p-3`}>
                    <Avatar user={r.follower} size={40} />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/profile/${r.follower.id}`}
                        className="text-sm font-semibold text-white hover:underline block truncate"
                      >
                        {r.follower.name || r.follower.username || "Someone"}
                      </Link>
                      {r.follower.username && (
                        <p className={`text-xs ${MUTED} truncate`}>@{r.follower.username}</p>
                      )}
                    </div>
                    <button
                      onClick={() => respondToRequest(r.id, true)}
                      className="rounded-full bg-gold-600 text-white px-4 py-1.5 text-xs font-semibold hover:bg-gold-700"
                    >
                      {t("accept")}
                    </button>
                    <button
                      onClick={() => respondToRequest(r.id, false)}
                      className="rounded-full border border-white/15 text-white/80 px-4 py-1.5 text-xs font-semibold hover:bg-white/10"
                    >
                      {t("decline")}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* About */}
          <section>
            <h2 className={`mb-3 text-xs font-bold uppercase tracking-wider ${MUTED}`}>{t("about")}</h2>
            <p className="text-sm text-white/80">{profile.bio || "—"}</p>
            <div className="grid grid-cols-3 gap-2 text-center mt-3">
              <div className={`${GLASS_INNER} p-3`}>
                <p className="text-lg font-bold text-white">{visiblePostCount}</p>
                <p className={`text-xs ${MUTED}`}>{t("posts")}</p>
              </div>
              <div className={`${GLASS_INNER} p-3`}>
                <p className="text-lg font-bold text-white">{profile._count.followers}</p>
                <p className={`text-xs ${MUTED}`}>{t("followersTab")}</p>
              </div>
              <div className={`${GLASS_INNER} p-3`}>
                <p className="text-lg font-bold text-white">{profile._count.following}</p>
                <p className={`text-xs ${MUTED}`}>{t("followingTab")}</p>
              </div>
            </div>
          </section>

          {/* Albums */}
          <section>
            <h2 className={`mb-3 text-xs font-bold uppercase tracking-wider ${MUTED}`}>{t("albums")}</h2>
            {profile.albums.length === 0 ? (
              <p className={`text-sm ${MUTED}`}>{t("emptyAlbum")}</p>
            ) : (
              <div className="space-y-3">
                {profile.albums.map((album) => (
                  <article key={album.id} className={`${GLASS_INNER} p-3`}>
                    <h3 className="text-sm font-semibold text-white">{album.title}</h3>
                    {album.description && <p className={`mt-0.5 text-xs ${MUTED}`}>{album.description}</p>}
                    {album.images.length > 0 ? (
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {album.images.slice(0, 6).map((image) => (
                          <Image key={image.id} src={image.url} alt="" width={120} height={120} unoptimized className="aspect-square w-full rounded-lg object-cover" />
                        ))}
                      </div>
                    ) : (
                      <p className={`mt-2 text-xs ${MUTED}`}>{t("emptyAlbum")}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Followers */}
          <section>
            <h2 className={`mb-3 text-xs font-bold uppercase tracking-wider ${MUTED}`}>{t("followersTab")}</h2>
            {followers !== null && followers.length === 0 ? (
              <p className={`text-sm ${MUTED}`}>{t("noFollowers")}</p>
            ) : (
              <div className="divide-y divide-white/10">
                {followers
                  ?.filter((person): person is Person => Boolean(person))
                  .slice(0, 8)
                  .map((person) => (
                    <div key={person.id} className="flex items-center gap-3 py-2.5">
                      <Link href={`/profile/${person.id}`}>
                        <Avatar user={person} size={40} />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${person.id}`} className="text-sm font-semibold text-white hover:underline block truncate">
                          {person.name || person.username}
                        </Link>
                        {person.username && <p className={`text-xs ${MUTED} truncate`}>@{person.username}</p>}
                      </div>
                      {person.id !== session?.user?.id && (
                        <FollowButton userId={person.id} initialFollowing={false} size="sm" onChange={refresh} />
                      )}
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* Following */}
          <section>
            <h2 className={`mb-3 text-xs font-bold uppercase tracking-wider ${MUTED}`}>{t("followingTab")}</h2>
            {following !== null && following.length === 0 ? (
              <p className={`text-sm ${MUTED}`}>{t("noFollowing")}</p>
            ) : (
              <div className="divide-y divide-white/10">
                {following
                  ?.filter((person): person is Person => Boolean(person))
                  .slice(0, 8)
                  .map((person) => (
                    <div key={person.id} className="flex items-center gap-3 py-2.5">
                      <Link href={`/profile/${person.id}`}>
                        <Avatar user={person} size={40} />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${person.id}`} className="text-sm font-semibold text-white hover:underline block truncate">
                          {person.name || person.username}
                        </Link>
                        {person.username && <p className={`text-xs ${MUTED} truncate`}>@{person.username}</p>}
                      </div>
                      {person.id !== session?.user?.id && (
                        <FollowButton userId={person.id} initialFollowing={false} size="sm" onChange={refresh} />
                      )}
                    </div>
                  ))}
              </div>
            )}
          </section>

          {/* Account settings (own profile only) */}
          {isMe && (
            <section className="border-t border-white/10 pt-5">
              <h2 className={`mb-3 text-xs font-bold uppercase tracking-wider ${MUTED}`}>{t("accountSummary")}</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className={MUTED}>{t("nameLabel")}</dt>
                  <dd className="font-medium truncate text-white">{profile.name || "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className={MUTED}>{t("usernameLabel")}</dt>
                  <dd className="font-medium truncate text-white">{profile.username ? `@${profile.username}` : "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className={MUTED}>{t("memberSinceLabel")}</dt>
                  <dd className="font-medium text-white">{new Date(profile.createdAt).toLocaleDateString()}</dd>
                </div>
              </dl>

              <div className={`${GLASS_INNER} flex items-center justify-between gap-4 p-4 mt-4`}>
                <div>
                  <p className="font-semibold text-sm text-white">{t("privacySection")}</p>
                  <p className={`text-xs ${MUTED} mt-0.5`}>{t("privateAccountHint")}</p>
                </div>
                <button
                  onClick={togglePrivacy}
                  disabled={privacyBusy}
                  aria-checked={Boolean(profile.accountPrivate)}
                  role="switch"
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                    profile.accountPrivate ? "bg-gold-600" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      profile.accountPrivate ? "left-[1.4rem]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <Link
                href="/profile/edit"
                className="block w-full rounded-full bg-gradient-to-br from-gold-500 to-gold-600 text-white py-2.5 text-center text-sm font-semibold hover:brightness-110 transition mt-4"
              >
                {t("editFullProfile")}
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}