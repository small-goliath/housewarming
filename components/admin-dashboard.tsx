"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiFetch, apiJson } from "@/lib/api";
import { formatMonthKST } from "@/lib/datetime";
import type { Housewarming } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminHousewarmingForm } from "@/components/admin-housewarming-form";

export function AdminDashboard() {
  const [items, setItems] = useState<Housewarming[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Housewarming | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiJson<Housewarming[]>("/api/admin/housewarmings");
      setItems(data);
    } catch {
      toast.error("목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(item: Housewarming) {
    setEditing(item);
    setDialogOpen(true);
  }

  async function handleDelete(item: Housewarming) {
    if (!window.confirm(`'${item.name}' 집들이를 삭제할까요?`)) return;
    try {
      const res = await apiFetch(`/api/admin/housewarmings/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 404) throw new Error();
      toast.success("삭제했어요.");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  }

  function handleSuccess() {
    setDialogOpen(false);
    setEditing(null);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          집들이 등록
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-20 text-center">불러오는 중...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground py-20 text-center">
          등록된 집들이가 없습니다. &lsquo;집들이 등록&rsquo;으로 추가해 주세요.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>집들이명</TableHead>
                <TableHead>편성</TableHead>
                <TableHead>집들이 월</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.organization ?? "-"}</TableCell>
                  <TableCell>{formatMonthKST(item.event_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(item)}
                        aria-label="수정"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        aria-label="삭제"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "집들이 수정" : "집들이 등록"}</DialogTitle>
            <DialogDescription>
              이미지를 업로드하고 정보를 입력해 주세요. 집들이 월은 KST 기준입니다.
            </DialogDescription>
          </DialogHeader>
          <AdminHousewarmingForm
            initial={editing}
            onSuccess={handleSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
