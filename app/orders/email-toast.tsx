"use client";
import { useEffect } from "react";
export function EmailToast({ message, success, onClose }: { message: string; success: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [message, success, onClose]);

  return <div className={`email-toast ${success ? "email-toast-success" : ""}`}>
    <p role={success ? "status" : "alert"}>{message}</p><button type="button" aria-label="Dismiss email message" onClick={onClose}>×</button>
    {success && <div className="email-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ left: `${index * 5.5}%`, backgroundColor: ["#ffc45c", "#165bac", "#ea8740"][index % 3], animationDelay: `${index % 4 * 0.06}s`, transform: `rotate(${index * 31}deg)` }} />)}</div>}
  </div>;
}
