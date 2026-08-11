import React from 'react';
import { useTranslation } from 'react-i18next';

const Terms: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 md:px-16 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-[36px] font-medium text-primary-600 text-center mb-4">{t('terms.title')}</h1>
          <p className="text-gray-600 text-center mb-12">
            {t('terms.lastUpdated')}: December 15, 2024
          </p>
          
          <div className="space-y-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600">
                {t('terms.introduction')}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.acceptance.title')}</h2>
                  <p className="text-gray-600">
                    {t('terms.sections.acceptance.content.0')}
                  </p>
                  <p className="text-gray-600 mt-2">
                    {t('terms.sections.acceptance.content.1')}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.changes.title')}</h2>
                  <p className="text-gray-600">
                    {t('terms.sections.changes.content')}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.account.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('terms.sections.account.content.0')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('terms.sections.account.content.1')}
                  </p>
                  <p className="text-gray-600">
                    {t('terms.sections.account.content.2')}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.conduct.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('terms.sections.conduct.introduction')}
                  </p>
                  {(() => {
                    const rules = t('terms.sections.conduct.rules', { returnObjects: true }) as unknown as string[];
                    return (
                      <ul className="list-disc pl-6 space-y-2 text-gray-600">
                        {Array.isArray(rules) && rules.map((rule, idx) => (
                          <li key={idx}>{rule}</li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>

                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.products.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('terms.sections.products.content.0')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('terms.sections.products.content.1')}
                  </p>
                  <p className="text-gray-600">
                    {t('terms.sections.products.content.2')}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.orderingPayment.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('terms.sections.orderingPayment.content.0')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('terms.sections.orderingPayment.content.1')}
                  </p>
                  <p className="text-gray-600">
                    {t('terms.sections.orderingPayment.content.2')}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.shippingDelivery.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('terms.sections.shippingDelivery.content.0')}
                  </p>
                  <p className="text-gray-600">
                    {t('terms.sections.shippingDelivery.content.1')}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.returnsRefunds.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('terms.sections.returnsRefunds.content.0')}
                  </p>
                  <p className="text-gray-600">
                    {t('terms.sections.returnsRefunds.content.1')}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.intellectualProperty.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('terms.sections.intellectualProperty.content.0')}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('terms.sections.intellectualProperty.content.1')}
                  </p>
                  <p className="text-gray-600">
                    {t('terms.sections.intellectualProperty.content.2')}
                  </p>
                </div>

                <div className="bg-accent-50 p-6 rounded-lg">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.disclaimer.title')}</h2>
                  <p className="text-gray-700 mb-4">
                    {t('terms.sections.disclaimer.content.0')}
                  </p>
                  <p className="text-gray-700">
                    {t('terms.sections.disclaimer.content.1')}
                  </p>
                </div>

                <div className="bg-accent-50 p-6 rounded-lg">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.limitation.title')}</h2>
                  <p className="text-gray-700 mb-4">
                    {t('terms.sections.limitation.content.0')}
                  </p>
                  <p className="text-gray-700">
                    {t('terms.sections.limitation.content.1')}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.indemnification.title')}</h2>
                  <p className="text-gray-600">
                    {t('terms.sections.indemnification.content')}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.privacyPolicy.title')}</h2>
                  <p className="text-gray-600">
                    {t('terms.sections.privacyPolicy.content')}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.governingLaw.title')}</h2>
                  <p className="text-gray-600">
                    {t('terms.sections.governingLaw.content')}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.severability.title')}</h2>
                  <p className="text-gray-600">
                    {t('terms.sections.severability.content')}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.entireAgreement.title')}</h2>
                  <p className="text-gray-600">
                    {t('terms.sections.entireAgreement.content')}
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-medium text-gray-900 mb-4">{t('terms.sections.contact.title')}</h2>
                  <p className="text-gray-600 mb-4">
                    {t('terms.sections.contact.description')}
                  </p>
                  <div className="text-gray-600">
                    <p className="font-medium text-gray-900">{t('terms.sections.contact.name')}</p>
                    {(() => {
                      const addr = t('terms.sections.contact.address', { returnObjects: true }) as unknown as string[];
                      return Array.isArray(addr) ? addr.map((line, i) => <p key={i}>{line}</p>) : null;
                    })()}
                    <p className="mt-2">
                      <span className="text-primary-600">{t('common.email')}:</span> infoaoinstore@gmail.com
                    </p>
                    <p>
                      <span className="text-primary-600">{t('common.phone')}:</span> 989 336 1162
                    </p>
                    <p>
                      <span className="text-primary-600">{t('terms.sections.contact.customerSupport')}:</span> infoaoinstore@gmail.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;