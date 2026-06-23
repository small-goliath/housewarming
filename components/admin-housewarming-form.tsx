"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { apiFetch, apiJson } from "@/lib/api";
import { monthInputToUtcIso, utcIsoToMonthInput } from "@/lib/datetime";
import type { Housewarming } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  name: z.string().min(1, "집들이명을 입력해 주세요."),
  eventAtLocal: z.string().min(1, "월을 선택해 주세요."),
  organization: z.string().optional(),
  dressCode: z.string().optional(),
  note: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  kakaoOpenChatUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ImageUploadResponse {
  image_url: string;
}

export interface AdminHousewarmingFormProps {
  initial?: Housewarming | null; // 있으면 수정, 없으면 등록
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdminHousewarmingForm({
  initial,
  onSuccess,
  onCancel,
}: AdminHousewarmingFormProps) {
  const [uploading, setUploading] = useState(false);
  const isEdit = !!initial;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initial?.name ?? "",
      eventAtLocal: initial ? utcIsoToMonthInput(initial.event_at) : "",
      organization: initial?.organization ?? "",
      dressCode: initial?.dress_code ?? "",
      note: initial?.note ?? "",
      description: initial?.description ?? "",
      imageUrl: initial?.image_url ?? "",
      kakaoOpenChatUrl: initial?.kakao_open_chat_url ?? "",
    },
  });

  const imageUrl = form.watch("imageUrl");

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // multipart: Content-Type 은 브라우저가 boundary 와 함께 설정하도록 비워둠
      const res = await apiFetch("/api/admin/housewarmings/image", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? "업로드 실패");
      }
      const data: ImageUploadResponse = await res.json();
      form.setValue("imageUrl", data.image_url, { shouldValidate: true });
      toast.success("이미지를 업로드했어요.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      event_at: monthInputToUtcIso(values.eventAtLocal),
      organization: values.organization || null,
      dress_code: values.dressCode || null,
      note: values.note || null,
      description: values.description || null,
      image_url: values.imageUrl || null,
      kakao_open_chat_url: values.kakaoOpenChatUrl || null,
    };
    try {
      if (isEdit) {
        await apiJson(`/api/admin/housewarmings/${initial!.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("집들이를 수정했어요.");
      } else {
        await apiJson("/api/admin/housewarmings", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("집들이를 등록했어요.");
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장에 실패했습니다.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* 대표 이미지 업로드 */}
        <div className="space-y-2">
          <FormLabel>대표 이미지</FormLabel>
          {imageUrl ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-md border">
              <Image src={imageUrl} alt="대표 이미지 미리보기" fill className="object-cover" />
            </div>
          ) : (
            <div className="text-muted-foreground flex aspect-video w-full items-center justify-center rounded-md border border-dashed text-sm">
              이미지를 업로드해 주세요
            </div>
          )}
          <label className="inline-flex">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageSelect}
              disabled={uploading}
            />
            <span className="border-input bg-background hover:bg-accent inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {uploading ? "업로드 중..." : "이미지 선택"}
            </span>
          </label>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>집들이명 *</FormLabel>
              <FormControl>
                <Input placeholder="예: 그린나래" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventAtLocal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>집들이 월 *</FormLabel>
              <FormControl>
                <Input type="month" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="organization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>편성</FormLabel>
              <FormControl>
                <Input placeholder="예: 21대 총학생회" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dressCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>드레스코드</FormLabel>
              <FormControl>
                <Input placeholder="예: 편안한 복장" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비고</FormLabel>
              <FormControl>
                <Input placeholder="예: 주차 안내 등" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>상세 설명</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="집들이에 대한 자세한 안내를 적어주세요." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kakaoOpenChatUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>카카오 오픈채팅 URL</FormLabel>
              <FormControl>
                <Input placeholder="https://open.kakao.com/o/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting || uploading}>
            {form.formState.isSubmitting ? "저장 중..." : isEdit ? "수정" : "등록"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
