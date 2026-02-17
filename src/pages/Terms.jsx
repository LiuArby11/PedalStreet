import PolicyPage from '../components/PolicyPage';
import { termsContent } from '../content/policies';

export default function Terms({ darkMode }) {
  return <PolicyPage darkMode={darkMode} {...termsContent} />;
}
