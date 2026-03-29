/**
 * KittySupps - Main JavaScript
 * Handles: Pricing Logic, Subscription Toggle, Free Gifts,
 *          Gallery, Carousel, Sticky ATC, FAQ, Accordions,
 *          Announcement Bar, Results Animation, Scroll-to-top
 */

/* =============================================
   PRICING DATA
   ============================================= */
const PRICING = {
    1: {
        priceEach: 3099.95,
        originalEach: 3800.00,
        pct: null,
    },
    2: {
        priceEach: 2324.95,
        originalEach: 3800.00,
        pct: 39,
    },
    3: {
        priceEach: 1766.95,
        originalEach: 3800.00,
        pct: 54,
    }
};
const SUBSCRIBE_DISCOUNT = 0.20; // 20%

let currentTier = 0;  // default deselect
let isSubscribed = false;

/* =============================================
   FORMAT CURRENCY
   ============================================= */
function formatPHP(amount) {
    return '₱' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/* =============================================
   UPDATE PRICING DISPLAY
   ============================================= */
function updatePricing() {
    const tier = currentTier;
    const subbed = isSubscribed;

    // Default to Tier 1 pricing info if nothing is selected
    const displayTier = tier === 0 ? 1 : tier;
    const data = PRICING[displayTier];
    if (!data) return;

    // Apply subscription discount if checked
    const discountedEach = subbed ? data.priceEach * (1 - SUBSCRIBE_DISCOUNT) : data.priceEach;
    const total = discountedEach * displayTier;
    const originalTotal = data.originalEach * displayTier;

    // Calculate overall % off relative to original
    const overallPct = Math.round((1 - discountedEach / data.originalEach) * 100);

    // Update each tier's display
    [1, 2, 3].forEach(t => {
        const tData = PRICING[t];
        const tDiscounted = subbed ? tData.priceEach * (1 - SUBSCRIBE_DISCOUNT) : tData.priceEach;
        const tTotal = tDiscounted * t;

        const eachEl = document.getElementById('each' + t);
        const totalEl = document.getElementById('total' + t);
        const origEl = document.getElementById('orig' + t);

        if (eachEl) eachEl.textContent = formatPHP(tDiscounted);
        if (totalEl) totalEl.textContent = 'Total ' + formatPHP(tTotal);
        if (origEl) origEl.textContent = formatPHP(tData.originalEach);

        // Update badge % for multi-tub tiers
        if (t > 1) {
            const pctEl = document.getElementById('pctBadge' + t);
            if (pctEl) {
                const tPct = Math.round((1 - tDiscounted / tData.originalEach) * 100);
                pctEl.textContent = tPct + '% OFF';
            }
        }
    });

    // Update sticky ATC bar pricing
    updateStickyPricing(discountedEach, data.originalEach, overallPct);

    // Update gallery product summary
    updateGallerySummary(discountedEach, data.originalEach, overallPct);
}

function updateStickyPricing(each, original, pct) {
    const price = each;
    const orig = original;
    const el1 = document.getElementById('stickyPriceCurrent');
    const el2 = document.getElementById('stickyPriceOrig');
    const el3 = document.getElementById('stickySave');
    if (el1) el1.textContent = formatPHP(price);
    if (el2) el2.textContent = formatPHP(orig);
    if (el3) el3.textContent = 'SAVE ' + pct + '%';
}

function updateGallerySummary(each, original, pct) {
    const el1 = document.getElementById('gpsCurrent');
    const el2 = document.getElementById('gpsOriginal');
    const el3 = document.getElementById('gpsSave');
    if (el1) el1.textContent = formatPHP(each);
    if (el2) el2.textContent = formatPHP(original);
    if (el3) el3.textContent = 'SAVE ' + pct + '%';
}

/* =============================================
   TIER SELECTION
   ============================================= */
function initPricingTiers() {
    const tiers = document.querySelectorAll('.pricing-tier');
    tiers.forEach(tier => {
        tier.addEventListener('click', function (e) {
            // Prevent the label from automatically firing a click on the internal radio
            e.preventDefault();

            const val = parseInt(this.dataset.tier);
            const oldTier = currentTier;

            // Double tap to deselect
            if (this.classList.contains('selected')) {
                currentTier = 0;
                this.classList.remove('selected');
                const radio = this.querySelector('input[type="radio"]');
                if (radio) radio.checked = false;
                updateFreeGifts(0, oldTier);
                updatePricing();
                return;
            }

            currentTier = val;

            // Update radio
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;

            // Update selected class
            tiers.forEach(t => t.classList.remove('selected'));
            this.classList.add('selected');

            // Update free gifts
            updateFreeGifts(val, oldTier);

            // Update pricing display
            updatePricing();
        });
    });
}

/* =============================================
   FREE GIFTS PROGRESSIVE UNLOCK
   ============================================= */
function updateFreeGifts(tier, oldTier = 0) {
    const gift1 = document.getElementById('gift1');
    const gift2 = document.getElementById('gift2');
    const gift3 = document.getElementById('gift3');

    if (!gift1) return;

    // Toggle Shop Pay button visibility based on selection
    const shopPayWrapper = document.getElementById('shopPayWrapper');
    if (shopPayWrapper) {
        if (tier === 0) {
            shopPayWrapper.style.display = 'block';
        } else {
            shopPayWrapper.style.display = 'none';
        }
    }

    // Gift 1: Unlocked at 1+ tubs
    if (tier >= 1) {
        gift1.classList.remove('locked');
    } else {
        gift1.classList.add('locked');
    }

    // Gift 2: Unlocked at 2+ tubs
    if (tier >= 2) {
        gift2.classList.remove('locked');
    } else {
        gift2.classList.add('locked');
    }

    // Gift 3: Unlocked at 3 tubs
    if (tier >= 3) {
        gift3.classList.remove('locked');
    } else {
        gift3.classList.add('locked');
    }

    // Trigger fade-up animation only on the newly unlocked item(s)
    const slotsToAnimate = [];
    if (tier >= 1 && oldTier < 1) slotsToAnimate.push(gift1);
    if (tier >= 2 && oldTier < 2) slotsToAnimate.push(gift2);
    if (tier >= 3 && oldTier < 3) slotsToAnimate.push(gift3);

    slotsToAnimate.forEach((slot, index) => {
        const inner = slot.querySelector('.gift-slot-inner');
        if (inner) {
            inner.classList.remove('fade-up-active');
            void inner.offsetWidth; // Force reflow
            inner.style.animationDelay = `${index * 0.15}s`; // staggered animation
            inner.classList.add('fade-up-active');
        }
    });
}

/* =============================================
   SUBSCRIBE & SAVE TOGGLE
   ============================================= */
function initSubscribeToggle() {
    const checkbox = document.getElementById('subscribeCheckbox');
    if (!checkbox) return;

    // Start unchecked (one-time purchase by default)
    checkbox.checked = false;
    isSubscribed = false;

    checkbox.addEventListener('change', function () {
        isSubscribed = this.checked;
        updatePricing();
    });
}

/* =============================================
   HERO IMAGE GALLERY
   ============================================= */
function initGallery() {
    const thumbs = document.querySelectorAll('.thumb');
    const mainImg = document.getElementById('mainProductImage');
    const prevBtn = document.getElementById('galleryPrev');
    const nextBtn = document.getElementById('galleryNext');
    let activeIndex = 0;

    function setActive(index) {
        thumbs.forEach(t => t.classList.remove('active'));
        thumbs[index].classList.add('active');
        const fullSrc = thumbs[index].dataset.full || thumbs[index].src;
        if (mainImg) {
            mainImg.style.opacity = '0';
            setTimeout(() => {
                mainImg.src = fullSrc;
                mainImg.style.opacity = '1';
            }, 150);
        }
        activeIndex = index;
        // Scroll thumb into view
        thumbs[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    thumbs.forEach((thumb, i) => {
        thumb.addEventListener('click', () => setActive(i));
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const prev = (activeIndex - 1 + thumbs.length) % thumbs.length;
            setActive(prev);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const next = (activeIndex + 1) % thumbs.length;
            setActive(next);
        });
    }
}

/* =============================================
   MINI TESTIMONIAL CAROUSEL
   ============================================= */
function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.dot');
    if (!track) return;

    let current = 0;
    let autoTimer = null;

    function goTo(index) {
        current = index;
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    function next() {
        const n = (current + 1) % dots.length;
        goTo(n);
    }

    function startAuto() {
        autoTimer = setInterval(next, 4000);
    }

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            clearInterval(autoTimer);
            goTo(i);
            startAuto();
        });
    });

    startAuto();
}

