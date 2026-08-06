'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  items: FAQItem[];
}

// Convertit **gras** en <strong>
function formatInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// Formate une réponse avec mise en page multi-lignes
function formatAnswer(text: string): React.ReactNode {
  const paragraphs = text.split('\n\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n');

    // Si une seule ligne -> simple paragraphe
    if (lines.length === 1) {
      elements.push(
        <p key={key++} className="text-gray-700 mb-1">
          {formatInline(lines[0])}
        </p>
      );
      continue;
    }

    // Multi-lignes : séparer titre (première ligne en **gras**) du contenu
    const firstLine = lines[0].trim();
    const rest = lines.slice(1).map(l => l.trim()).filter(Boolean);

    const isTitle = firstLine.startsWith('**') && firstLine.endsWith('**');
    
    // Détecter si les lignes restantes sont des puces • ou numérotées
    const isBulletList = rest.length > 0 && rest.every(l => l.startsWith('•'));
    const isNumberedList = rest.length > 0 && rest.every(l => /^\d+\./.test(l));

    if (isTitle) {
      // Titre de section en gras + contenu
      elements.push(
        <p key={key++} className="font-semibold text-gray-800 mt-3 mb-1 first:mt-0">
          {formatInline(firstLine)}
        </p>
      );
    }

    if (isBulletList) {
      elements.push(
        <ul key={key++} className="list-none space-y-0.5 mb-2 ml-2">
          {rest.map((item, i) => (
            <li key={i} className="text-gray-700 flex gap-2">
              <span className="text-gray-500 shrink-0">•</span>
              <span>{formatInline(item.replace(/^•\s*/, ''))}</span>
            </li>
          ))}
        </ul>
      );
    } else if (isNumberedList) {
      elements.push(
        <ol key={key++} className="list-none space-y-0.5 mb-2 ml-2">
          {rest.map((item, i) => (
            <li key={i} className="text-gray-700 flex gap-2">
              <span className="text-gray-500 font-medium shrink-0">{i + 1}.</span>
              <span>{formatInline(item.replace(/^\d+\.\s*/, ''))}</span>
            </li>
          ))}
        </ol>
      );
    } else if (!isTitle) {
      // Lignes sans formatage particulier
      for (const line of lines) {
        elements.push(
          <p key={key++} className="text-gray-700 mb-1">
            {formatInline(line)}
          </p>
        );
      }
    }
  }

  return <>{elements}</>;
}

export default function FAQSection({ items }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="card">
          <button
            onClick={() => toggleItem(index)}
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900">{item.question}</span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                openIndex === index ? 'transform rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openIndex === index && (
            <div className="px-6 pb-4 text-gray-700">
              {formatAnswer(item.answer)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
