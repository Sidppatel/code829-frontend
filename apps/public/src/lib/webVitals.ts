import type { Metric } from 'web-vitals';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('WebVitals');

function reportMetric(metric: Metric) {
  log.info(`${metric.name}: ${Math.round(metric.value)}ms (rating: ${metric.rating})`, {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
  });
}

export async function initWebVitals() {
  try {
    const { onCLS, onLCP, onFCP, onTTFB, onINP } = await import('web-vitals');
    onCLS(reportMetric);
    onINP(reportMetric);
    onLCP(reportMetric);
    onFCP(reportMetric);
    onTTFB(reportMetric);
  } catch {
    // web-vitals may not load in all environments
  }
}
