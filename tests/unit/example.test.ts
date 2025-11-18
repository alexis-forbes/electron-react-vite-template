import { describe, expect, it } from "vitest";

describe("example unit test", () => {
  it("adds two numbers", () => {
    const add = (a: number, b: number) => a + b;

    expect(add(2, 3)).toBe(5);
  });
});
