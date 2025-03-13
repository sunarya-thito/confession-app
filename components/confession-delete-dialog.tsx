"use client"

import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";

interface ConfessionDeleteDialogProps {
  confessionId: number;
  onConfirm: (confessionId: number) => Promise<void>;
}

export default function ConfessionDeleteDialog({confessionId, onConfirm}: ConfessionDeleteDialogProps) {
  async function handleDelete() {
    onConfirm(confessionId);
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          Hapus pengakuan
        </DialogTitle>
        <DialogDescription>
          Apakah Anda yakin ingin menghapus pengakuan ini?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose>
          <Button variant={"ghost"}>
            Close
          </Button>
        </DialogClose>
        <DialogClose>
          <Button
            variant={"destructive"}
            onClick={handleDelete}
          >
            Hapus
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}