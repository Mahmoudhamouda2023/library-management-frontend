import ResourcePage from './ResourcePage.jsx';
import { personImageUrl } from '../utils/media.js';
import { useDashboardText } from '../i18n/dashboardTranslations.js';

export default function Authors() {
  const { dt } = useDashboardText();

  return <ResourcePage
    title={dt('authors')}
    endpoint="/authors"
    columns={[
      { key: 'photo', label: dt('photo'), sortable: false, render: (r) => <AuthorThumb author={r} fallback={dt('authors').slice(0, 1)} /> },
      { key: 'name', label: dt('name') },
      { key: 'nationality', label: dt('nationality') },
      { key: 'birth_date', label: dt('birthDate') },
      { key: 'bio', label: dt('bio') },
    ]}
    fields={[
      { name: 'name', label: dt('authorName'), required: true },
      { name: 'photo', label: dt('authorPhoto'), type: 'file', accept: 'image/*' },
      { name: 'nationality', label: dt('nationality') },
      { name: 'birth_date', label: dt('birthDate'), type: 'date' },
      { name: 'bio', label: dt('bio'), type: 'textarea' },
    ]}
  />;
}

function AuthorThumb({ author, fallback }) {
  const photo = personImageUrl(author);
  return photo ? <img className="admin-author-thumb" src={photo} alt={author.name} /> : <span className="author-avatar-mini">{String(author.name || fallback || 'A').slice(0, 1)}</span>;
}