/* =============================================
   FAQ ACCORDION
   ============================================= */
function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    items.forEach(item => {
        const btn = item.querySelector('.faq-question');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            // Close all
            items.forEach(i => i.classList.remove('active'));
            // Open if wasn't active
            if (!isActive) item.classList.add('active');
        });
    });
}

/* =============================================
   PRODUCT ACCORDIONS
   ============================================= */
function initProductAccordions() {
    const items = document.querySelectorAll('.accordion-item');
    items.forEach(item => {
        const btn = item.querySelector('.accordion-header');
        if (!btn) return;
        btn.addEventListener('click', () => {
            item.classList.toggle('active');
        });
    });
}

/* =============================================
   STICKY ATC BAR (IntersectionObserver)
   ============================================= */
function initStickyATC() {
    const stickyBar = document.getElementById('stickyAtc');
    const mainBtn = document.getElementById('mainAtcBtn');
    if (!stickyBar || !mainBtn) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    stickyBar.classList.add('visible');
                } else {
                    stickyBar.classList.remove('visible');
                }
            });
        },
        { threshold: 0.1 }
    );

    observer.observe(mainBtn);

    // Sticky CTA click: smooth scroll to main CTA
    const stickyBtn = document.getElementById('stickyAtcBtn');
    if (stickyBtn) {
        stickyBtn.addEventListener('click', () => {
            mainBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Flash animation
            mainBtn.style.transform = 'scale(1.03)';
            setTimeout(() => { mainBtn.style.transform = ''; }, 300);
        });
    }
}

