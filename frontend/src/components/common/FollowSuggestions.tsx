"use client";

import React, { useEffect, useState } from "react";
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
    <div className="p-4 hidden md:block">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Suggestions for you
      </h4>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-3">
          {items.map((user) => (
            <div key={user.userId} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-medium text-gray-600">
                  <Image
                    src={user.profilePictureUrl || "/person.jpg"}
                    width={32}
                    height={32}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    {user.username}
                  </div>
                </div>
              </div>

              <div>
                <FollowButton targetUserId={user.userId} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
