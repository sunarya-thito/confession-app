"use client"
import { toast } from "sonner"
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {useFormStatus} from "react-dom";
import {Button} from "@/components/ui/button";
import {useState} from "react";

interface ReplyFormProps {
  action: (formData: FormData) => Promise<{ error?: string } | undefined>
}
export default function ReplyForm({ action }: ReplyFormProps) {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)

    const result = await action(formData)

    if (result?.error) {
      setError(result.error)
      toast("Gagal", {
        description: result.error,
      })
    } else {
      const form = document.getElementById('reply-form') as HTMLFormElement
      form.reset()

      toast("Balasan diposting", {
        description: "Balasan Anda telah berhasil diposting",
      })
    }
  }

  return (
    <form id={"reply-form"} action={handleSubmit}>
      <div className={"grid gap-4"}>
        <div>
          <Label htmlFor={"alias"} className={"mb-2 block"}>
            Username <span className={"text-muted-foreground"}>(opsional)</span>
          </Label>
          <Input id={"alias"} name={"alias"} placeholder={"Masukkan username atau biarkan kosong untuk anonim"}/>
          <p className={"text-sm text-muted-foreground mt-1"}>Biarkan kosong untuk posting secara anonim</p>
        </div>
        <div>
          <Label htmlFor={"content"} className={"mb-2 block"}>
            Balasan Anda
          </Label>
          <Textarea
            id={"content"}
            name={"content"}
            placeholder={"Apa yang ingin Anda katakan?"}
            className={"min-h-[150px]"}
            required/>
          {error && <p className={"text-sm text-destructive mt-2"}>{error}</p>}
        </div>
        <div className={"flex justify-end"}>
          <SubmitButton/>
        </div>
      </div>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Memposting..." : "Posting Balasan"}
    </Button>
  )
}
