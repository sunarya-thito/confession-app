import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ConfessionForm} from "@/components/confession-form";
import {redirect} from "next/navigation";
import {createConfession} from "@/lib/actions";

export default function ConfessPage() {
  async function handleCreateConfession(formData: FormData) {
    "use server"

    let content = formData.get("content") as string
    let alias = formData.get("alias") as string

    if (content.length > 500) {
      content = content.substring(0, 500)
    }

    if (alias.length > 32) {
      alias = alias.substring(0, 32)
    }

    if (!content?.trim()) {
      return { error: "Pengakuan tidak boleh kosong" }
    }

    await createConfession(content, alias)

    redirect("/")
  }

  return (
    <main className={"container max-w-2xl py-6 ml-auto mr-auto"}>
      <Card>
        <CardHeader>
          <CardTitle>
            Bagikan Pengakuan
          </CardTitle>
          <CardDescription>
            Bagikan pikiran Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfessionForm action={handleCreateConfession}/>
        </CardContent>
      </Card>
    </main>
  )
}