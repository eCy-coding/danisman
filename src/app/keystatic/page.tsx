import { Keystatic } from '@keystatic/core/ui';
import config from '../../../keystatic.config';

export default function KeystaticPage() {
  // @ts-expect-error - Keystatic config type mismatch between core and ui
  return <Keystatic config={config} />;
}
