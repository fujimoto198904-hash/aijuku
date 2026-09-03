'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type FaqItem = {
  label: string;
  question: string;
  answer: string;
};

export function FaqSection({ items }: { items: readonly FaqItem[] }) {
  return (
    <Accordion
      defaultValue={['faq-0']}
      hiddenUntilFound
      className="divide-y divide-rule border-y border-rule"
    >
      {items.map((item, index) => (
        <AccordionItem
          key={item.question}
          value={`faq-${index}`}
          className="group/faq relative border-0 transition-colors duration-300 data-open:bg-sapphire-soft/65"
        >
          <AccordionTrigger
            aria-controls={`faq-panel-${index}`}
            className="min-h-[84px] p-0 text-left text-ink transition-colors duration-300 hover:bg-sapphire-soft/45 hover:no-underline focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sapphire aria-expanded:bg-sapphire-soft/65 **:data-[slot=accordion-trigger-icon]:hidden"
            id={`faq-trigger-${index}`}
          >
            <span className="grid w-full grid-cols-[minmax(0,1fr)_42px] items-center gap-4 px-4 py-5 sm:grid-cols-[132px_minmax(0,1fr)_46px] sm:px-6 sm:py-6">
              <span className="hidden text-xs font-semibold tracking-[0.12em] text-sapphire sm:block">
                {item.label}
              </span>
              <span>
                <span className="mb-2 block text-xs font-semibold tracking-[0.12em] text-sapphire sm:hidden">
                  {item.label}
                </span>
                <span className="block font-mincho text-lg font-medium leading-8 sm:text-[1.35rem] sm:leading-9">
                  {item.question}
                </span>
              </span>
              <span
                className="relative grid size-9 place-items-center rounded-full border border-interactive-border text-brand-dark shadow-[0_7px_18px_rgba(52,95,231,0.08)] transition-colors duration-300 group-aria-expanded/accordion-trigger:border-sapphire group-aria-expanded/accordion-trigger:text-sapphire sm:size-10"
                aria-hidden="true"
              >
                <span className="absolute h-px w-3.5 bg-current" />
                <span className="absolute h-3.5 w-px bg-current transition-[transform,opacity] duration-300 group-aria-expanded/accordion-trigger:rotate-90 group-aria-expanded/accordion-trigger:opacity-0" />
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent
            aria-labelledby={`faq-trigger-${index}`}
            className="px-4 pb-6 text-sm leading-7 text-quiet sm:grid sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-4 sm:px-6 sm:pb-8 sm:text-base"
            id={`faq-panel-${index}`}
          >
            <span className="hidden font-mincho text-lg text-sapphire sm:block">
              回答
            </span>
            <p className="max-w-[64ch] border-l-2 border-future-mint pl-5 sm:border-0 sm:pl-0">
              {item.answer}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
