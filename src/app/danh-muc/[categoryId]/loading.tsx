export default function LoadingServiceCategory() {
  return (
    <main className="reference-main reference-category-loading" aria-busy="true">
      <div />
      <div className="reference-service-grid">
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    </main>
  );
}
