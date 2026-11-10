"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import LiquidEther from "../LiquidEther/LiquidEther";

// Module-level constant so the array reference stays stable across renders
// (otherwise LiquidEther's useEffect would tear down/rebuild WebGL each render).
const HERO_LIQUID_COLORS = ["#D9E6FF"];

const HERO_IMAGES = {
  mobile: {
    dark: "/home-page-white(mobile).png",
    light: "/home-page-black(mobile).png",
  },
  desktop: {
    dark: "/new.png",
    light: "/home-page-hero-1.png",
  },
};

const SplitChars = ({ text, className, id }) => {
  return (
    <span className={className} id={id}>
      {text.split(" ").map((word, wordIndex) => (
        <React.Fragment key={wordIndex}>
          {wordIndex > 0 && <span className="hero-word-space">{" "}</span>}
          <span className="hero-word">
            {word.split("").map((char, charIndex) => (
              <span
                key={charIndex}
                className="hero-char"
                style={{ display: "inline-block" }}
              >
                {char}
              </span>
            ))}
          </span>
        </React.Fragment>
      ))}
    </span>
  );
};

const HeroSection = () => {
  const [isDarkTheme, setIsDarkTheme] = React.useState(false);
  const sectionRef = useRef(null);
  const imgRef = useRef(null);
  const headingRef = useRef(null);
  const headlineRef = useRef(null);
  const descriptionRef = useRef(null);
  const loaderRef = useRef(null);
  const loaderCounterRef = useRef(null);
  const stroke1Ref = useRef(null);
  const stroke2Ref = useRef(null);
  const parallaxInstanceRef = useRef(null);

  useLayoutEffect(() => {
    const syncTheme = () => {
      setIsDarkTheme(document.documentElement.dataset.theme === "dark");
    };
    const observer = new MutationObserver(syncTheme);

    syncTheme();
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = section?.querySelector(".hero-content");
    const image = imgRef.current;
    const navbar = document.querySelector(".navbar");
    if (!section || !content || !image) return;

    const positionContent = () => {
      // Use offsetHeight so scroll position does NOT alter coordinates
      const navHeight = navbar ? navbar.offsetHeight : 68;
      const contentHeight = content.offsetHeight || 120;
      const sectionHeight = section.clientHeight;
      const imageOffsetHeight = image.offsetHeight || sectionHeight * 0.6;
      const imageTop = sectionHeight - imageOffsetHeight;
      const availableSpace = imageTop - navHeight - contentHeight;

      let contentTop;
      if (window.matchMedia("(min-width: 1024px)").matches) {
        contentTop = navHeight + Math.max(0, availableSpace) / 2;
      } else {
        // On mobile, keep text securely anchored in the top hero zone beneath the navbar
        contentTop = availableSpace > 10 ? navHeight + availableSpace / 2 : navHeight + 12;
      }

      content.style.setProperty("--hero-content-top", `${Math.round(contentTop)}px`);
    };

    positionContent();
    const resizeObserver = new ResizeObserver(positionContent);
    resizeObserver.observe(section);
    resizeObserver.observe(content);
    resizeObserver.observe(image);
    if (navbar) resizeObserver.observe(navbar);
    window.addEventListener("resize", positionContent);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", positionContent);
      content.style.removeProperty("--hero-content-top");
    };
  }, []);

  useEffect(() => {
    const headingChars = headingRef.current.querySelectorAll(".hero-char");
    const headlineWords = headlineRef.current.querySelectorAll(".hero-headline-word");
    const descriptionLines = descriptionRef.current.querySelectorAll(".hero-description-line");
    const navbar = document.querySelector(".navbar");

    // Hide hero elements initially
    gsap.set(headingChars, { autoAlpha: 0, y: 100 });
    gsap.set(imgRef.current, { autoAlpha: 0, y: "50%", scale: 0.8 });
    gsap.set([stroke1Ref.current, stroke2Ref.current], { autoAlpha: 0, width: "0%" });
    gsap.set(navbar, { yPercent: -100, autoAlpha: 0 });
    gsap.set(headlineWords, { x: -28, autoAlpha: 0 });
    gsap.set(descriptionLines, { y: 18, autoAlpha: 0 });
    // iOS 13+ requires explicit permission to receive deviceorientation events.
    // parallax-js uses those events automatically on mobile (gyroscope mode),
    // so we ask for permission on the first user gesture.
    const requestGyroPermission = () => {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        DeviceOrientationEvent.requestPermission().catch(() => {});
      }
    };
    const handleFirstGesture = () => {
      requestGyroPermission();
      window.removeEventListener("touchstart", handleFirstGesture);
      window.removeEventListener("click", handleFirstGesture);
    };
    window.addEventListener("touchstart", handleFirstGesture, { once: true, passive: true });
    window.addEventListener("click", handleFirstGesture, { once: true });

    // Initialize wagerfield/parallax (parallax-js) after GSAP reveal finishes.
    // On touch devices we keep the gyroscope-driven motion, but soften the
    // movement so the hero still feels stable on phones.
    const initParallax = async () => {
      if (typeof window === "undefined" || !sectionRef.current) return;
      const isTouch =
        window.matchMedia("(hover: none), (pointer: coarse)").matches ||
        window.innerWidth < 1024;
      try {
        const mod = await import("parallax-js");
        const Parallax = mod.default || mod;
        if (!sectionRef.current) return;
        parallaxInstanceRef.current = new Parallax(sectionRef.current, {
          relativeInput: true,
          hoverOnly: !isTouch,
          selector: ".hero-layer:not(.hero-image-layer)",
          scalarX: isTouch ? 4 : 2,
          scalarY: isTouch ? 4 : 2,
          frictionX: isTouch ? 0.18 : 0.1,
          frictionY: isTouch ? 0.18 : 0.1,
        });
      } catch (err) {
        console.error("Failed to init parallax-js:", err);
      }
    };

    // Pick stroke widths based on viewport so the strokes don't dwarf the hero
    // on phones.
    const getStrokeWidths = () =>
      window.matchMedia("(max-width: 768px)").matches
        ? ["40vw", "30vw"]
        : ["22vw", "16vw"];
    const [stroke1Width, stroke2Width] = getStrokeWidths();
    let introComplete = false;
    const syncStrokeWidths = () => {
      const [width1, width2] = getStrokeWidths();
      gsap.set(stroke1Ref.current, { width: width1 });
      gsap.set(stroke2Ref.current, { width: width2 });
    };
    const handleResize = () => {
      if (introComplete) syncStrokeWidths();
    };
    window.addEventListener("resize", handleResize);

    const tl = gsap.timeline({
      onComplete: () => {
        introComplete = true;
        syncStrokeWidths();
        initParallax();
      },
    });

    const counter = { value: 0 };

    // Loader counter: 0 → 100
    tl.to(counter, {
      value: 100,
      duration: 2,
      ease: "power2.inOut",
      onUpdate: () => {
        if (loaderCounterRef.current) {
          loaderCounterRef.current.innerText = `${Math.floor(counter.value)}`;
        }
      },
    }, "anim");

    // Loader slide up
    tl.to(loaderRef.current, {
      y: "-100%",
      duration: 1.8,
      ease: "power3.out",
      onComplete: () => {
        if (loaderRef.current) {
          loaderRef.current.dataset.complete = "true";
          window.dispatchEvent(new Event("hero-loader-complete"));
        }
      },
    }, "anim+=2.2");

    // Counter fade out
    tl.to(loaderCounterRef.current, {
      autoAlpha: 0,
      duration: 1,
      ease: "power2.out",
    }, "anim+=2");

    // Heading chars animation
    tl.to(headingChars, {
      autoAlpha: 1,
      y: 0,
      stagger: {
        amount: 0.5,
        from: "start",
      },
      duration: 1,
      ease: "power3.out",
    }, "anim+=3.2");

    // Image animation
    tl.to(imgRef.current, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 1,
      ease: "sine.out",
    }, ">");

    // Keep the decorative hero title behind the image, then reveal the Navbar.
    tl.addLabel("team-image-complete", ">");
    tl.to(headingRef.current, {
      autoAlpha: 0,
      duration: 0.9,
      ease: "power2.out",
    }, "team-image-complete");

    tl.to(navbar, {
      y: 0,
      yPercent: 0,
      autoAlpha: 1,
      duration: 0.8,
      ease: "power3.out",
    }, ">");

    tl.to(headlineWords, {
      x: 0,
      autoAlpha: 1,
      duration: 0.6,
      stagger: 0.18,
      ease: "power3.out",
    }, ">");

    tl.to(descriptionLines, {
      y: 0,
      autoAlpha: 1,
      duration: 0.55,
      stagger: 0.12,
      ease: "power2.out",
    }, ">");

    // Stroke 2 animation (right side, slightly earlier)
    tl.to(stroke2Ref.current, {
      autoAlpha: 1,
      width: stroke2Width,
      duration: 1,
      ease: "power2.out",
    }, "anim+=4.3");

    // Stroke 1 animation (left side)
    tl.to(stroke1Ref.current, {
      autoAlpha: 1,
      width: stroke1Width,
      duration: 1,
      ease: "power2.out",
    }, "anim+=4.5");

    return () => {
      tl.kill();
      if (parallaxInstanceRef.current) {
        try {
          parallaxInstanceRef.current.destroy();
        } catch (e) {}
        parallaxInstanceRef.current = null;
      }
      window.removeEventListener("touchstart", handleFirstGesture);
      window.removeEventListener("click", handleFirstGesture);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      {/* Loader */}
      <div id="loader" ref={loaderRef}>
        <div id="loader-counter" ref={loaderCounterRef}>0</div>
      </div>

      {/* Hero — direct children of #hero-section are parallax layers.
          Each layer's `data-depth` controls how much it moves with the cursor. */}
      <div id="hero-section" ref={sectionRef}>
        {/* Animated fluid background. Not a `.hero-layer` so parallax-js skips it. */}
        <div id="hero-bg-fluid">
          <LiquidEther
            colors={HERO_LIQUID_COLORS}
            mouseForce={20}
            cursorSize={100}
            isViscous={false}
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo={true}
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
        </div>

        {/* Back stroke (behind heading) */}
        <div className="hero-layer" data-depth="0.20" style={{ zIndex: 4 }}>
          <div id="hero-stroke-2" ref={stroke2Ref}>
            <Image src="/hero-stroke.webp" width={1112} height={878} sizes="32vw" alt="" draggable={false} />
          </div>
        </div>

        {/* Heading text (deepest, moves least) */}
        <div className="hero-layer" data-depth="0.10" style={{ zIndex: 5 }}>
          <div id="hero-heading" ref={headingRef}>
            <SplitChars text="GDGC   MCET" />
          </div>
        </div>

        {/* Main hero message, above the team image in the page composition. */}
        <div className="hero-content-layer" aria-labelledby="hero-message-title">
          <div className="hero-content">
            <h1 id="hero-message-title" className="hero-headline" ref={headlineRef}>
              <span className="hero-headline-word hero-headline-build">Build </span>
              <span className="hero-headline-word hero-headline-learn">Learn </span>
              <span className="hero-headline-word hero-headline-innovate">Innovate</span>
            </h1>
            <p className="hero-description" ref={descriptionRef}>
              <span className="hero-description-line">A campus community for developers to</span>
              <span className="hero-description-line">
                learn, collaborate, and create what&apos;s next.
              </span>
            </p>
          </div>
        </div>

        {/* Portrait image (foreground, moves more) */}
        <div className="hero-layer hero-image-layer" data-depth="0.50" style={{ zIndex: 50 }}>
          <div id="hero-img" ref={imgRef}>
            <picture key={isDarkTheme ? "hero-dark" : "hero-light"}>
              <source
                media="(max-width: 1023.98px)"
                srcSet={isDarkTheme ? HERO_IMAGES.mobile.dark : HERO_IMAGES.mobile.light}
              />
              <img
                src={isDarkTheme ? HERO_IMAGES.desktop.dark : HERO_IMAGES.desktop.light}
                alt="Group portrait"
                width={1280}
                height={720}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                draggable={false}
              />
            </picture>
          </div>
        </div>

        {/* Front stroke (top-most) */}
        <div className="hero-layer" data-depth="0.30" style={{ zIndex: 11 }}>
          <div id="hero-stroke-1" ref={stroke1Ref}>
            <Image src="/hero-stroke.webp" width={1112} height={878} sizes="32vw" alt="" draggable={false} />
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
