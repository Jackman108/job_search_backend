// Auth services
export * from './auth/profileService.js';

// Vacancy services
export * from './sending/vacancyAuthService.js';
export * from './sending/vacancySubmitService.js';

// Job services
export * from './job/feedbackService.js';
export * from './job/vacancyService.js';

// User services
export * from './user/resume/contactService.js';
export * from './user/resume/resumeService.js';
export * from './user/resume/skillService.js';
export * from './user/resume/workExperienceService.js';


export * from './payment/base/subscriptionsService.js';

// Базовые платежные функции
export * from './payment/base/paymentService.js';
export * from './payment/base/paymentStrategyContext.js';
export * from './payment/base/paymentIntegrationService.js';
export * from './payment/base/paymentErrorHandler.js';

// Стратегии платежей
export * from './payment/webpay/webpayStrategy.js';
export * from './payment/crypto/cryptoStrategy.js';

// Сервисы для работы с платежами
export * from './payment/crypto/cryptoService.js';
export * from './payment/webpay/webpayService.js';

// Необходимые функции из интеграционных сервисов
export {
    createMockCryptoPayment,
    processWebhook,
    deletePendingCryptoPayment
} from './payment/crypto/cryptoIntegrationService.js';

export {
    initWebpayFiatPayment,
    validateWebpaySignature,
    deletePendingWebPayPayment,
    webpayService
} from './payment/webpay/webpayIntegrationService.js';

// Экспорт сервисов для работы с платежами
export { cryptoPaymentService } from './payment/crypto/cryptoService.js';

// Экспорт сервиса информации о платежах
export * from './payment/base/infoPaymentService.js';


