"use client"
import {useUser} from "@/components/user-provider";
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {ThumbsDown, ThumbsUp} from "lucide-react";
import {toast} from "sonner";
import {cn} from "@/lib/utils";
import {ConfessionData} from "@/lib/actions";

interface VoteButtonsProps {
  confession: ConfessionData,
  onVote: (confessionsId: number, weight: number) => Promise<void>,
}

export function VoteButtons({confession, onVote}: VoteButtonsProps) {
  const { userId } = useUser()
  const [isVoting, setIsVoting] = useState<boolean>(false)
  const [optimisticLikes, setOptimisticLikes] = useState<number>(Number(confession.likesCount))
  const [optimisticDislikes, setOptimisticDislikes] = useState<number>(Number(confession.dislikesCount))
  const [userVote, setUserVote] = useState<number>(confession.userVote) // 1 for like, -1 for dislike, 0 for none

  useEffect(() => {
    setOptimisticLikes(Number(confession.likesCount))
    setOptimisticDislikes(Number(confession.dislikesCount))
    setUserVote(confession.userVote)
  }, [confession.dislikesCount, confession.likesCount, confession.userVote]);

  const isOwner = userId === confession.userId

  if (!userId || isOwner) {
    return (
      <div className={"flex items-center gap-2"}>
        <Button variant="ghost" size="sm" disabled={true} className="flex items-center gap-1 cursor-not-allowed">
          <ThumbsUp className="h-4 w-4" />
          {optimisticLikes > 0 && <span>{optimisticLikes}</span>}
        </Button>

        <Button variant="ghost" size="sm" disabled={true} className="flex items-center gap-1 cursor-not-allowed">
          <ThumbsDown className="h-4 w-4" />
          {optimisticDislikes > 0 && <span>{optimisticDislikes}</span>}
        </Button>
      </div>
    )
  }

  async function handleVote(weight: number) {
    if (isVoting) return;
    setIsVoting(true);
    if (userVote === weight) {
      if (weight === 1) {
        setOptimisticLikes((prev) => Math.max(0, prev - 1))
      } else {
        setOptimisticDislikes((prev) => Math.max(0, prev - 1))
      }
      setUserVote(0)
    } else {
      if (weight === 1) {
        setOptimisticLikes((prev) => Math.max(0, prev + 1))
        if (userVote === -1) {
          setOptimisticDislikes((prev) => Math.max(0, prev - 1))
        }
      } else {
        setOptimisticDislikes((prev) => Math.max(0, prev + 1))
        if (userVote === 1) {
          setOptimisticLikes((prev) => Math.max(0, prev - 1))
        }
      }
      setUserVote(weight)
    }
    try {
      await onVote(confession.id, weight)
    } catch (e) {
      toast('Gagal memproses vote')
      console.log(e)

      setOptimisticLikes(Number(confession.likesCount))
      setOptimisticDislikes(Number(confession.dislikesCount))
      setUserVote(confession.userVote)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className={"flex items-center gap-2"}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(1)}
        className={cn("flex items-center gap-1", userVote === 1 && "text-green-500")}
        disabled={isVoting}
      >
        <ThumbsUp className="h-4 w-4" />
        {optimisticLikes > 0 && <span>{optimisticLikes}</span>}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(-1)}
        className={cn("flex items-center gap-1", userVote === -1 && "text-red-500")}
        disabled={isVoting}
      >
        <ThumbsDown className="h-4 w-4" />
        {optimisticDislikes > 0 && <span>{optimisticDislikes}</span>}
      </Button>
    </div>
  )
}