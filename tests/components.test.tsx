import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { decideTier } from "@/hooks/useDeviceDetect";
import { ContactForm } from "@/components/ui/ContactForm";
import { Navbar } from "@/components/ui/Navbar";
import { SectionIndicator } from "@/components/ui/SectionIndicator";
import { NAV_ITEMS, SECTIONS } from "@/lib/sectionData";

describe("decideTier", () => {
  const base = { width: 1440, reducedMotion: false, webgl2: true, saveData: false, cores: 8, memoryGb: 8, coarsePointer: false };
  it("gives desktops the full experience", () => expect(decideTier(base)).toBe("full"));
  it("respects reduced motion above all", () => expect(decideTier({ ...base, reducedMotion: true })).toBe("static"));
  it("falls back to 2D on phones / no WebGL / save-data", () => {
    expect(decideTier({ ...base, width: 390 })).toBe("fallback");
    expect(decideTier({ ...base, webgl2: false })).toBe("fallback");
    expect(decideTier({ ...base, saveData: true })).toBe("fallback");
  });
  it("uses the lite tier on tablets and weak hardware", () => {
    expect(decideTier({ ...base, width: 900 })).toBe("lite");
    expect(decideTier({ ...base, cores: 2 })).toBe("lite");
    expect(decideTier({ ...base, coarsePointer: true })).toBe("lite");
  });
});

describe("Navbar", () => {
  it("renders every primary nav item as a link to its section", () => {
    render(<Navbar />);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    NAV_ITEMS.forEach((item) => {
      const link = Array.from(nav.querySelectorAll("a")).find((a) => a.textContent === item.label);
      expect(link).toHaveAttribute("href", `#${item.id}`);
    });
  });

  it("links back to the home page from case-study pages", () => {
    render(<Navbar mode="page" />);
    expect(screen.getByRole("link", { name: "Work" })).toHaveAttribute("href", "/#work");
  });

  it("toggles the mobile menu with correct ARIA state", async () => {
    render(<Navbar />);
    const btn = screen.getByRole("button", { name: "Open menu" });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(btn);
    expect(screen.getByRole("dialog", { name: "Site menu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
  });
});

describe("SectionIndicator", () => {
  it("lists every journey section", () => {
    render(<SectionIndicator />);
    expect(screen.getAllByRole("link")).toHaveLength(SECTIONS.length);
  });
});

describe("ContactForm", () => {
  it("shows linked, announced errors and does not submit invalid data", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    render(<ContactForm />);
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));
    const name = screen.getByLabelText("Name");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription(/name/i);
    expect(spy).not.toHaveBeenCalled();
  });

  it("falls back to the mail client when sending isn't configured", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: false, code: "EMAIL_NOT_CONFIGURED", message: "x" }), { status: 503 }),
    );
    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello, I love the work." } });
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));
    await waitFor(() => expect(screen.getByRole("link", { name: /open your email app/i })).toHaveAttribute("href", expect.stringMatching(/^mailto:/)));
  });

  it("confirms success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello, I love the work." } });
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));
    expect(await screen.findByText(/on its way/i)).toBeInTheDocument();
  });
});
