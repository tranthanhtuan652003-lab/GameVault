"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { GameDto, GenreDto, PlatformDto, DeveloperDto, PublisherDto } from "@/lib/types";

export default function AdminGamesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [games, setGames] = useState<GameDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!token) return;
    api.admin.games
      .all({ page: 1, pageSize: 100, search: debouncedSearch || undefined }, token)
      .then((r) => setGames(r.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, debouncedSearch]);

  const handleDelete = async (g: GameDto) => {
    if (!token || !g.isActive) return;
    if (!confirm(`Ẩn game "${g.title}"? Game sẽ chuyển trạng thái ẩn trên kho game.`)) return;
    try {
      await api.admin.games.delete(g.id, token);
      setGames((list) => list.map((x) => (x.id === g.id ? { ...x, isActive: false } : x)));
      toast(`Đã ẩn game "${g.title}"`, "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    }
  };

  const handleRestore = async (g: GameDto) => {
    if (!token) return;
    try {
      await api.admin.games.restore(g.id, token);
      setGames((list) => list.map((x) => (x.id === g.id ? { ...x, isActive: true } : x)));
      toast("Đã khôi phục game");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Game</h1>
          <p className="text-sm text-ink-soft">
            {games.length} game
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm game..."
            className="h-10 w-56 rounded-lg border border-edge bg-surface px-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
          />
          <button
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            + Thêm game
          </button>
        </div>
      </div>

      {showForm && (
        <GameForm
          token={token!}
          editingId={editingId}
          games={games}
          onSaved={(game, isEdit) => {
            if (isEdit) {
              setGames((list) => list.map((x) => (x.id === game.id ? game : x)));
            } else {
              setGames((list) => [game, ...list]);
            }
            setShowForm(false);
            setEditingId(null);
            toast(isEdit ? "Đã cập nhật game" : "Đã tạo game mới");
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      )}

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-danger">{error}</p>
      ) : loading ? (
        <SkeletonTable />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-edge bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-ink-soft">
                <th className="p-4 font-medium">Game</th>
                <th className="p-4 font-medium">Thể loại</th>
                <th className="p-4 font-medium">Giá</th>
                <th className="p-4 font-medium">Đánh giá</th>
                <th className="p-4 font-medium">Trạng thái</th>
                <th className="p-4 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <tr key={g.id} className="border-b border-edge/50 last:border-0">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                        <Image
                          src={g.coverImage}
                          alt={g.title}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-ink">{g.title}</p>
                        <p className="text-xs text-ink-soft">ID: {g.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-ink-soft">
                    {g.genres.slice(0, 2).join(", ") || "—"}
                  </td>
                  <td className="p-4">
                    {g.discountPrice != null ? (
                      <div>
                        <span className="font-semibold text-ink">
                          {formatPrice(g.discountPrice)}
                        </span>
                        <span className="ml-1.5 text-xs text-ink-soft line-through">
                          {formatPrice(g.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="font-semibold text-ink">{formatPrice(g.price)}</span>
                    )}
                  </td>
                  <td className="p-4 text-ink-soft">{g.rating.toFixed(1)} ({g.ratingCount})</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        g.isActive
                          ? "bg-accent/15 text-accent"
                          : "bg-danger/15 text-danger"
                      )}
                    >
                      {g.isActive ? "Hiện" : "Ẩn"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1.5">
                      {g.isActive ? (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(g.id);
                              setShowForm(true);
                            }}
                            className="rounded-lg border border-edge px-2.5 py-1 text-xs font-semibold text-ink transition hover:bg-surface-2"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(g)}
                            className="rounded-lg border border-danger/40 px-2.5 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10"
                          >
                            Ẩn
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestore(g)}
                          className="rounded-lg border border-accent/40 px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent/10"
                        >
                          Khôi phục
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-shimmer h-16 rounded-2xl" />
      ))}
    </div>
  );
}

function CheckboxGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { id: number; name: string }[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            type="button"
            key={opt.id}
            onClick={() => onToggle(opt.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              selected.includes(opt.id)
                ? "border-accent bg-accent/15 text-accent"
                : "border-edge bg-surface-2 text-ink-soft hover:text-ink"
            )}
          >
            {opt.name}
          </button>
        ))}
        {options.length === 0 && (
          <span className="text-xs text-ink-soft">Chưa có dữ liệu</span>
        )}
      </div>
    </div>
  );
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Không đọc được file"));
    reader.readAsDataURL(file);
  });
}

