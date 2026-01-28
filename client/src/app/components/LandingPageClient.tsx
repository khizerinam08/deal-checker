"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "../page.module.css";
import { ReactNode, useState } from "react";
import { AnimatedSection } from "./AnimatedSection";

interface LandingPageClientProps {
    navbar: ReactNode;
}

export function LandingPageClient({ navbar }: LandingPageClientProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const scrollToVendors = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const vendorsSection = document.getElementById("vendors");
        if (!vendorsSection) return;

        const targetPosition = vendorsSection.getBoundingClientRect().top + window.scrollY;
        const startPosition = window.scrollY;
        const distance = targetPosition - startPosition;
        const duration = 800; // ms
        let startTime: number | null = null;

        function animation(currentTime: number) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function easeInOutQuad(t: number, b: number, c: number, d: number) {
            t /= d / 2;
            if (t < 1) return (c / 2) * t * t + b;
            t--;
            return (-c / 2) * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
    };

    return (
        <div className={styles.container}>
            {/* Shared Navbar - passed as prop to keep it server-rendered */}
            {navbar}

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
                    <a
                        href="#vendors"
                        onClick={scrollToVendors}
                        className={styles.ctaButton}
                    >
                        Find Deals
                    </a>
                    <p className={styles.heroSubtitle}>Decided by people, not ads.</p>
                </div>
            </section>

            {/* How It Works Section */}
            <section className={styles.howItWorks}>
                <div className={styles.howItWorksGrid}>
                    {/* Row 1 */}
                    {/* Card 1: Determine eater type - Top Left */}
                    <AnimatedSection className={`${styles.gridCell} ${styles.cardOne}`} animation="fadeInLeft">
                        <div className={styles.cardWrapper}>
                            <h3 className={`${styles.TitleOne} ${styles.cardTitle}`}>
                                Determine your eater type!
                            </h3>
                            <Image
                                src="/card1.png"
                                alt="Determine your eater type"
                                width={326}
                                height={367}
                                unoptimized
                                className={`${styles.cardSvg} ${styles.cardTiltLeft} ${styles.cardOneImage}`}
                            />
                        </div>
                    </AnimatedSection>

                    {/* Arrow 1 - Top Center */}
                    <AnimatedSection className={`${styles.gridCell} ${styles.arrowCell}`} animation="fadeIn" delay={200}>
                        <Image
                            src="/52b15432328a16aabeec908ce6c9f0f88b120300.svg"
                            alt=""
                            width={300}
                            height={209}
                            unoptimized
                            className={`${styles.arrowSvg} ${styles.arrowTiltFirst}`}
                        />
                    </AnimatedSection>

                    {/* Empty cell - Top Right */}
                    <div className={`${styles.gridCell} ${styles.emptyCell}`}></div>

                    {/* Row 2 */}
                    {/* Card 3: Add reviews - Bottom Left */}
                    <AnimatedSection className={`${styles.gridCell} ${styles.cardThree}`} animation="fadeInUp" delay={800}>
                        <div className={styles.cardWrapper}>
                            <h3 className={`${styles.TitleThree} ${styles.cardTitle}`}>
                                Add reviews!
                            </h3>
                            <Image
                                src="/card3.png"
                                alt="Add reviews"
                                width={339}
                                height={291}
                                unoptimized
                                className={`${styles.cardSvg} ${styles.cardTiltLeft} ${styles.addReviews}`}
                            />
                        </div>
                    </AnimatedSection>

                    {/* Arrow 2 - Bottom Center (Flipped) */}
                    <AnimatedSection className={`${styles.gridCell} ${styles.arrowCell}`} animation="fadeIn" delay={600}>
                        <Image
                            src="/2dc7016a41670bd40312673bc9e139c6771e50d4.svg"
                            alt=""
                            width={363}
                            height={199}
                            unoptimized
                            className={`${styles.arrowSvg} ${styles.arrowFlipped}`}
                        />
                    </AnimatedSection>

                    {/* Card 2: Deal card - Bottom Right (Tilted and moved up) */}
                    <AnimatedSection className={`${styles.gridCell} ${styles.cardTwo}`} animation="fadeInRight" delay={400}>
                        <div
                            className={`${styles.cardWrapper} ${styles.cardWrapperOverlay}`}
                        >
                            <h3 className={`${styles.cardTitle} ${styles.cardTitleOverlay}`}>
                                Is it worth the money?
                            </h3>
                            <Image
                                src="/card2.png"
                                alt="Is it worth the money?"
                                width={352}
                                height={431}
                                unoptimized
                                className={`${styles.cardSvg} ${styles.cardTiltRight}`}
                            />
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Vendors Section */}
            <section className={styles.vendors} id="vendors">
                <AnimatedSection className={styles.vendorsHeader} animation="fadeInDown">
                    <Image
                        src="/16f9ab967cbce42494ec5b8781bff582b574cc35.svg"
                        alt=""
                        width={100}
                        height={60}
                        unoptimized
                        className={styles.vendorArrowLeft}
                    />
                    <h2 className={styles.vendorsTitle}>Vendors</h2>
                    <Image
                        src="/16f9ab967cbce42494ec5b8781bff582b574cc35.svg"
                        alt=""
                        width={100}
                        height={60}
                        unoptimized
                        className={styles.vendorArrowRight}
                    />
                </AnimatedSection>

                <AnimatedSection animation="scaleIn" delay={200}>
                    <Link
                        href="/dominos-deals"
                        className={styles.vendorCard}
                        onClick={(e) => {
                            // If we want to show a spinner, we can just set state.
                            // The navigation will proceed.
                            if (!isLoading) {
                                setIsLoading(true);
                            }
                        }}
                    >
                        {isLoading ? (
                            <div className={styles.spinnerWrapper}>
                                <div className={styles.spinner}></div>
                                <p className={styles.spinnerText}>This might take a while...</p>
                            </div>
                        ) : (
                            <>
                                <Image
                                    src="/5bd84c2b7ef57e7bf4b668b69fce25bc47004897.png"
                                    alt="Domino's Pizza"
                                    width={240}
                                    height={240}
                                    className={styles.vendorLogo}
                                />
                                <span className={styles.vendorName}>Domino&apos;s</span>
                            </>
                        )}
                    </Link>
                </AnimatedSection>
            </section>

            {/* Footer Watermark */}
            <footer className={styles.footer}>
                <span className={styles.watermarkIcon}>?</span>
                <span className={styles.watermarkText}>WorthIt</span>
            </footer>
        </div>
    );
}
