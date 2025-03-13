import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Flame, MessageCircle, Newspaper, Plus, Trash, TrendingUp, User, UserCircle} from "lucide-react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import {formatDistanceToNow} from "@/lib/utils";
import {
  ConfessionData,
  deleteConfession,
  getHotConfessions,
  getLatestConfessions,
  getPopularConfessions,
  getSelfConfessions,
  getUserId,
  voteConfession
} from "@/lib/actions";
import {VoteButtons} from "@/components/vote-buttons";
import {Dialog, DialogTrigger} from "@/components/ui/dialog";
import ConfessionDeleteDialog from "@/components/confession-delete-dialog";

type HomeSearchParams = {
  tab: string | null
}

export default async function Home({searchParams}: { searchParams: Promise<HomeSearchParams> }) {
  const tabParam = (await searchParams)?.tab;
  const tab = typeof tabParam === "string" ? tabParam : "latest";

  let confessions: ConfessionData[];

  switch (tab) {
    case "hot":
      confessions = await getHotConfessions()
      break;
    case "popular":
      confessions = await getPopularConfessions()
      break;
    case "you":
      confessions = await getSelfConfessions()
      break;
    case "latest":
    default:
      confessions = await getLatestConfessions()
      break;
  }

  async function handleVote(confessionId: number, weight: number) {
    "use server"
    await voteConfession(confessionId, weight)
  }

  async function handleDelete(confessionId: number) {
    "use server"
    await deleteConfession(confessionId)
  }

  const userId = await getUserId()

  return (
    <main className={"container max-w-4xl py-6 ml-auto mr-auto"}>
      <div className={"flex items-center justify-between mb-4"}>
        <div>
          <h1 className={"text-3xl font-bold tracking-tight"}>Menfess</h1>
          <p className={"text-muted-foreground"}>Bagikan pikiran Anda secara anonim</p>
        </div>
        <div className={"flex items-center gap-2"}>
          <Link href={"/confess"}>
            <Button>
              <Plus className={"mr-2 h-4 w-4"}/>
              Confess
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue={tab} className={"mb-6"}>
        <TabsList className={"grid grid-cols-4 mb-4"}>
          <TabsTrigger value={"latest"} asChild={true}>
            <Link href={"/?tab=latest"}>
              <Newspaper className={"mr-1 h-4 w-4"}/>
              Terbaru
            </Link>
          </TabsTrigger>
          <TabsTrigger value={"hot"} asChild={true}>
            <Link href={"/?tab=hot"}>
              <Flame className={"mr-1 h-4 w-4"}/>
              Hot
            </Link>
          </TabsTrigger>
          <TabsTrigger value={"popular"} asChild={true}>
            <Link href={"/?tab=popular"}>
              <TrendingUp className={"mr-1 h-4 w-4"}/>
              Populer
            </Link>
          </TabsTrigger>
          <TabsTrigger value={"you"} asChild={true}>
            <Link href={"/?tab=you"}>
              <UserCircle className={"mr-1 h-4 w-4"}/>
              Anda
            </Link>
          </TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          {confessions.length === 0 ? (
            <div className={"flex flex-col items-center justify-center py-12 text-center"}>
              <h2 className={"text-xl font-semibold mb-2"}>
                {tab === "you" ? "Anda belum membuat pengakuan" : "Belum ada pengakuan"}
              </h2>
              <p className={"text-muted-foreground mb-6"}>
                {tab === "you" ? "Bagikan pikiran Anda dengan dunia" : "Jadilah yang pertama berbagi pikiran Anda!"}
              </p>
              <Link href={"/confess"}>
                <Button>
                  <Plus className={"mr-2 h-4 w-4"}/>
                  Confess
                </Button>
              </Link>
            </div>
          ) : (
            <div className={"grid gap-4"}>
              {confessions.map((confession) => (
                <Card key={confession.id}>
                  <CardHeader className={"pb-2"}>
                    <div className={"flex items-center justify-between"}>
                      <div className={"flex items-center gap-2"}>
                        {confession.alias ? (
                          <div>
                            <span className={"font-medium"}>{confession.alias}</span>
                            <span className={"text-xs text-muted-foreground ml-1"}>
                            #{confession.userId}
                          </span>
                          </div>
                        ) : (
                          <div className={"flex items-center"}>
                            <User className={"mr-1 h-3 w-3"}/>
                            <span className={"text-muted-foreground"}>Anonim</span>
                            <span className={"text-xs text-muted-foreground ml-1"}>
                            #{confession.userId}
                          </span>
                          </div>
                        )}
                      </div>
                      <div className={"text-sm text-muted-foreground"}>
                        {formatDistanceToNow(confession.createdAt)} yang lalu
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={"whitespace-pre-wrap"}>
                      {confession.content}
                    </p>
                  </CardContent>
                  <CardFooter className={"border-t pt-4 flex justify-between"}>
                    <VoteButtons confession={confession} onVote={handleVote}/>
                    <div className={"flex gap-2"}>
                      <Link href={`/confession/${confession.id}`}>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          {confession.repliesCount > 0
                            ? `${confession.repliesCount} balasan`
                            : "Balas"}
                        </Button>
                      </Link>
                      {confession.userId === userId && <Dialog>
                        <DialogTrigger>
                          <Button variant="destructive" size="sm">
                            <Trash className={"mr-2 h-4 w-4"}/>
                            Hapus
                          </Button>
                        </DialogTrigger>
                        <ConfessionDeleteDialog confessionId={confession.id} onConfirm={handleDelete}/>
                      </Dialog>}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
}


