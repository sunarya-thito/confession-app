import {cookies} from "next/headers";
import {prisma} from "@/lib/db";
import {revalidatePath} from "next/cache";

export type ConfessionData = {
  id: number;
  content: string;
  alias: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  likesCount: bigint;
  dislikesCount: bigint;
  repliesCount: bigint;
  userVote: number;
}
export async function getUserId() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    throw new Error('Please refresh your browser')
  }

  return userId;
}

export async function createConfession(content: string, alias: string | null) {
  const userId = await getUserId();

  await prisma.confession.create({
    data: {
      userId,
      content,
      alias,
    }
  })

  revalidatePath('/')
}

export async function deleteConfession(id: number) {
  const userId = await getUserId();
  await prisma.confession.delete({
    where: {
      userId,
      id: id,
    }
  })

  revalidatePath('/')
}

export async function replyConfession({parentId, rootParentId, content, alias}: {parentId: number, rootParentId: number, content: string, alias: string | null}) {
  const userId = await getUserId();
  await prisma.confession.create({
    data: {
      userId,
      parentId,
      rootParentId,
      content,
      alias,
    }
  })
}

export async function getConfession(id: number): Promise<ConfessionData | null> {
  // use raw sql
  const userId = await getUserId();
  const confession = await prisma.$queryRaw<ConfessionData[]>`
      SELECT c.*,
             COALESCE(lc.likes_count, 0)    AS "likesCount",
             COALESCE(lc.dislikes_count, 0) AS "dislikesCount",
             COALESCE(cc.total_comments, 0) AS "repliesCount",
             COALESCE(uv.self_vote, 0)      AS "userVote"
      FROM "Confession" c
               LEFT JOIN (SELECT "confessionId",
                                 COUNT(*) FILTER (WHERE weight = 1) AS likes_count, COUNT(*) FILTER (WHERE weight = -1) AS dislikes_count
                          FROM "ConfessionVote"
                          GROUP BY "confessionId") lc ON c.id = lc."confessionId"
               LEFT JOIN (SELECT "rootParentId", COUNT(*) AS total_comments
                          FROM "Confession"
                          WHERE "rootParentId" IS NOT NULL
                          GROUP BY "rootParentId") cc ON c.id = cc."rootParentId"
               LEFT JOIN (SELECT "confessionId", weight AS self_vote
                          FROM "ConfessionVote"
                          WHERE "userId" = ${userId}) uv ON c.id = uv."confessionId"
      WHERE c.id = ${id}`;
  if (!confession.length) {
    return null;
  }
  return confession[0];
}

export async function voteConfession(confessionId: number, weight: number) {
  if (weight !== 1 && weight !== -1) {
    throw new Error('Invalid vote weight');
  }
  const userId = await getUserId();
  if (!weight) {
    await prisma.confessionVote.delete({
      where: {
        userId_confessionId: {
          userId,
          confessionId: confessionId,
        }
      }
    })
    return;
  }
  await prisma.confessionVote.upsert({
    where: {
      userId_confessionId: {
        userId,
        confessionId: confessionId,
      }
    },
    update: {
      weight,
    },
    create: {
      userId,
      confessionId: confessionId,
      weight,
    }
  })
}

export async function getLatestConfessions(): Promise<ConfessionData[]> {
  const userId = await getUserId();
  return prisma.$queryRaw<ConfessionData[]>`
      SELECT c.*,
             COALESCE(lc.likes_count, 0)    AS "likesCount",
             COALESCE(lc.dislikes_count, 0) AS "dislikesCount",
             COALESCE(cc.total_comments, 0) AS "repliesCount",
             COALESCE(uv.self_vote, 0)      AS "userVote"
      FROM "Confession" c
               LEFT JOIN (SELECT "confessionId",
                                 COUNT(*) FILTER (WHERE weight = 1) AS likes_count, COUNT(*) FILTER (WHERE weight = -1) AS dislikes_count
                          FROM "ConfessionVote"
                          GROUP BY "confessionId") lc ON c.id = lc."confessionId"
               LEFT JOIN (SELECT "rootParentId", COUNT(*) AS total_comments
                          FROM "Confession"
                          WHERE "rootParentId" IS NOT NULL
                          GROUP BY "rootParentId") cc ON c.id = cc."rootParentId"
                LEFT JOIN (SELECT "confessionId", weight AS self_vote
                         FROM "ConfessionVote"
                         WHERE "userId" = ${userId}) uv ON c.id = uv."confessionId"
      WHERE c."rootParentId" IS NULL
      ORDER BY c."createdAt" DESC`;
}


