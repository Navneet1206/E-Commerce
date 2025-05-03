import React from 'react';
import useInView from '../hooks/useInView';
import Hero from '../components/Hero';
import LatestCollection from '../components/LatestCollection';
import BestSeller from '../components/BestSeller';
import OurPolicy from '../components/OurPolicy';
import NewsletterBox from '../components/NewsletterBox';
import Testimonial from '../components/Testimonial';
import RecommendedProducts from '../components/RecommendedProducts';

const Home = () => {
  const [heroRef, heroInView] = useInView({ threshold: 0.1 });
  const [latestRef, latestInView] = useInView({ threshold: 0.1 });
  const [bestSellerRef, bestSellerInView] = useInView({ threshold: 0.1 });
  const [testimonialRef, testimonialInView] = useInView({ threshold: 0.1 });
  const [policyRef, policyInView] = useInView({ threshold: 0.1 });
  const [newsletterRef, newsletterInView] = useInView({ threshold: 0.1 });
  const [recommendedRef, recommendedInView] = useInView({ threshold: 0.1 });

  return (
    <div>
      <div ref={heroRef} className={`section ${heroInView ? 'visible' : ''}`}>
        <Hero />
      </div>
      <div ref={latestRef} className={`section ${latestInView ? 'visible' : ''}`}>
        <LatestCollection />
      </div>
      <div ref={recommendedRef} className={`section ${recommendedInView ? 'visible' : ''}`}>
        <RecommendedProducts />
      </div>
      <div ref={bestSellerRef} className={`section ${bestSellerInView ? 'visible' : ''}`}>
        <BestSeller />
      </div>
      <div ref={testimonialRef} className={`section ${testimonialInView ? 'visible' : ''}`}>
        <Testimonial />
      </div>
      <div ref={policyRef} className={`section ${policyInView ? 'visible' : ''}`}>
        <OurPolicy />
      </div>
      <div ref={newsletterRef} className={`section ${newsletterInView ? 'visible' : ''}`}>
        <NewsletterBox />
      </div>
    </div>
  );
};

export default Home;