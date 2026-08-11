import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';

// FAQ Item component with accordion behavior
const FAQItem: React.FC<{
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        className="flex justify-between items-center w-full text-left py-6"
        onClick={onToggle}
      >
        <span className="text-gray-900 font-medium text-lg">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-primary-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-primary-600" />
        )}
      </button>
      {isOpen && (
        <div className="pb-6">
          <p className="text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

const FAQ: React.FC = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0); // First item open by default

  const faqItems = [
    {
      question: t('faq.questions.payment.question'),
      answer: t('faq.questions.payment.answer')
    },
    {
      question: t('faq.questions.shipping.question'),
      answer: t('faq.questions.shipping.answer')
    },
    {
      question: t('faq.questions.returns.question'),
      answer: t('faq.questions.returns.answer')
    },
    {
      question: t('faq.questions.international.question'),
      answer: t('faq.questions.international.answer')
    },
    {
      question: t('faq.questions.tracking.question'),
      answer: t('faq.questions.tracking.answer')
    }
  ];

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-[1440px] mx-auto px-4 md:px-16">
        <div className="max-w-3xl mx-auto">
          {/* FAQ Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-medium text-primary-600 mb-4">{t('faq.title')}</h1>
            <p className="text-gray-600">{t('faq.subtitle')}</p>
          </div>

          {/* FAQ Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            {faqItems.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
                isOpen={index === openIndex}
                onToggle={() => setOpenIndex(index === openIndex ? -1 : index)}
              />
            ))}
          </div>

          {/* Contact Info */}
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              {t('faq.contact')}{' '}
              <a href="mailto:infoaoinstore@gmail.com" className="text-primary-600 hover:text-primary-600/90">
                infoaoinstore@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ; 