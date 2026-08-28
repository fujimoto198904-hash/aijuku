'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { faqItems } from '@/lib/site-content';

export function FaqSection() {
  return (
    <Accordion className="overflow-hidden rounded-[28px] border border-ink/10 bg-white px-5 shadow-[0_20px_60px_rgba(8,16,25,0.06)] sm:px-8">
      {faqItems.map((item, index) => (
        <AccordionItem key={item.question} value={`faq-${index}`} className="border-ink/10">
          <AccordionTrigger className="min-h-20 py-5 text-base font-bold leading-7 text-ink hover:no-underline">
            <span className="flex gap-4 pr-4">
              <span className="font-mono text-xs text-coral">{String(index + 1).padStart(2, '0')}</span>
              {item.question}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pl-0 pr-6 text-sm leading-7 text-ink/65 sm:pl-10">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
