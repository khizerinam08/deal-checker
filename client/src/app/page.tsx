import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { Navbar } from "./components/navbar";

export default function Home() {
  return (
    <div className={styles.container}>
      {/* Shared Navbar - transparent on landing page */}
      <Navbar />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <Image
            src="/main-landing-page-image-1.png"
            alt="Balance scale with pizza and money"
            fill
            priority
            quality={100}
            unoptimized
            className={styles.heroImage}
          />
        </div>

        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Find Foods Your Wallet Loves.</h1>
          <Link href="/dominos-deals" className={styles.ctaButton}>
            Find Deals
          </Link>
          <p className={styles.heroSubtitle}>Decided by people, not ads.</p>
        </div>
      </section>



      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className={styles.howItWorksGrid}>
          {/* Row 1 */}
          {/* Card 1: Determine eater type - Top Left */}
          <div className={`${styles.gridCell} ${styles.cardOne}`}>
            <div className={styles.cardWrapper}>
              <h3 className={`${styles.TitleOne} ${styles.cardTitle}`}>Determine your eater type!</h3>
              <Image
                src="/d59dedb6438b59ec8687f96a015e1e8008b838b6.svg"
                alt="Determine your eater type"
                width={326}
                height={367}
                className={`${styles.cardSvg} ${styles.cardTiltLeft} ${styles.cardOneImage}`}
              />
            </div>
          </div>

          {/* Arrow 1 - Top Center */}
          <div className={`${styles.gridCell} ${styles.arrowCell}`}>
            <Image
              src="/52b15432328a16aabeec908ce6c9f0f88b120300.svg"
              alt=""
              width={300}
              height={209}
              className={`${styles.arrowSvg} ${styles.arrowTiltFirst}`}
            />
          </div>

          {/* Empty cell - Top Right */}
          <div className={`${styles.gridCell} ${styles.emptyCell}`}></div>

          {/* Row 2 */}
          {/* Card 3: Add reviews - Bottom Left */}
          <div className={`${styles.gridCell} ${styles.cardThree}`}>
            <div className={styles.cardWrapper}>
              <h3 className={`${styles.TitleThree} ${styles.cardTitle}`}>Add reviews!</h3>
              <Image
                src="/add-reviews.svg"
                alt="Add reviews"
                width={339}
                height={291}
                className={`${styles.cardSvg} ${styles.cardTiltLeft} ${styles.addReviews}`}
              />
            </div>
          </div>

          {/* Arrow 2 - Bottom Center (Flipped) */}
          <div className={`${styles.gridCell} ${styles.arrowCell}`}>
            <Image
              src="/2dc7016a41670bd40312673bc9e139c6771e50d4.svg"
              alt=""
              width={363}
              height={199}
              className={`${styles.arrowSvg} ${styles.arrowFlipped}`}
            />
          </div>

          {/* Card 2: Deal card - Bottom Right (Tilted and moved up) */}
          <div className={`${styles.gridCell} ${styles.cardTwo}`}>
            <div className={`${styles.cardWrapper} ${styles.cardWrapperOverlay}`}>
              <h3 className={`${styles.cardTitle} ${styles.cardTitleOverlay}`}>Is it worth the money?</h3>
              <Image
                src="/699218a76d449556ed6308e9cc8c14089cb08843.svg"
                alt="Is it worth the money?"
                width={352}
                height={431}
                className={`${styles.cardSvg} ${styles.cardTiltRight}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vendors Section */}
      <section className={styles.vendors}>
        <div className={styles.vendorsHeader}>
          <Image
            src="/16f9ab967cbce42494ec5b8781bff582b574cc35.svg"
            alt=""
            width={100}
            height={60}
            className={styles.vendorArrowLeft}
          />
          <h2 className={styles.vendorsTitle}>Vendors</h2>
          <Image
            src="/16f9ab967cbce42494ec5b8781bff582b574cc35.svg"
            alt=""
            width={100}
            height={60}
            className={styles.vendorArrowRight}
          />
        </div>

        <Link href="/dominos-deals" className={styles.vendorCard}>
          <Image
            src="/5bd84c2b7ef57e7bf4b668b69fce25bc47004897.png"
            alt="Domino's Pizza"
            width={240}
            height={240}
            className={styles.vendorLogo}
          />
          <span className={styles.vendorName}>Domino&apos;s</span>
        </Link>
      </section>

      {/* Footer Watermark */}
      <footer className={styles.footer}>
        <span className={styles.watermarkIcon}>?</span>
        <span className={styles.watermarkText}>WorthIt</span>
      </footer>
    </div>
  );
}
