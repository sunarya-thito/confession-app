"use client"
import React from "react";
import {toast} from "sonner";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {X} from "lucide-react";
import {useFormStatus} from "react-dom";

interface ConfessionFormProps {
  action: (formData: FormData) => Promise<{ error?: string}>
}

export function ConfessionForm({ action }: ConfessionFormProps) {
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await action(formData);

    if (result?.error) {
      setError(result.error)
      toast("Gagal", {
        description: result.error,
      })
    }
  }

  return (
    <form action={handleSubmit}>
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
            Pengakuan Anda
          </Label>
          <Textarea
            id={"content"}
            name={"content"}
            placeholder={"Apa yang ada di pikiran Anda?"}
            className={"min-h-[150px]"}
            required/>
          {error && <p className={"text-sm text-destructive mt-2"}>{error}</p>}
        </div>
        <div className={"flex justify-between"}>
          <Link href={"/"}>
            <Button type={"button"} variant={"outline"}>
              <X className={"mr-2 h-4 w-4"}/>
              Batal
            </Button>
          </Link>
          <SubmitButton/>
        </div>
      </div>
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type={"submit"} disabled={pending}>
      {pending ? "Memposting..." : "Posting Sekarang"}
    </Button>
  )
}