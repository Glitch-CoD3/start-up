import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCatalog } from '../../../app/providers'
import Filters from '../components/Filters'
import ProductGrid from '../components/ProductGrid'

export default function ProductListPage() {
  const { products, categories, loading, error } = useCatalog()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const category = searchParams.get('category') ?? ''
  const sort = searchParams.get('sort') ?? 'featured'
  const onlyAvailable = searchParams.get('available') === 'true'

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const list = products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        `${product.name} ${product.category} ${product.brand} ${product.short_description ?? ''}`
          .toLowerCase()
          .includes(normalizedSearch)
      const matchesCategory =
        !category ||
        product.categorySlug.toLowerCase() === category.toLowerCase() ||
        product.category.toLowerCase() === category.toLowerCase()
      const matchesStock = !onlyAvailable || product.stock > 0
      return matchesSearch && matchesCategory && matchesStock
    })

    if (sort === 'newest') {
      return list.sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
    }
    if (sort === 'price-low') {
      return list.sort(
        (left, right) =>
          Number(left.variants[0]?.price ?? left.price) -
          Number(right.variants[0]?.price ?? right.price),
      )
    }
    if (sort === 'price-high') {
      return list.sort(
        (left, right) =>
          Number(right.variants[0]?.price ?? right.price) -
          Number(left.variants[0]?.price ?? left.price),
      )
    }
    return list
  }, [products, search, category, onlyAvailable, sort])

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  const heading = search
    ? `Results for “${search}”`
    : category
      ? categories.find((item) => item.slug === category)?.name ?? category
      : 'The collection'

  return (
    <section className="shop-page">
      <div className="shop-intro">
        <span className="eyebrow">Made to move with you</span>
        <h1>{heading}<span>.</span></h1>
        <p>The pieces you’ll reach for before you’ve even had your coffee.</p>
      </div>
      <Filters
        categories={categories}
        category={category}
        sort={sort}
        onlyAvailable={onlyAvailable}
        count={visibleProducts.length}
        loading={loading}
        onCategoryChange={(value) => updateFilter('category', value)}
        onSortChange={(value) => updateFilter('sort', value)}
        onAvailabilityChange={(value) => updateFilter('available', value ? 'true' : '')}
      />
      {error ? (
        <div className="notice notice--error" role="alert"><strong>Something went wrong.</strong><span>{error}</span></div>
      ) : loading ? (
        <div className="loading-row" aria-label="Loading products"><span /><span /><span /></div>
      ) : (
        <ProductGrid products={visibleProducts} />
      )}
    </section>
  )
}