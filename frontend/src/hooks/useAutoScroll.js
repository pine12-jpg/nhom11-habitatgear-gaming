import { useEffect } from "react";

/**
 * useAutoScroll — tự cuộn ngang một phần tử qua lại (tới cuối thì quay đầu, tới đầu thì quay lại).
 *
 * - Rê chuột / focus bàn phím vào bên trong: tạm dừng để khách bấm cho dễ.
 * - Khách tự kéo, vuốt, lăn chuột (hoặc nơi khác đổi vị trí cuộn): nhường quyền và dừng thêm vài giây.
 * - Bật "giảm chuyển động" trong hệ điều hành: không tự chạy.
 * - Chỉ chạy khi nội dung thật sự tràn khung.
 */
export default function useAutoScroll(ref, { speed = 28, edgePause = 1200, resumeDelay = 2500 } = {}) {
  useEffect(() => {
    const box = ref.current;
    if (!box) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;

    let raf = 0;
    let pos = box.scrollLeft; // lưu số lẻ vì scrollLeft của trình duyệt có thể bị làm tròn
    let lastSet = pos;
    let dir = 1;
    let last = performance.now();
    let holdUntil = 0;
    let hovering = false;

    const hold = (ms) => {
      holdUntil = Math.max(holdUntil, performance.now() + ms);
    };

    const tick = (now) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const max = box.scrollWidth - box.clientWidth;

      // Vị trí cuộn bị đổi bởi người khác (kéo tay, vuốt, lăn chuột, cuộn tới mục đang chọn) -> nhường và dừng một lúc
      if (Math.abs(box.scrollLeft - Math.floor(lastSet)) > 2) {
        pos = box.scrollLeft;
        lastSet = pos;
        hold(resumeDelay);
      }

      if (max > 1 && !hovering && now >= holdUntil) {
        pos += (dir * speed * dt) / 1000;
        if (pos >= max) {
          pos = max;
          dir = -1;
          hold(edgePause);
        } else if (pos <= 0) {
          pos = 0;
          dir = 1;
          hold(edgePause);
        }
        box.scrollLeft = pos;
        lastSet = pos;
      }
      raf = requestAnimationFrame(tick);
    };

    const enter = () => { hovering = true; };
    const leave = () => { hovering = false; hold(600); };

    box.addEventListener("mouseenter", enter);
    box.addEventListener("mouseleave", leave);
    box.addEventListener("focusin", enter);
    box.addEventListener("focusout", leave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      box.removeEventListener("mouseenter", enter);
      box.removeEventListener("mouseleave", leave);
      box.removeEventListener("focusin", enter);
      box.removeEventListener("focusout", leave);
    };
  }, [ref, speed, edgePause, resumeDelay]);
}
