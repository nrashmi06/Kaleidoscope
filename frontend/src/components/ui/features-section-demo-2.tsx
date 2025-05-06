import { cn } from "@/lib/utils";
import {
  IconAdjustmentsBolt,
  IconCloud,
  IconCurrencyDollar,
  IconEaseInOut,
  IconHeart,
  IconHelp,
  IconRouteAltLeft,
  IconTerminal2,
} from "@tabler/icons-react";

export default function FeaturesSectionDemo() {
  const features = [
    {
      title: "Designed for Creators",
      description:
        "Kaleideoscope empowers artists, coders, and visionaries to build without limits.",
      icon: <IconTerminal2 />,
    },
    {
      title: "Intuitive Experience",
      description:
        "Everything flows. Zero friction. Like color through a prism.",
      icon: <IconEaseInOut />,
    },
    {
      title: "Transparent Pricing",
      description:
        "No hidden fees, no contracts — just a clear path to your creative goals.",
      icon: <IconCurrencyDollar />,
    },
    {
      title: "Always On, Always Alive",
      description: "Kaleideoscope is built for resilience, uptime, and scale.",
      icon: <IconCloud />,
    },
    {
      title: "Multi-Dimensional Access",
      description:
        "Share, collaborate, and explore across teams and timelines.",
      icon: <IconRouteAltLeft />,
    },
    {
      title: "Real-time Assistance",
      description:
        "Our support is infused with AI — fast, responsive, and human-friendly.",
      icon: <IconHelp />,
    },
    {
      title: "Creative Confidence",
      description:
        "Try it risk-free. If it doesn’t spark inspiration, you don’t pay.",
      icon: <IconAdjustmentsBolt />,
    },
    {
      title: "Infinite Possibilities",
      description:
        "Your imagination is the only boundary. We provide the canvas.",
      icon: <IconHeart />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
        <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      </div>
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature transition-shadow duration-200 hover:shadow-lg dark:border-neutral-800",
        (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
        index < 4 && "lg:border-b dark:border-neutral-800"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
