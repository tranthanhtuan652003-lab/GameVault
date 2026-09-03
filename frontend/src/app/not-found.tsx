import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-28 text-center">
      <h1 className="text-6xl font-extrabold tracking-tight text-ink">404</h1>
      <p className="mt-3 text-ink-soft">
        Không tìm thấy trang hoặc game bạn đang tìm.
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-6 font-semibold text-gray-950 transition hover:bg-accent-strong"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
