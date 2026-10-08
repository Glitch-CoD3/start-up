import { ArrowDownRight, ArrowRight, BadgeCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductGrid from '../components/ProductGrid'
import { useCatalog } from '../../../app/providers'

export default function HomePage() {
  const { products, categories, featureImages, featuredImagePath, homepageContent, loading, error } = useCatalog()
  const feature = products[0]
  const selectedFeatureImage = featureImages.find((image) => image.path === featuredImagePath)
  const heroImage = selectedFeatureImage?.url || featureImages?.[0]?.url || feature?.image
  const categoryProducts = categories.slice(0, 4)

  return (
    <>
      <section className="hero">
        <div className="hero__copy">
          <span className="eyebrow hero__eyebrow"><span className="status-dot" /> {homepageContent.heroEyebrow}</span>
          <h1>{homepageContent.heroHeading}<br /><em>{homepageContent.heroEmphasis}</em></h1>
          <p>{homepageContent.heroDescription}</p>
          <Link className="button button--dark" to="/shop">
            {homepageContent.heroCta} <ArrowRight size={17} />
          </Link>
          <a className="hero__scroll" href="#collection"><ArrowDownRight size={16} /> {homepageContent.heroScroll}</a>
        </div>
        <div className="hero__visual">
          {heroImage ? (
            <img className="hero__image" src={heroImage} alt={selectedFeatureImage || featureImages?.[0] ? 'Featured collection' : feature?.name} />
          ) : (
            <div className="hero__image hero__image--art" aria-hidden="true">
              <span className="hero-art__sun" />
              <span className="hero-art__shape" />
              <span className="hero-art__line">{homepageContent.heroArtwork.split('\n').map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</span>
            </div>
          )}
          <div className="hero__sticker"><span>{homepageContent.heroSticker.split('\n').map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</span><span>✳</span></div>
          <div className="hero__caption">
            <span className="eyebrow">{homepageContent.heroCaption}</span>
            <span>01 / 04</span>
          </div>
        </div>
        <span className="hero__index">{homepageContent.heroIndex}</span>
      </section>

      <section className="service-strip" aria-label="Our promises">
        <div><Truck size={18} /><span>{homepageContent.serviceDelivery}</span></div>
        <div><BadgeCheck size={18} /><span>{homepageContent.servicePromise}</span></div>
        <div><span className="service-strip__star">✳</span><span>{homepageContent.serviceExchange}</span></div>
      </section>

      <section className="section category-section">
        <div className="section-heading">
          <div><span className="eyebrow">{homepageContent.categoryEyebrow}</span><h2>{homepageContent.categoryHeading} <em>{homepageContent.categoryEmphasis}</em></h2></div>
          <Link className="text-link" to="/shop">{homepageContent.categoriesCta} <ArrowRight size={15} /></Link>
        </div>
        {categoryProducts.length ? (
          <div className="category-grid">
            {categoryProducts.map((category, index) => {
              const image = products.find((product) => product.category_id === category.id)?.image
              return (
                <Link
                  className={`category-tile category-tile--${index + 1}`}
                  to={`/shop?category=${encodeURIComponent(category.slug || category.name.toLowerCase())}`}
                  key={category.id}
                >
                  {image && <img src={image} alt="" loading="lazy" />}
                  <span className="category-tile__number">0{index + 1}</span>
                  <span className="category-tile__name">{category.name}<ArrowRight size={17} /></span>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="category-placeholder">
            <span>{homepageContent.categoryEmpty}</span>
            <Link className="text-link" to="/shop">{homepageContent.browseCta} <ArrowRight size={15} /></Link>
          </div>
        )}
      </section>

      <section className="section collection-section" id="collection">
        <div className="section-heading">
          <div><span className="eyebrow">{homepageContent.collectionEyebrow}</span><h2>{homepageContent.collectionHeading} <em>{homepageContent.collectionEmphasis}</em></h2></div>
          <Link className="text-link" to="/shop?sort=newest">{homepageContent.collectionCta} <ArrowRight size={15} /></Link>
        </div>
        {error ? (
          <div className="notice notice--error" role="alert">
            <strong>We couldn’t load the collection.</strong>
            <span>{error}</span>
          </div>
        ) : loading ? (
          <div className="loading-row" aria-label="Loading products"><span /><span /><span /></div>
        ) : (
          <ProductGrid products={products.slice(0, 4)} />
        )}
      </section>

      <section className="manifesto">
        <div className="manifesto__mark">TL<span>.</span></div>
        <div>
          <span className="eyebrow">{homepageContent.manifestoEyebrow}</span>
          <p>{homepageContent.manifestoText} <em>{homepageContent.manifestoEmphasis}</em></p>
        </div>
        <Link className="button button--outline" to="/shop">{homepageContent.manifestoCta} <ArrowRight size={16} /></Link>
      </section>
    </>
  )
}