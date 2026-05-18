// src/components/ui/CardSkeleton.jsx

function SkeletonLine({ w = "100%", h = 12, radius = 8, mb = 0 }) {
  return (
    <div
      className="lpShimmer"
      style={{ width: w, height: h, borderRadius: radius, marginBottom: mb, flexShrink: 0 }}
    />
  );
}

export function CardSkeleton({ count = 6, columns = "repeat(auto-fill, minmax(240px, 1fr))", gap = 12 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: columns, gap, marginTop: 14 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="lpSkeletonCard">
          {/* header: icon + name */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <SkeletonLine w={44} h={44} radius={12} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
              <SkeletonLine w="72%" h={14} />
              <SkeletonLine w="44%" h={11} />
            </div>
          </div>
          {/* meta pills */}
          <div style={{ display: "flex", gap: 8 }}>
            <SkeletonLine w={72} h={26} radius={999} />
            <SkeletonLine w={88} h={26} radius={999} />
          </div>
          {/* footer bar */}
          <SkeletonLine w="100%" h={10} radius={6} />
        </div>
      ))}
    </div>
  );
}

export function RouteSkeleton({ count = 4 }) {
  return (
    <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="lpSkeletonCard" style={{ borderRadius: 18, gap: 14 }}>
          {/* group header */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <SkeletonLine w={44} h={44} radius={12} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <SkeletonLine w="55%" h={14} />
              <SkeletonLine w="30%" h={11} />
            </div>
          </div>
          {/* route rows */}
          <div style={{ display: "grid", gap: 10 }}>
            {[0, 1].map((j) => (
              <div key={j} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <SkeletonLine w="60%" h={12} />
                <SkeletonLine w={60} h={24} radius={999} />
                <SkeletonLine w={60} h={24} radius={999} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function KpiSkeleton({ count = 4 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginTop: 14 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="lpSkeletonCard" style={{ minHeight: 80, justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <SkeletonLine w={48} h={48} radius={14} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <SkeletonLine w="55%" h={28} />
              <SkeletonLine w="70%" h={10} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
