"use client";

import React, { ReactNode, useEffect, useRef, useState, ElementType } from "react";
import styles from "./AnimatedSection.module.css";

type AnimationType =
    | "fadeIn"
    | "fadeInUp"
    | "fadeInDown"
    | "fadeInLeft"
    | "fadeInRight"
    | "scaleIn";

interface AnimatedSectionProps {
    children: ReactNode;
    animation?: AnimationType;
    delay?: number;
    threshold?: number;
    className?: string;
    as?: ElementType;
    id?: string;
}

export function AnimatedSection({
    children,
    animation = "fadeInUp",
    delay = 0,
    threshold = 0.1,
    className = "",
    as: Component = "div",
    id,
}: AnimatedSectionProps) {
    const ref = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold, rootMargin: "0px 0px -50px 0px" }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [threshold]);

    const animationClass = isVisible ? styles[animation] : styles.hidden;

    return (
        <Component
            ref={ref}
            id={id}
            className={`${styles.animatedSection} ${animationClass} ${className}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </Component>
    );
}
