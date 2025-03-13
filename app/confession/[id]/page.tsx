import {notFound, redirect} from "next/navigation";
import {deleteConfession, getConfession, getReplies, getUserId, replyConfession, voteConfession} from "@/lib/actions";
import {Button} from "@/components/ui/button";
import {ArrowLeft, Trash, User} from "lucide-react";
import Link from "next/link";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import {formatDistanceToNow} from "@/lib/utils";
import {VoteButtons} from "@/components/vote-buttons";
import {Dialog, DialogTrigger} from "@/components/ui/dialog";
import ConfessionDeleteDialog from "@/components/confession-delete-dialog";
import ReplyForm from "@/components/reply-form";
import {revalidatePath} from "next/cache";

type ConfessionPageParams = {
  id: string | null
}
export default async function ConfessionPage({ params }: { params: Promise<ConfessionPageParams> }) {
  const id = (await params)?.id;
  if (!id) {
    notFound();
  }
  const parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    notFound();
  }
  const confession = await getConfession(parsedId);
  if (!confession) {
    notFound();
  }

  const replies = await getReplies(parsedId);

  async function handleVote(confessionId: number, weight: number) {
    "use server"
    await voteConfession(confessionId, weight);
  }

  async function handleDelete(confessionId: number) {
    "use server"
    await deleteConfession(confessionId)
    revalidatePath('/')
  }

  async function handleCreateReply(formData: FormData) {
    "use server"

    let content = formData.get("content") as string
    let alias = formData.get("alias") as string

    content = content.trim();
    alias = alias.trim();

    if (content.length > 500) {
      content = content.substring(0, 500)
    }
    if (alias.length > 32) {
      alias = alias.substring(0, 32)
    }

    if (!content) {
      return { error: "Balasan tidak boleh kosong" }
    }

    await replyConfession({
      parentId: parsedId,
      rootParentId: parsedId,
      alias,
      content,
    });

    revalidatePath('/')
  }

  const userId = await getUserId()

  return (
    <main className={"container max-w-2xl py-6 mr-auto ml-auto"}>
      <div className={"mb-6"}>
        <Link href={"/"}>
          <Button variant={"ghost"} size={"sm"}>
            <ArrowLeft className={"mr-2 h-4 w-4"}/>
            Kembali ke pengakuan
          </Button>
        </Link>
      </div>

      <Card className={"mb-6"}>
        <CardHeader className={"pb-2"}>
          <div className={"flex items-center justify-between"}>
            <div className={"flex items-center gap-2"}>
              {confession.alias ? (
                <div>
                  <span className="font-medium">{confession.alias}</span>
                  <span className="text-xs text-muted-foreground ml-1">#{confession.userId.substring(0, 6)}</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <User className="mr-1 h-3 w-3"/>
                  <span className="text-muted-foreground">Anonim</span>
                  <span className="text-xs text-muted-foreground ml-1">#{confession.userId.substring(0, 6)}</span>
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{formatDistanceToNow(confession.createdAt)} yang lalu</div>
          </div>
        </CardHeader>
        <CardContent>
          <p className={"whitespace-pre-wrap"}>{confession.content}</p>
        </CardContent>
        <CardFooter className={"border-t pt-4 flex justify-between"}>
          <VoteButtons confession={confession} onVote={handleVote}/>
          {confession.userId === userId && <Dialog>
            <DialogTrigger>
              <Button variant="destructive" size="sm">
                <Trash className={"mr-2 h-4 w-4"}/>
                Hapus
              </Button>
            </DialogTrigger>
            <ConfessionDeleteDialog confessionId={confession.id} onConfirm={handleDelete}/>
          </Dialog>}
        </CardFooter>
      </Card>

      <div className={"mb-6"}>
        <h2 className={"text-xl font-semibold mb-4"}>Balasan</h2>
        <ReplyForm action={handleCreateReply}/>
      </div>

      {replies.length === 0 ? (
        <div className={"text-center py-6 text-muted-foreground"}>Belum ada balasan. Jadilah yang pertama membalas!</div>
      ) : (
        <div className={"grid gap-4"}>
          {replies.map((reply) => (
            <Card key={reply.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {reply.alias ? (
                      <div>
                        <span className="font-medium">{reply.alias}</span>
                        <span className="text-xs text-muted-foreground ml-1">#{reply.userId}</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <User className="mr-1 h-3 w-3" />
                        <span className="text-muted-foreground">Anonim</span>
                        <span className="text-xs text-muted-foreground ml-1">#{reply.userId}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{formatDistanceToNow(reply.createdAt)} yang lalu</div>
                </div>
              </CardHeader>
              <CardContent>
                <p>{reply.content}</p>
              </CardContent>
              <CardFooter className={"border-t pt-4 flex justify-between"}>
                <VoteButtons confession={reply} onVote={handleVote}/>
                {confession.userId === userId && <Dialog>
                  <DialogTrigger>
                    <Button variant="destructive" size="sm">
                      <Trash className={"mr-2 h-4 w-4"}/>
                      Hapus
                    </Button>
                  </DialogTrigger>
                  <ConfessionDeleteDialog confessionId={reply.id} onConfirm={handleDelete}/>
                </Dialog>}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}