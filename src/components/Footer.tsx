import PawPrint from "@/components/PawPrint";

export default function Footer() {
  return (
    <footer className="mt-auto border-t py-8 text-center text-sm text-muted">
      <p className="flex items-center justify-center gap-2 font-medium text-foreground">
        <PawPrint className="h-4 w-4 text-primary" />
        Made with love, for every dog that doesn&apos;t have an address.
      </p>
      <p className="mt-2 text-xs">
        Dog photography via{" "}
        <a
          href="https://commons.wikimedia.org"
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          Wikimedia Commons
        </a>{" "}
        (CC BY-SA).
      </p>
    </footer>
  );
}
