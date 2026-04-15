"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserData } from "@/hooks/useUserData";
import { getFollowSuggestions } from "@/controllers/followController/getSuggestions";
import type { SuggestedUser } from "@/lib/types/followSuggestions";
import FollowButton from "@/components/common/FollowButton";
import Image from "next/image";

interface Props {
  page?: number;
  size?: number;
}

export default function FollowSuggestions({ page = 0, size = 5 }: Props) {
  const router = useRouter();
  const currentUser = useUserData();
  const token = currentUser?.accessToken ?? null;

  const [items, setItems] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const res = await getFollowSuggestions(token, { page, size });
      if (!mounted) return;
      if (res.success && res.data) {
        setItems(res.data.data.content as SuggestedUser[]);
      }
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token, page, size]);

  return (
    <div className="py-1 hidden md:block">
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-navy/30 dark:text-cream/25">
        Suggested
      </p>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2.5 px-3 py-1.5 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-cream-300/50 dark:bg-navy-700/50" />
              <div className="flex-1 h-3 bg-cream-300/50 dark:bg-navy-700/50 rounded-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="px-3 text-[12px] text-navy/35 dark:text-cream/30">No suggestions right now.</p>
      ) : (
        <div className="space-y-0.5">
          {items.map((user) => (
            <div key={user.userId} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl hover:bg-cream-300/30 dark:hover:bg-navy-700/30 transition-colors duration-200">
              <div
                className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                onClick={() => router.push(`/profile/${user.userId}`)}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-cream-300/50 dark:bg-navy-700/50 flex-shrink-0">
                  <Image
                    src={user.profilePictureUrl || "/person.jpg"}
                    width={32}
                    height={32}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[13px] font-medium text-navy/70 dark:text-cream/70 truncate hover:text-navy dark:hover:text-cream transition-colors">
                  {user.username}
                </span>
              </div>
              <FollowButton targetUserId={user.userId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
