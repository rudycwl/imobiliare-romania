import Link from "next/link";

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav className="breadcrumbs">
      <Link href="/">Acasă</Link>
      {items.map((i) => (
        <span key={i.label}>
          {" / "}
          {i.href ? <Link href={i.href}>{i.label}</Link> : i.label}
        </span>
      ))}
    </nav>
  );
}
