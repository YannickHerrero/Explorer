import { memo } from "react";
import { Icon } from "@/icons/Icon";
import type { SidebarSection, SidebarItem, DensityTokens } from "@/types";

interface SidebarProps {
  width: number;
  activeId: string;
  onNavigate: (item: SidebarItem) => void;
  density: DensityTokens;
  sections: SidebarSection[];
}

export function Sidebar({ width, activeId, onNavigate, density, sections }: SidebarProps) {
  const data = sections;
  return (
    <div
      style={{
        width,
        flexShrink: 0,
        background: "var(--paper-alt)",
        borderRight: "1px solid var(--line)",
        overflow: "auto",
        padding: "8px 0 16px",
      }}
    >
      {data.map((section, si) => (
        <div key={si} style={{ marginBottom: 12 }}>
          {section.label && (
            <div
              style={{
                padding: `6px ${density.rowPad + 4}px 4px`,
                fontFamily: "var(--font-sans)",
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {section.label}
            </div>
          )}
          {section.items.map((item) => (
            <MemoSidebarRow
              key={item.id}
              item={item}
              active={activeId === item.id}
              onClick={() => onNavigate(item)}
              density={density}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const MemoSidebarRow = memo(SidebarRow);

function SidebarRow({
  item,
  active,
  onClick,
  density,
}: {
  item: SidebarItem;
  active: boolean;
  onClick: () => void;
  density: DensityTokens;
}) {
  return (
    <div
      onClick={onClick}
      className="sidebar-item"
      data-sidebar-id={item.id}
      data-disk-path={item.diskPath || ""}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: density.rowH - 2,
        margin: `1px ${density.rowPad - 2}px`,
        padding: "0 8px",
        borderRadius: 5,
        background: active ? "var(--accent)" : "transparent",
        color: active ? "var(--paper)" : "var(--ink-soft)",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontSize: density.fontBody - 0.5,
        fontWeight: active ? 500 : 400,
      }}
    >
      <span
        style={{
          color: active ? "var(--paper)" : item.color || "var(--muted)",
          display: "inline-flex",
        }}
      >
        {item.icon === "tag" ? (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: item.color,
              display: "inline-block",
              marginLeft: 2,
              marginRight: 2,
            }}
          />
        ) : (
          <Icon name={item.icon} size={14} />
        )}
      </span>
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {item.name}
      </span>
      {item.badge && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: active ? "var(--paper)" : "var(--muted)",
            opacity: active ? 0.8 : 1,
          }}
        >
          {item.badge}
        </span>
      )}
    </div>
  );
}