export async function getHotConfessions(): Promise<ConfessionData[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const userId = await getUserId();
  return prisma.$queryRaw<ConfessionData[]>`
      WITH vote_counts AS (SELECT "confessionId",
                                  SUM(weight) AS total_votes
                           FROM "ConfessionVote"
                           WHERE DATE ("updatedAt") >= DATE ('2025-03-13')
      GROUP BY "confessionId"
          )
      SELECT c.*,
             COALESCE(vc.total_votes, 0)    AS total_votes,
             COALESCE(lc.likes_count, 0)    AS "likesCount",
             COALESCE(lc.dislikes_count, 0) AS "dislikesCount",
             COALESCE(cc.total_comments, 0) AS "repliesCount",
             COALESCE(uv.self_vote, 0)      AS "userVote"
      FROM "Confession" c
               LEFT JOIN vote_counts vc ON c.id = vc."confessionId"
               LEFT JOIN (SELECT "confessionId",
                                 COUNT(*) FILTER (WHERE weight = 1) AS likes_count, COUNT(*) FILTER (WHERE weight = -1) AS dislikes_count
                          FROM "ConfessionVote"
                          GROUP BY "confessionId") lc ON c.id = lc."confessionId"
               LEFT JOIN (SELECT "rootParentId", COUNT(*) AS total_comments
                          FROM "Confession"
                          WHERE "rootParentId" IS NOT NULL
                          GROUP BY "rootParentId") cc ON c.id = cc."rootParentId"
               LEFT JOIN (SELECT "confessionId", weight AS self_vote
                          FROM "ConfessionVote"
                          WHERE "userId" = ${userId}) uv ON c.id = uv."confessionId"
      WHERE c."createdAt" >= ${startOfDay}
        AND c."rootParentId" IS NULL
      ORDER BY total_votes DESC, c."createdAt" DESC;
  `;
}

export async function getPopularConfessions(): Promise<ConfessionData[]> {
  const userId = await getUserId();
  return prisma.$queryRaw<ConfessionData[]>`
      WITH vote_counts AS (SELECT "confessionId",
                                  SUM(weight) AS total_votes
                           FROM "ConfessionVote"
                           GROUP BY "confessionId")
      SELECT c.*,
             COALESCE(vc.total_votes, 0)    AS total_votes,
             COALESCE(lc.likes_count, 0)    AS "likesCount",
             COALESCE(lc.dislikes_count, 0) AS "dislikesCount",
             COALESCE(cc.total_comments, 0) AS "repliesCount",
             COALESCE(uv.self_vote, 0)      AS "userVote"
      FROM "Confession" c
               LEFT JOIN vote_counts vc ON c.id = vc."confessionId"
               LEFT JOIN (SELECT "confessionId",
                                 COUNT(*) FILTER (WHERE weight = 1) AS likes_count, COUNT(*) FILTER (WHERE weight = -1) AS dislikes_count
                          FROM "ConfessionVote"
                          GROUP BY "confessionId") lc ON c.id = lc."confessionId"
               LEFT JOIN (SELECT "rootParentId", COUNT(*) AS total_comments
                          FROM "Confession"
                          WHERE "rootParentId" IS NOT NULL
                          GROUP BY "rootParentId") cc ON c.id = cc."rootParentId"
               LEFT JOIN (SELECT "confessionId", weight AS self_vote
                          FROM "ConfessionVote"
                          WHERE "userId" = ${userId}) uv ON c.id = uv."confessionId"
      WHERE c."rootParentId" IS NULL
      ORDER BY total_votes DESC, c."createdAt" DESC;
  `;
}

export async function getReplies(parentId: number): Promise<ConfessionData[]> {
  const userId = await getUserId();
  return prisma.$queryRaw<ConfessionData[]>`
      SELECT c.*,
             COALESCE(lc.likes_count, 0)    AS "likesCount",
             COALESCE(lc.dislikes_count, 0) AS "dislikesCount",
             COALESCE(cc.total_comments, 0) AS "repliesCount",
             COALESCE(uv.self_vote, 0)      AS "userVote"
      FROM "Confession" c
               LEFT JOIN (SELECT "parentId", COUNT(*) AS total_comments
                          FROM "Confession"
                          WHERE "parentId" IS NOT NULL
                          GROUP BY "parentId") cc ON c.id = cc."parentId"
               LEFT JOIN (SELECT "confessionId",
                                 COUNT(*) FILTER (WHERE weight = 1) AS likes_count, COUNT(*) FILTER (WHERE weight = -1) AS dislikes_count
                          FROM "ConfessionVote"
                          GROUP BY "confessionId") lc ON c.id = lc."confessionId"
               LEFT JOIN (SELECT "confessionId", weight AS self_vote
                          FROM "ConfessionVote"
                          WHERE "userId" = ${userId}) uv ON c.id = uv."confessionId"
      WHERE c."parentId" = ${parentId}
      ORDER BY c."createdAt" ASC;
  `;
}

export async function getSelfConfessions(): Promise<ConfessionData[]> {
  const userId = await getUserId();
  return prisma.$queryRaw<ConfessionData[]>`
      SELECT c.*,
             COALESCE(lc.likes_count, 0)    AS "likesCount",
             COALESCE(lc.dislikes_count, 0) AS "dislikesCount",
             COALESCE(cc.total_comments, 0) AS "repliesCount",
             COALESCE(uv.self_vote, 0)      AS "userVote"
      FROM "Confession" c
               LEFT JOIN (SELECT "parentId", COUNT(*) AS total_comments
                          FROM "Confession"
                          WHERE "parentId" IS NOT NULL
                          GROUP BY "parentId") cc ON c.id = cc."parentId"
               LEFT JOIN (SELECT "confessionId",
                                 COUNT(*) FILTER (WHERE weight = 1) AS likes_count, COUNT(*) FILTER (WHERE weight = -1) AS dislikes_count
                          FROM "ConfessionVote"
                          GROUP BY "confessionId") lc ON c.id = lc."confessionId"
               LEFT JOIN (SELECT "confessionId", weight AS self_vote
                          FROM "ConfessionVote"
                          WHERE "userId" = ${userId}) uv ON c.id = uv."confessionId"
      WHERE c."userId" = ${userId}
      ORDER BY c."createdAt" DESC;
  `;
}