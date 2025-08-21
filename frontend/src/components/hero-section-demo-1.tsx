"use client";

import { motion } from "motion/react";
import WorldMap from "@/components/ui/world-map"; 
import FeaturesSectionDemo from "./ui/features-section-demo-2";
import Footer from "./footer/footer";


export default function HeroSectionOne() {
  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute top-0 h-70 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="px-4 py-10 md:py-20 ">
        <h1 className="relative z-10 mx-auto max-w-4xl text-center text-2xl font-bold text-slate-700 md:text-4xl lg:text-7xl dark:text-slate-300">
          {"Bring your workplace to life by showcasing visuals in minutes."
            .split(" ")
            .map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeInOut",
                }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
        </h1>
        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.3,
            delay: 0.8,
          }}
          className="relative z-10 mx-auto max-w-xl py-4 text-center text-lg font-normal text-neutral-600 dark:text-neutral-400"
        >
          Kaleidoscope turns your office spaces into living galleries — stream vibrant moments, showcase team culture, and display stunning visuals in real time.
        </motion.p>
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.3,
            delay: 1,
          }}
          className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-10"
        >
          <button className="w-60 transform rounded-lg bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
            Explore Now
          </button>
          <button className="w-60 transform rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900">
            Contact Support
          </button>
        </motion.div>

        {/* World Map Section */}
        <motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: 1.2 }}
  className="relative z-10 mt-20 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md dark:border-neutral-800 dark:bg-neutral-900"
>
  <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800 p-2">
    <WorldMap
      dots={[
        {
          start: { lat: 51.5074, lng: -0.1278 },
          end: { lat: 40.7128, lng: -74.0060 },
        },
        {
          start: { lat: 51.5074, lng: -0.1278 },
          end: { lat: 30.7128, lng: 70.0060 },
        },
              {
                start: { lat: 30.7128, lng: 70.0060 },
                end: { lat: 0.7128, lng: 80.0060 },
              },
              {
                start: { lat: 58.6139, lng: 77.2090 }, 
                end: { lat: 39.9042, lng: 116.4074 }, 
              },
              {
                start: { lat: 39.9042, lng: 116.4074 }, 
                end: { lat: 55.6762, lng: 139.6503 }, 
              },
              {
                start: { lat: 51.5074, lng: -0.1278 },  
                end: { lat: 40.7128, lng: -74.0060 },  
              },
              {
                start: { lat: 51.5074, lng: -0.1278 },  
                end: { lat: 30.7128, lng: 70.0060 },  
              },
              {
                start: { lat: 30.7128, lng: 70.0060 },  
                end: { lat: 0.7128, lng: 80.0060 },   
              },              
              {
                start: { lat: -22.9068, lng: -43.1729 }, 
                end: { lat: -33.9249, lng: 18.4241 },  
              },
              {
                start: { lat: -33.9249, lng: 18.4241 }, 
                end: { lat: 43.65107, lng: -79.347015 }, 
              },
              {
                start: { lat: 43.65107, lng: -79.347015 },  
                end: { lat: 30.0444, lng: 31.2357 },    
              },
              {
                start: { lat: 30.0444, lng: 31.2357 },  
                end: { lat: 19.4326, lng: -99.1332 },   
              },
              {
                start: { lat: 19.4326, lng: -99.1332 },  
                end: { lat: -34.6037, lng: -58.3816 },  
              },
              
            ]}
            lineColor="#0ea5e9"
          />
          </div>
        </motion.div>
      </div>
      <section className="w-full px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-10">Features</h2>
        <FeaturesSectionDemo />
      </section>
      <Footer /> 
    </div>
  );
}

