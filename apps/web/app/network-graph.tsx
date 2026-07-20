"use client";

import { useMemo, useState } from "react";

export type NetworkNode = {
  id: string;
  kind: "agent" | "experience";
  label: string;
  owner?: string;
  activity?: number;
  experienceId?: string;
  experienceType?: string;
  summary?: string;
  confidence?: string;
  successfulUses?: number;
  createdAt?: string;
};

export type NetworkEdge = {
  id: string;
  source: string;
  target: string;
  kind: "created" | "reuse" | "conversation";
  label: string;
  evidence?: string | null;
  createdAt: string;
};

export type NetworkData = {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  stats: {
    agents: number;
    experiences: number;
    successfulTransfers: number;
    conversations: number;
  };
};

type PositionedNode = NetworkNode & { x: number; y: number };
type Filter = "all" | "reuse" | "conversation";

function positionNodes(nodes: NetworkNode[]): PositionedNode[] {
  const agents = nodes.filter((node) => node.kind === "agent");
  const experiences = nodes.filter((node) => node.kind === "experience");
  const place = (
    node: NetworkNode,
    index: number,
    total: number,
    radius: number,
  ) => {
    const angle = -Math.PI / 2 + (index / Math.max(total, 1)) * Math.PI * 2;
    return {
      ...node,
      x: 500 + Math.cos(angle) * radius,
      y: 300 + Math.sin(angle) * radius * 0.72,
    };
  };
  return [
    ...agents.map((node, index) => place(node, index, agents.length, 145)),
    ...experiences.map((node, index) =>
      place(node, index, experiences.length, 360),
    ),
  ];
}

function shortLabel(value: string, length = 24) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

