import { ArrowDownRight, ArrowLeft, ArrowRight, BadgeCheck, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductGrid from '../components/ProductGrid'
import { useCatalog } from '../../../app/providers'

export default function HomePage() {
  const { products, categories, featureImages, featuredImagePath, homepageContent, loading, error } = useCatalog()
  const [activeHeroImageIndex, setActiveHeroImageIndex] = useState(0)
  const feature = products[0]
  const selectedFeatureImage = featureImages.find((image) => image.path === featuredImagePath)
  const useHeroSlider = homepageContent.heroImageMode === 'slider' && featureImages.length > 0
  const heroSlides = useHeroSlider
    ? featureImages
    : selectedFeatureImage
      ? [selectedFeatureImage]
      : featureImages.slice(0, 1)
  const currentHeroImageIndex = heroSlides.length
    ? activeHeroImageIndex % heroSlides.length
    : 0
  const activeHeroImage = heroSlides.length
    ? heroSlides[currentHeroImageIndex]
    : null
  const heroImage = activeHeroImage?.url || feature?.image
  const categoryProducts = categories.slice(0, 4)

  useEffect(() => {
    if (!useHeroSlider || heroSlides.length < 2) return undefined
    const timer = window.setInterval(() => {
      setActiveHeroImageIndex((index) => (index + 1) % heroSlides.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [heroSlides.length, useHeroSlider])

  const showHeroSlide = (index) => {
    setActiveHeroImageIndex((index + heroSlides.length) % heroSlides.length)
  }

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
          {useHeroSlider && heroSlides.length > 1 ? (
            <div
              className="hero-slider__track"
              style={{ transform: `translateX(-${currentHeroImageIndex * 100}%)` }}
              aria-live="off"
            >
              {heroSlides.map((image) => (
                <img className="hero__image" key={image.path} src={image.url} alt={image.name} />
              ))}
            </div>
          ) : heroImage ? (
            <img className="hero__image" src={heroImage} alt={activeHeroImage ? activeHeroImage.name : feature?.name || 'Featured collection'} />
          ) : (
            <div className="hero__image hero__image--art" aria-hidden="true">
              <span className="hero-art__sun" />
              <span className="hero-art__shape" />
              <span className="hero-art__line">{homepageContent.heroArtwork.split('\n').map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</span>
            </div>
          )}
          {useHeroSlider && heroSlides.length > 1 && (
            <>
              <button className="hero-slider__arrow hero-slider__arrow--previous" type="button" aria-label="Previous featured image" onClick={() => showHeroSlide(currentHeroImageIndex - 1)}>
                <ArrowLeft size={17} />
              </button>
              <button className="hero-slider__arrow hero-slider__arrow--next" type="button" aria-label="Next featured image" onClick={() => showHeroSlide(currentHeroImageIndex + 1)}>
                <ArrowRight size={17} />
              </button>
              <div className="hero-slider__dots" aria-label="Choose featured image">
                {heroSlides.map((image, index) => (
                  <button
                    className={`hero-slider__dot${index === currentHeroImageIndex ? ' is-active' : ''}`}
                    key={image.path}
                    type="button"
                    aria-label={`Show featured image ${index + 1}`}
                    aria-current={index === currentHeroImageIndex ? 'true' : undefined}
                    onClick={() => showHeroSlide(index)}
                  />
                ))}
              </div>
            </>
          )}
          <div className="hero__sticker"><span>{homepageContent.heroSticker.split('\n').map((line, index) => <span key={`${line}-${index}`}>{index > 0 && <br />}{line}</span>)}</span><span>✳</span></div>
          <div className="hero__caption">
            <span className="eyebrow">{homepageContent.heroCaption}</span>
            {useHeroSlider && heroSlides.length > 1 && (
              <span>{String(currentHeroImageIndex + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}</span>
            )}
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