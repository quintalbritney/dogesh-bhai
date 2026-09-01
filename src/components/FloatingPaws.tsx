import PawPrint from "@/components/PawPrint";

// Purely decorative paw prints scattered down the left/right margins, to
// fill the empty space beside narrow, centered page content on wide
// screens. Fixed to the viewport (not the page), low-opacity, and hidden
// below lg since there's no side whitespace to fill on narrower layouts.
const PAWS: { top: string; side: "left" | "right"; inset: string; size: number; rotate: number; delay: number }[] = [
  { top: "8%", side: "left", inset: "2%", size: 26, rotate: -18, delay: 0 },
  { top: "18%", side: "right", inset: "4%", size: 34, rotate: 14, delay: 0.6 },
  { top: "34%", side: "left", inset: "5%", size: 20, rotate: 10, delay: 1.2 },
  { top: "46%", side: "right", inset: "2%", size: 24, rotate: -12, delay: 0.3 },
  { top: "60%", side: "left", inset: "3%", size: 30, rotate: 22, delay: 0.9 },
  { top: "72%", side: "right", inset: "5%", size: 22, rotate: -8, delay: 1.5 },
  { top: "86%", side: "left", inset: "4%", size: 26, rotate: 16, delay: 0.2 },
  { top: "92%", side: "right", inset: "3%", size: 20, rotate: -20, delay: 1.1 },
];

export default function FloatingPaws() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden lg:block"
    >
      {PAWS.map((paw, i) => (
        <div
          key={i}
          className="paw-float absolute text-primary/15"
          style={
            {
              top: paw.top,
              [paw.side]: paw.inset,
              width: paw.size,
              height: paw.size,
              animationDelay: `${paw.delay}s`,
              "--rot": `${paw.rotate}deg`,
            } as React.CSSProperties
          }
        >
          <PawPrint className="h-full w-full" />
        </div>
      ))}
    </div>
  );
}