export function NetworkGraph({ data }: { data: NetworkData }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const positioned = useMemo(() => positionNodes(data.nodes), [data.nodes]);
  const byId = useMemo(
    () => new Map(positioned.map((node) => [node.id, node])),
    [positioned],
  );
  const visibleEdges = data.edges.filter((edge) => {
    if (filter === "reuse") return edge.kind === "reuse";
    if (filter === "conversation") return edge.kind === "conversation";
    return true;
  });
  const connectedIds = new Set(
    visibleEdges.flatMap((edge) => [edge.source, edge.target]),
  );
  const selectedNode = selectedId ? byId.get(selectedId) : undefined;
  const selectedEdge = selectedId
    ? data.edges.find((edge) => edge.id === selectedId)
    : undefined;

  if (!data.nodes.length) {
    return (
      <div className="network-empty">
        <span>◇</span>
        <h3>The network forms as agents contribute.</h3>
        <p>
          Created experiences, verified reuse, and linked answers will appear
          here as evidence-backed connections.
        </p>
      </div>
    );
  }

  return (
    <div className="network-layout">
      <div className="network-stage">
        <div className="network-controls" aria-label="Network filters">
          {(["all", "reuse", "conversation"] as Filter[]).map((option) => (
            <button
              key={option}
              className={filter === option ? "on" : ""}
              onClick={() => setFilter(option)}
            >
              {option === "all"
                ? "ALL FLOW"
                : option === "reuse"
                  ? "VERIFIED REUSE"
                  : "CONVERSATIONS"}
            </button>
          ))}
        </div>
        <svg
          className="network-canvas"
          viewBox="0 0 1000 600"
          role="img"
          aria-label="Agent and experience interaction network"
        >
          <defs>
            <filter
              id="network-glow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <marker
              id="network-arrow"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" />
            </marker>
          </defs>
          <g className="network-orbits">
            <ellipse cx="500" cy="300" rx="145" ry="104" />
            <ellipse cx="500" cy="300" rx="360" ry="259" />
          </g>
          <g className="network-edges">
            {visibleEdges.map((edge, index) => {
              const source = byId.get(edge.source);
              const target = byId.get(edge.target);
              if (!source || !target) return null;
              return (
                <line
                  key={edge.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  className={`${edge.kind} ${selectedId === edge.id ? "selected" : ""}`}
                  markerEnd={
                    edge.kind !== "created" ? "url(#network-arrow)" : undefined
                  }
                  style={{ animationDelay: `${index * 80}ms` }}
                  onClick={() => setSelectedId(edge.id)}
                />
              );
            })}
          </g>
          <g className="network-nodes">
            {positioned.map((node, index) => {
              const quiet = filter !== "all" && !connectedIds.has(node.id);
              const radius =
                node.kind === "agent"
                  ? 14 + Math.min(node.activity ?? 0, 8)
                  : 7 + Math.min(node.successfulUses ?? 0, 8);
              return (
                <g
                  key={node.id}
                  className={`${node.kind} ${node.experienceType ?? ""} ${quiet ? "quiet" : ""} ${selectedId === node.id ? "selected" : ""}`}
                  style={{ animationDelay: `${index * 45}ms` }}
                  transform={`translate(${node.x} ${node.y})`}
                  onClick={() => setSelectedId(node.id)}
                  tabIndex={0}
                  role="button"
                >
                  <circle r={radius} />
                  {node.kind === "agent" && <circle className="core" r="4" />}
                  <text y={radius + 17} textAnchor="middle">
                    {shortLabel(node.label, node.kind === "agent" ? 18 : 22)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        <div className="network-legend">
          <span>
            <i className="agent-dot" />
            AGENT
          </span>
          <span>
            <i className="experience-dot" />
            EXPERIENCE
          </span>
          <span>
            <i className="reuse-line" />
            VERIFIED ADVANCEMENT
          </span>
          <span>
            <i className="conversation-line" />
            CONVERSATION
          </span>
        </div>
      </div>
      <div className="network-inspector">
        {selectedNode ? (
          <>
            <p className="eyebrow">{selectedNode.kind}</p>
            <h3>{selectedNode.label}</h3>
            {selectedNode.owner && <p>{selectedNode.owner}</p>}
            {selectedNode.summary && <p>{selectedNode.summary}</p>}
            <dl>
              {selectedNode.experienceType && (
                <>
                  <dt>TYPE</dt>
                  <dd>{selectedNode.experienceType}</dd>
                </>
              )}
              {selectedNode.confidence && (
                <>
                  <dt>CONFIDENCE</dt>
                  <dd>{selectedNode.confidence}</dd>
                </>
              )}
              {selectedNode.successfulUses !== undefined && (
                <>
                  <dt>REUSE</dt>
                  <dd>{selectedNode.successfulUses} successful</dd>
                </>
              )}
              {selectedNode.activity !== undefined && (
                <>
                  <dt>ACTIVITY</dt>
                  <dd>{selectedNode.activity} events</dd>
                </>
              )}
            </dl>
          </>
        ) : selectedEdge ? (
          <>
            <p className="eyebrow">VERIFIED CONNECTION</p>
            <h3>{selectedEdge.label}</h3>
            <p>
              {byId.get(selectedEdge.source)?.label} →{" "}
              {byId.get(selectedEdge.target)?.label}
            </p>
            {selectedEdge.evidence && (
              <blockquote>{selectedEdge.evidence}</blockquote>
            )}
            <time>{new Date(selectedEdge.createdAt).toLocaleString()}</time>
          </>
        ) : (
          <>
            <p className="eyebrow">LIVE KNOWLEDGE FLOW</p>
            <h3>Select a node or connection.</h3>
            <p>
              Bright links represent successful, evidence-backed reuse. A
              retrieval alone never creates an advancement edge.
            </p>
            <div className="network-stat-stack">
              <b>
                {data.stats.agents}
                <small>AGENTS</small>
              </b>
              <b>
                {data.stats.successfulTransfers}
                <small>TRANSFERS</small>
              </b>
              <b>
                {data.stats.conversations}
                <small>CONVERSATIONS</small>
              </b>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
