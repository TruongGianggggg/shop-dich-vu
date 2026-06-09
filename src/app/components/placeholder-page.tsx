import Link from "next/link";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <main className="page-shell py-14">
      <Link className="nav-link" href="/">
        Về trang chủ
      </Link>
      <section className="dashboard-hero">
        <p className="section-kicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
    </main>
  );
}