/* =============================================
   RESULTS SECTION - SVG CIRCLE ANIMATION
   ============================================= */
function initResultsAnimation() {
    const statItems = document.querySelectorAll('.stat-item');
    if (statItems.length === 0) return;

    const circumference = 2 * Math.PI * 52; // r=52

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    // Animate SVG circles
                    const circle = entry.target.querySelector('circle.progress');
                    if (circle && !circle.dataset.animated) {
                        circle.dataset.animated = '1';
                        const pct = parseInt(circle.dataset.pct);
                        const offset = circumference - (pct / 100) * circumference;
                        circle.style.strokeDasharray = circumference;
                        circle.style.strokeDashoffset = circumference;
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                circle.style.strokeDashoffset = offset;
                            });
                        });
                    }
                }
            });
        },
        { threshold: 0.3 }
    );

    statItems.forEach(el => observer.observe(el));
}

/* =============================================
   MOBILE MENU TOGGLE
   ============================================= */
function initMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('mainNav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        nav.classList.toggle('open');
        const icon = toggle.querySelector('i');
        if (nav.classList.contains('open')) {
            icon.className = 'fa-solid fa-xmark';
        } else {
            icon.className = 'fa-solid fa-bars';
        }
    });
}

/* =============================================
   SCROLL TO TOP
   ============================================= */
function initScrollTop() {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* =============================================
   INITIALIZE ALL
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
    // Pricing & selection
    initPricingTiers();
    initSubscribeToggle();

    // Set initial state (no tiers selected by default)
    currentTier = 0;
    updateFreeGifts(0);   // All gifts locked
    updatePricing();

    // UI interactions
    initGallery();
    initCarousel();
    initFAQ();
    initProductAccordions();
    initStickyATC();
    initResultsAnimation();
    initMobileMenu();
    initScrollTop();
});
