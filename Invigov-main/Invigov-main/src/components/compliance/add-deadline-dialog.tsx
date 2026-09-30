"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AddDeadlineDialogProps {
  trigger?: React.ReactNode;
}

export function AddDeadlineDialog({ trigger }: AddDeadlineDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const createDeadline = useMutation({
    mutationFn: async (data: { title: string; deadline_date: string; description?: string }) => {
      const res = await api.post("/compliance/deadlines", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-dashboard"] });
      setOpen(false);
      // Reset form
      setTitle("");
      setDeadlineDate("");
      setDescription("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadlineDate) return;

    createDeadline.mutate({
      title,
      deadline_date: deadlineDate,
      description: description || undefined,
    });
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Custom Deadline
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Custom Deadline</DialogTitle>
            <DialogDescription>
              Create a custom compliance deadline to track important dates and requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Quarterly Tax Filing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={255}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deadline_date">
                Deadline Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="deadline_date"
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                min={today}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any additional details about this deadline..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createDeadline.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createDeadline.isPending || !title || !deadlineDate}>
              {createDeadline.isPending ? "Creating..." : "Create Deadline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
