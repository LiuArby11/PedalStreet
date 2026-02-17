import PolicyPage from '../components/PolicyPage';
import { privacyPolicyContent } from '../content/policies';

export default function PrivacyPolicy({ darkMode }) {
  return <PolicyPage darkMode={darkMode} {...privacyPolicyContent} />;
}
