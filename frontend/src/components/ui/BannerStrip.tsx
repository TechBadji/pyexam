import { useEffect, useState } from "react";
import api from "../../api/axios";

interface Banner {
  id: string;
  text: string;
  link_url: string | null;
  image_url: string | null;
}

/**
 * The promotional strip in the top bar. Rotates through the active banners,
 * and renders nothing at all when there are none — the bar must not look
 * broken on a fresh install.
 */
export default function BannerStrip() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .get<Banner[]>("/student/banners")
      .then(({ data }) => alive && setBanners(data))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % banners.length), 7000);
    return () => window.clearInterval(id);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[Math.min(index, banners.length - 1)];
  const body = (
    <span className="flex items-center gap-2.5 min-w-0">
      {banner.image_url && (
        <img
          src={banner.image_url}
          alt=""
          className="h-6 w-6 rounded object-cover shrink-0"
          loading="lazy"
        />
      )}
      <span className="truncate">{banner.text}</span>
    </span>
  );

  return (
    <div className="hidden md:flex flex-1 justify-center px-4 min-w-0">
      <div
        key={banner.id}
        className="animate-rise max-w-md w-full rounded-full bg-brand-50 dark:bg-brand-950/50 ring-1 ring-brand-200 dark:ring-brand-800 px-4 py-1.5 text-xs font-medium text-brand-800 dark:text-brand-200 min-w-0"
      >
        {banner.link_url ? (
          <a
            href={banner.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center hover:underline min-w-0"
          >
            {body}
          </a>
        ) : (
          <div className="flex items-center justify-center min-w-0">{body}</div>
        )}
      </div>
    </div>
  );
}
