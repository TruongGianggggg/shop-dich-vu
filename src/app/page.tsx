import Link from "next/link";
import { AccountActions } from "@/app/components/account-actions";
import { DepositQrButton } from "@/app/components/deposit-qr-button";
import { fetchBackendJson } from "@/lib/backend";
import {
  FeaturedPackage,
  ServiceCategory,
  ServicePackage,
  formatVnd,
  sampleCategories,
  samplePackages,
} from "@/lib/shop-api";

async function getHomeData() {
  try {
    const categories = await fetchBackendJson<ServiceCategory[]>(
      "/api/service-categories",
    );
    const activeCategories = categories
      .filter((category) => category.active)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    const activeSubCategories = activeCategories
      .flatMap((category) =>
        category.children
          .filter((child) => child.active)
          .map((child) => ({ category, child })),
      )
      .sort((a, b) => a.child.displayOrder - b.child.displayOrder)
      .slice(0, 6);

    const packageGroups = await Promise.all(
      activeSubCategories.map(async ({ category, child }) => {
        try {
          const packages = await fetchBackendJson<ServicePackage[]>(
            `/api/service-sub-categories/${child.id}/packages`,
          );

          return packages
            .filter((item) => item.active)
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .slice(0, 2)
            .map((item) => ({
              ...item,
              categoryName: category.name,
              subCategoryName: child.name,
            }));
        } catch {
          return [];
        }
      }),
    );
    const packages = packageGroups.flat().slice(0, 6);

    return {
      categories: activeCategories.length ? activeCategories : sampleCategories,
      packages: packages.length ? packages : samplePackages,
      isFallback: false,
    };
  } catch {
    return {
      categories: sampleCategories,
      packages: samplePackages,
      isFallback: true,
    };
  }
}

export default async function Home() {
  const { categories, packages, isFallback } = await getHomeData();
  const serviceCount = categories.reduce(
    (total, category) =>
      total + category.children.filter((child) => child.active).length,
    0,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="site-header">
        <Link className="brand-mark" href="/">
          <span className="brand-symbol">SG</span>
          <span>
            <strong>Shop Game</strong>
            <small>Dich vu game nhanh gon</small>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <a href="#services">Dich vu</a>
          <a href="#packages">Goi noi bat</a>
          <a href="#workflow">Quy trinh</a>
          <DepositQrButton />
        </nav>
        <AccountActions />
      </header>

      <main>
        <section className="hero-section">
          <div className="page-shell grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="max-w-2xl">
              <p className="section-kicker">Shop game tu dong theo API</p>
              <h1 className="mt-4 text-5xl font-black leading-[1.05] text-slate-950 sm:text-6xl">
                Nap game va dat dich vu chi trong vai buoc.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-650">
                Trang chu lay danh muc va goi dich vu tu backend Spring Boot.
                Khach hang dat don, admin quan tri, cong tac vien xu ly don theo
                dung phan quyen JWT.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link className="primary-button h-12 px-6" href="/login">
                  Dang nhap de mua
                </Link>
                <a className="ghost-button h-12 px-6" href="#packages">
                  Xem goi dich vu
                </a>
              </div>
              <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
                <StatCard label="Danh muc" value={categories.length} />
                <StatCard label="Dich vu" value={serviceCount} />
                <StatCard label="Goi ban" value={packages.length} />
              </div>
            </div>

            <div className="shop-visual" aria-label="Bang dich vu shop game">
              <div className="visual-topbar">
                <span />
                <span />
                <span />
              </div>
              <div className="visual-card visual-card-main">
                <p className="text-sm font-semibold text-emerald-100">
                  Don hang moi
                </p>
                <h2>{packages[0]?.name ?? "Goi dich vu"}</h2>
                <p>{packages[0]?.subCategoryName ?? "Nap game"}</p>
                <strong>{formatVnd(packages[0]?.price ?? 25000)}</strong>
              </div>
              <div className="visual-grid">
                {packages.slice(0, 4).map((item) => (
                  <div className="visual-tile" key={item.id}>
                    <span>{item.subCategoryName.slice(0, 2).toUpperCase()}</span>
                    <p>{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {isFallback ? (
          <div className="page-shell pt-8">
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Dang hien thi du lieu mau vi chua ket noi duoc backend tai{" "}
              <code>http://localhost:8080</code>.
            </div>
          </div>
        ) : null}

        <section className="page-section" id="services">
          <div className="page-shell">
            <div className="section-heading">
              <p className="section-kicker">Danh muc shop</p>
              <h2>Dich vu dang mo ban</h2>
            </div>
            <div className="service-grid">
              {categories.map((category) => (
                <article className="service-card" key={category.id}>
                  <p className="text-sm font-semibold text-emerald-700">
                    {category.children.filter((child) => child.active).length}{" "}
                    dich vu
                  </p>
                  <h3>{category.name}</h3>
                  <p>{category.description ?? "Danh muc dich vu shop game."}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {category.children
                      .filter((child) => child.active)
                      .slice(0, 4)
                      .map((child) => (
                        <span className="service-chip" key={child.id}>
                          {child.name}
                        </span>
                      ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="page-section bg-white" id="packages">
          <div className="page-shell">
            <div className="section-heading">
              <p className="section-kicker">Goi noi bat</p>
              <h2>San pham de khach mua nhanh</h2>
            </div>
            <div className="package-grid">
              {packages.map((item) => (
                <PackageCard item={item} key={item.id} />
              ))}
            </div>
          </div>
        </section>

        <section className="page-section" id="workflow">
          <div className="page-shell">
            <div className="workflow-band">
              <div>
                <p className="section-kicker">Phan quyen</p>
                <h2>Dang nhap xong se ve dung khu vuc</h2>
              </div>
              <div className="workflow-list">
                <p>
                  <strong>Admin</strong>
                  <span>Co nut vao trang admin de quan tri shop.</span>
                </p>
                <p>
                  <strong>Cong tac vien</strong>
                  <span>Co nut vao khu cong tac vien de xu ly don.</span>
                </p>
                <p>
                  <strong>User</strong>
                  <span>Dang nhap xong quay ve trang chu de mua dich vu.</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PackageCard({ item }: { item: FeaturedPackage }) {
  return (
    <article className="package-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {item.categoryName}
          </p>
          <h3>{item.name}</h3>
        </div>
        <span className="package-badge">{item.subCategoryName}</span>
      </div>
      <p className="mt-4 min-h-12 text-sm leading-6 text-slate-600">
        {item.description ?? "Goi dich vu dang hoat dong tren shop."}
      </p>
      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          {item.originalPrice ? (
            <p className="text-sm text-slate-400 line-through">
              {formatVnd(item.originalPrice)}
            </p>
          ) : null}
          <strong className="text-2xl font-black text-slate-950">
            {formatVnd(item.price)}
          </strong>
        </div>
        <Link className="ghost-button h-10 px-4 text-sm" href="/login">
          Mua ngay
        </Link>
      </div>
    </article>
  );
}
