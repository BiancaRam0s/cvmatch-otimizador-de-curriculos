import { cn } from "@/lib/utils";

type ChameleonProps = {
  className?: string;
  mood?: "idle" | "waving" | "still";
  title?: string;
};

/** CVMatch mascot — a friendly blue chameleon drawn in SVG so it can wave and shift colors. */
export function Chameleon({ className, mood = "idle", title = "Camaleão do CVMatch" }: ChameleonProps) {
  return (
    <svg
      viewBox="0 0 210 200"
      role="img"
      aria-label={title}
      className={cn(mood === "waving" && "cham-waving", mood === "idle" && "cham-idle", className)}
    >
      <g className="cham-figure">
        {/* tail curl */}
        <path
          className="cham-tail"
          strokeWidth={15}
          d="M80 166 C 42 174, 20 144, 36 124 C 50 106, 78 114, 72 134 C 68 148, 50 147, 51 136"
        />
        {/* back leg */}
        <ellipse className="cham-shade" cx={84} cy={170} rx={13} ry={9} />

        {/* body */}
        <ellipse className="cham-body" cx={110} cy={145} rx={46} ry={35} />
        <ellipse className="cham-belly" cx={120} cy={156} rx={27} ry={20} />
        <circle className="cham-spot" cx={88} cy={130} r={5.5} />
        <circle className="cham-spot" cx={76} cy={149} r={4} />
        <circle className="cham-spot" cx={101} cy={121} r={3.5} />
        <circle className="cham-spot" cx={94} cy={160} r={3} />

        {/* front leg */}
        <ellipse className="cham-shade" cx={124} cy={177} rx={14} ry={8} />
        <circle className="cham-body" cx={115} cy={181} r={4} />
        <circle className="cham-body" cx={124} cy={183} r={4} />
        <circle className="cham-body" cx={133} cy={181} r={4} />

        {/* head */}
        <ellipse className="cham-body" cx={120} cy={88} rx={50} ry={43} />
        {/* casque */}
        <path
          className="cham-shade"
          d="M76 76 C 76 36, 126 22, 154 54 C 132 44, 102 48, 76 76 Z"
        />
        <path className="cham-line" strokeWidth={2.4} opacity={0.35} d="M92 54 Q 104 46 118 44" />
        <path className="cham-line" strokeWidth={2.4} opacity={0.35} d="M100 62 Q 114 54 130 54" />
        <circle className="cham-spot" cx={96} cy={96} r={5} />
        <circle className="cham-spot" cx={86} cy={84} r={3.2} />

        {/* eye turret */}
        <circle className="cham-shade" cx={141} cy={80} r={22} />
        <circle className="cham-body" cx={141} cy={79} r={19.5} />
        <circle className="cham-eye" cx={142} cy={79} r={13.5} />
        <circle className="cham-ink" cx={146} cy={80} r={7.5} />
        <circle className="cham-eye" cx={149} cy={76.5} r={2.6} />
        <ellipse className="cham-eyelid cham-body" cx={142} cy={79} rx={14.5} ry={14.5} />

        {/* face */}
        <circle className="cham-ink" cx={166} cy={88} r={1.6} />
        <ellipse className="cham-blush" cx={151} cy={106} rx={8} ry={4.5} />
        <path className="cham-line" strokeWidth={3.6} d="M126 108 Q 146 124 165 104" />

        {/* waving arm */}
        <g className="cham-arm">
          <path className="cham-tail" strokeWidth={12} d="M146 136 Q 168 132 184 120" />
          <circle className="cham-body" cx={187} cy={117} r={9.5} />
          <circle className="cham-body" cx={181} cy={105} r={4.6} />
          <circle className="cham-body" cx={190} cy={103} r={4.6} />
          <circle className="cham-body" cx={198} cy={110} r={4.6} />
          <circle className="cham-spot" cx={186} cy={117} r={3} />
        </g>
      </g>
    </svg>
  );
}
