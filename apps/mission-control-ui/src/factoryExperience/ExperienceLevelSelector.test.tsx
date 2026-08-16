import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExperienceLevelSelector } from "./ExperienceLevelSelector";

describe("ExperienceLevelSelector", () => {
  it("exposes three accessible presentation choices", () => {
    const onChange = vi.fn();
    render(<ExperienceLevelSelector value="basic" onChange={onChange} />);
    expect(screen.getByRole("button", { name: "Basic" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Intermediate" }));
    expect(onChange).toHaveBeenCalledWith("intermediate");
  });
});
