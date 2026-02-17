import PolicyPage from '../components/PolicyPage';
import { returnsPolicyContent } from '../content/policies';

export default function ReturnsPolicy({ darkMode }) {
  return <PolicyPage darkMode={darkMode} {...returnsPolicyContent} />;
}
