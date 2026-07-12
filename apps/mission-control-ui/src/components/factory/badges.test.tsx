import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskBadge, ScoreBadge, StatusBadge, TrendBadge } from "./badges";

describe("StatusBadge", () => {
  it("renders children with the tone class", () => {
    render(<StatusBadge tone="success">Passed</StatusBadge>);
    const badge = screen.getByText("Passed");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("text-ok");
  });

  it("defaults to neutral tone", () => {
    render(<StatusBadge>Pending</StatusBadge>);
    expect(screen.getByText("Pending").className).toContain("text-ink-secondary");
  });
});

describe("RiskBadge", () => {
  it.each([
    ["LOW", "text-ok"],
    ["GREEN", "text-ok"],
    ["MEDIUM", "text-warn"],
    ["YELLOW", "text-warn"],
    ["HIGH", "text-err"],
    ["RED", "text-err"],
    ["CRITICAL", "text-err"],
  ] as const)("maps %s to the right tone", (level, cls) => {
    const { unmount } = render(<RiskBadge level={level} />);
    expect(screen.getByText(level).className).toContain(cls);
    unmount();
  });
});

describe("ScoreBadge", () => {
  it("uses green at 90+, yellow at 70–89, red below 70", () => {
    const { rerender } = render(<ScoreBadge score={94} />);
    expect(screen.getByRole("img").className).toContain("text-ok");
    rerender(<ScoreBadge score={79} />);
    expect(screen.getByRole("img").className).toContain("text-warn");
    rerender(<ScoreBadge score={42} />);
    expect(screen.getByRole("img").className).toContain("text-err");
  });

  it("exposes an accessible label and rounds the value", () => {
    render(<ScoreBadge score={91.6} />);
    const badge = screen.getByRole("img", { name: "Score 91.6 out of 100" });
    expect(badge).toHaveTextContent("92");
  });
});

describe("TrendBadge", () => {
  it("renders positive multipliers green with two decimals", () => {
    render(<TrendBadge multiplier={1.33} />);
    const badge = screen.getByText("1.33x");
    expect(badge.className).toContain("text-ok");
  });

  it("renders sub-1 multipliers red", () => {
    render(<TrendBadge multiplier={0.8} />);
    expect(screen.getByText("0.80x").className).toContain("text-err");
  });
});
