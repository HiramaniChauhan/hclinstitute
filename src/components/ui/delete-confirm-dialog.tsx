import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The exact name the admin must type to confirm deletion */
  itemName: string;
  /** e.g. "course", "test", "note", "video", "student" */
  itemType: string;
  /** Extra description about what will be cascade-deleted */
  cascadeDescription?: string;
  /** Called when the admin confirms the deletion */
  onConfirm: () => void;
}

export const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  itemName,
  itemType,
  cascadeDescription,
  onConfirm,
}: DeleteConfirmDialogProps) => {
  const [input, setInput] = useState("");

  // Reset input when dialog opens/closes
  useEffect(() => {
    if (!open) setInput("");
  }, [open]);

  const isMatch = input === itemName;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-none shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-red-100 rounded-2xl">
              <ShieldAlert className="text-red-600 h-6 w-6" />
            </div>
            Confirm Deletion
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500 pt-2 leading-relaxed">
            You are about to permanently delete the {itemType}{" "}
            <span className="font-black text-red-600">"{itemName}"</span>
            {cascadeDescription && <>{". " + cascadeDescription}</>}.
            <br /><br />
            This action <span className="font-bold text-slate-700">cannot be undone</span>. To confirm, type the exact name below:
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="bg-red-50 border-2 border-dashed border-red-200 rounded-2xl px-5 py-3 text-center">
            <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-1">Type this to confirm</p>
            <p className="text-xl font-black text-red-700 tracking-tight">{itemName}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-700">Enter name to confirm</Label>
            <Input
              placeholder={`Type "${itemName}" to delete`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={`h-14 rounded-2xl text-lg font-bold transition-all ${
                input && isMatch
                  ? "border-green-400 bg-green-50 ring-2 ring-green-200 text-green-800"
                  : input && !isMatch
                  ? "border-red-300 bg-red-50/50 text-red-700"
                  : "border-slate-200 bg-slate-50"
              }`}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="gap-3">
          <Button
            variant="ghost"
            className="h-12 rounded-xl font-bold text-slate-500 px-6"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className={`h-12 rounded-xl font-black px-8 shadow-lg transition-all ${
              isMatch
                ? "bg-red-600 hover:bg-red-700 shadow-red-200 text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
            disabled={!isMatch}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            <Trash2 size={18} className="mr-2" />
            Delete {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