function GameForm({
  token,
  editingId,
  games,
  onSaved,
  onCancel,
}: {
  token: string;
  editingId: number | null;
  games: GameDto[];
  onSaved: (game: GameDto, isEdit: boolean) => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [genres, setGenres] = useState<GenreDto[]>([]);
  const [platforms, setPlatforms] = useState<PlatformDto[]>([]);
  const [developers, setDevelopers] = useState<DeveloperDto[]>([]);
  const [publishers, setPublishers] = useState<PublisherDto[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const existing = editingId != null ? games.find((g) => g.id === editingId) : null;
  const isEdit = existing != null;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [price, setPrice] = useState(existing?.price.toString() ?? "0");
  const [discountPrice, setDiscountPrice] = useState(existing?.discountPrice?.toString() ?? "");
  const [coverImage, setCoverImage] = useState(existing?.coverImage ?? "");
  const [coverPreview, setCoverPreview] = useState(existing?.coverImage ?? "");
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>(existing?.images ?? []);
  const [galleryPreview, setGalleryPreview] = useState<string[]>([]);
  const MAX_GALLERY = 6;
  const [pendingGalleryFiles, setPendingGalleryFiles] = useState<File[]>([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState(existing?.trailerUrl ?? "");
  const [systemRequirements, setSystemRequirements] = useState(existing?.systemRequirements ?? "");

  const [genreIds, setGenreIds] = useState<number[]>([]);
  const [platformIds, setPlatformIds] = useState<number[]>([]);
  const [developerIds, setDeveloperIds] = useState<number[]>([]);
  const [publisherIds, setPublisherIds] = useState<number[]>([]);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.admin.genres.list(token),
      api.admin.platforms.list(token),
      api.admin.developers(token),
      api.admin.publishers(token),
    ]).then(([g, p, d, pb]) => {
      setGenres(g);
      setPlatforms(p);
      setDevelopers(d);
      setPublishers(pb);
      const cur = isEdit ? existing : null;
      if (cur) {
        setGenreIds(g.filter((x) => cur.genres.includes(x.name)).map((x) => x.id));
        setPlatformIds(p.filter((x) => cur.platforms.includes(x.name)).map((x) => x.id));
        setDeveloperIds(d.filter((x) => cur.developers.includes(x.name)).map((x) => x.id));
        setPublisherIds(pb.filter((x) => cur.publishers.includes(x.name)).map((x) => x.id));
      }
    });
  }, [token, existing, isEdit]);

  const toggle = (arr: number[], setArr: (v: number[]) => void, id: number) =>
    setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const handleGalleryFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const remaining = MAX_GALLERY - galleryImages.length - galleryPreview.length;
    if (remaining <= 0) {
      toast(`Tối đa ${MAX_GALLERY} hình ảnh gallery`, "error");
      return;
    }
    if (files.length > remaining) {
      toast(`Chỉ thêm được tối đa ${remaining} hình nữa`, "error");
    }
    const picked = files.slice(0, remaining);
    const previews = await Promise.all(
      picked.map((f) => readFileAsBase64(f).catch(() => ""))
    );
    const okFiles: File[] = [];
    const okPreviews: string[] = [];
    previews.forEach((p, i) => {
      if (p) {
        okFiles.push(picked[i]);
        okPreviews.push(p);
      }
    });
    setPendingGalleryFiles((list) => [...list, ...okFiles]);
    setGalleryPreview((list) => [...list, ...okPreviews]);
  };

  const removeGalleryImage = (index: number) => {
    if (index < galleryImages.length) {
      setGalleryImages((list) => list.filter((_, i) => i !== index));
    } else {
      const pendingIndex = index - galleryImages.length;
      setPendingGalleryFiles((list) => list.filter((_, i) => i !== pendingIndex));
      setGalleryPreview((list) => list.filter((_, i) => i !== pendingIndex));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast("Tên game không được trống", "error");
      return;
    }
    setSubmitting(true);
    try {
      let finalCoverImage = coverImage;
      if (pendingCoverFile) {
        setUploadingCover(true);
        try {
          finalCoverImage = await api.admin.files.upload(pendingCoverFile, token!);
        } catch {
          toast("Upload ảnh bìa thất bại", "error");
          setSubmitting(false);
          setUploadingCover(false);
          return;
        } finally {
          setUploadingCover(false);
        }
      }

      let finalGalleryImages = [...galleryImages];
      if (pendingGalleryFiles.length > 0) {
        setUploadingGallery(true);
        try {
          const uploadedUrls = await Promise.all(
            pendingGalleryFiles.map((f) => api.admin.files.upload(f, token!))
          );
          finalGalleryImages = [...finalGalleryImages, ...uploadedUrls];
        } catch {
          toast("Upload ảnh_gallery thất bại", "error");
          setSubmitting(false);
          setUploadingGallery(false);
          return;
        } finally {
          setUploadingGallery(false);
        }
      }

      const data = {
        title,
        description,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        releaseDate: null,
        coverImage: finalCoverImage,
        trailerUrl,
        systemRequirements,
        genreIds,
        platformIds,
        developerIds,
        publisherIds,
        images: finalGalleryImages,
      };
      let game: GameDto;
      if (editingId != null) {
        game = await api.admin.games.update(editingId, data, token);
      } else {
        game = await api.admin.games.create(data, token);
      }
      onSaved(game, editingId != null);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Có lỗi xảy ra", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-edge bg-surface p-6">
      <h2 className="mb-4 text-lg font-bold text-ink">
        {editingId != null ? "Sửa game" : "Thêm game mới"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Tên game *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Ảnh bìa (chọn file)</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!token) return;
                setCoverPreview(await readFileAsBase64(file).catch(() => ""));
                try {
                  const url = await api.admin.files.upload(file, token);
                  setCoverImage(url);
                  toast("Đã tải ảnh bìa lên backend");
                } catch {
                  setCoverImage("");
                  toast("Upload ảnh bìa thất bại", "error");
                }
                e.target.value = "";
              }}
              className="w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-accent/15 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-accent focus:border-accent focus:outline-none"
            />
            {coverPreview && (
              <img
                src={coverPreview}
                alt=""
                className="mt-2 h-32 w-full rounded-lg object-cover"
              />
            )}
            <label className="mt-1 block text-sm font-medium text-ink">Hoặc nhập URL ảnh bìa</label>
            <input
              value={coverImage.startsWith("data:") ? "" : coverImage}
              onChange={(e) => {
                setCoverImage(e.target.value);
                setCoverPreview(e.target.value);
              }}
              className="w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Giá ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Giá khuyến mãi ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              className="w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              placeholder="Để trống nếu không KM"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            Hình ảnh gallery (tối đa {MAX_GALLERY} hình)
          </label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[...galleryImages, ...galleryPreview].map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="relative aspect-video overflow-hidden rounded-lg border border-edge bg-surface-2"
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  title="Xóa hình"
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition hover:bg-danger"
                >
                  <X size={12} weight="bold" />
                </button>
              </div>
            ))}
            {galleryImages.length + galleryPreview.length < MAX_GALLERY && (
              <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-edge bg-surface-2 text-ink-soft transition hover:border-accent hover:text-accent">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryFiles}
                  className="hidden"
                />
                <span className="text-lg leading-none">+</span>
                <span className="text-[10px]">
                  {MAX_GALLERY - galleryImages.length - galleryPreview.length} chỗ
                </span>
              </label>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            Có thể chọn nhiều ảnh cùng lúc, tối đa{" "}
            {MAX_GALLERY - galleryImages.length - galleryPreview.length} hình còn lại.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Yêu cầu hệ thống</label>
          <input
            value={systemRequirements}
            onChange={(e) => setSystemRequirements(e.target.value)}
            className="w-full rounded-lg border border-edge bg-surface-2 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </div>
          
        <div className="grid gap-4 sm:grid-cols-2">
          <CheckboxGroup
            label="Thể loại"
            options={genres}
            selected={genreIds}
            onToggle={(id) => toggle(genreIds, setGenreIds, id)}
          />
          <CheckboxGroup
            label="Nền tảng"
            options={platforms}
            selected={platformIds}
            onToggle={(id) => toggle(platformIds, setPlatformIds, id)}
          />
          <CheckboxGroup
            label="Nhà phát triển"
            options={developers}
            selected={developerIds}
            onToggle={(id) => toggle(developerIds, setDeveloperIds, id)}
          />
          <CheckboxGroup
            label="Nhà phát hành"
            options={publishers}
            selected={publisherIds}
            onToggle={(id) => toggle(publisherIds, setPublisherIds, id)}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
          >
            {submitting ? "Đang lưu..." : editingId != null ? "Cập nhật" : "Tạo game"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-edge px-5 py-2 text-sm font-semibold text-ink-soft transition hover:bg-surface-2"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
