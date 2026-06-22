import ResourcePage from './ResourcePage.jsx';
import { useDashboardText } from '../i18n/dashboardTranslations.js';

export default function Categories() {
  const { dt } = useDashboardText();

  return <ResourcePage title={dt('categories')} endpoint="/categories" columns={[
    { key: 'name', label: dt('name') },
    { key: 'description', label: dt('description') }
  ]} fields={[
    { name: 'name', label: dt('categoryName'), required: true },
    { name: 'description', label: dt('description'), type: 'textarea' }
  ]} />;
}
