export const RABBITMQ_EXCHANGES = {
    REVIEW: 'review',
    NOTIFICATION: 'notification',
  } as const;
  
  export const RABBITMQ_QUEUES = {
    REVIEW_REQUESTED: 'review.requested',
    REVIEW_COMPLETED: 'review.completed',
    NOTIFICATION_EMAIL: 'notification.email',
  } as const;
  
  export const RABBITMQ_ROUTING_KEYS = {
    REVIEW_REQUESTED: 'review.requested',
    REVIEW_COMPLETED: 'review.completed',
    NOTIFICATION_EMAIL: 'notification.email',
  } as const;