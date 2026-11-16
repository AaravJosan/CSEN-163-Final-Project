export default function PlaceholderPage({ title, description }) {
  return (
    <section className="placeholder-page">
      <p className="eyebrow">Cellar Deals</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <p className="coming-soon">This page is a placeholder for future features.</p>
    </section>
  );
}
