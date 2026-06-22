import ResourcePage from './ResourcePage.jsx';
import { useDashboardText } from '../i18n/dashboardTranslations.js';

export default function Members() {
  const { dt } = useDashboardText();

  return <ResourcePage title={dt('members')} endpoint="/members" columns={[
    { key: 'membership_number', label: dt('membershipNumber') },
    { key: 'name', label: dt('name') },
    { key: 'email', label: dt('email') },
    { key: 'phone', label: dt('phone') },
    { key: 'status', label: dt('status') }
  ]} fields={[
    { name: 'membership_number', label: dt('membershipNumber'), required: true },
    { name: 'name', label: dt('memberName'), required: true },
    { name: 'email', label: dt('email'), type: 'email' },
    { name: 'phone', label: dt('phone') },
    { name: 'address', label: dt('address'), type: 'textarea' },
    { name: 'joined_at', label: dt('joinedAt'), type: 'date' },
    { name: 'status', label: dt('status'), type: 'select', options: [{ value: 'active', label: 'active' }, { value: 'inactive', label: 'inactive' }, { value: 'suspended', label: 'suspended' }] }
  ]} />;
}
