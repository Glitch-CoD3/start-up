import { SlidersHorizontal } from 'lucide-react'

export default function Filters({
  categories,
  category,
  sort,
  onlyAvailable,
  count,
  loading,
  onCategoryChange,
  onSortChange,
  onAvailabilityChange,
}) {
  return (
    <div className="shop-toolbar">
      <div className="shop-toolbar__count">
        <SlidersHorizontal size={17} />
        <span>{loading ? 'Finding your favorites…' : `${count} pieces to love`}</span>
      </div>
      <div className="shop-toolbar__filters">
        <label>
          <span className="sr-only">Filter by category</span>
          <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug || item.name.toLowerCase()}>{item.name}</option>
            ))}
          </select>
        </label>
        <label className="availability-filter">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(event) => onAvailabilityChange(event.target.checked)}
          />
          In stock
        </label>
        <label>
          <span className="sr-only">Sort products</span>
          <select value={sort} onChange={(event) => onSortChange(event.target.value)}>
            <option value="featured">Sort: Featured</option>
            <option value="newest">Sort: Newest</option>
            <option value="price-low">Price: Low to high</option>
            <option value="price-high">Price: High to low</option>
          </select>
        </label>
      </div>
    </div>
  )
}
