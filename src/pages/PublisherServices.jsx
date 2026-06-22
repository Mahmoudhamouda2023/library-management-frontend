import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookCheck, CheckCircle2, ClipboardCheck, FileUp, ShieldCheck, UploadCloud } from 'lucide-react';
import { apiRequest, getSingle, getToken, getUser, setSession } from '../api/client.js';
import { hasRole } from '../auth/permissions.js';
import Alert from '../components/Alert.jsx';
import ResourceForm from '../components/ResourceForm.jsx';
import { useDashboardText, translateStatusLabel } from '../i18n/dashboardTranslations.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { personImageUrl } from '../utils/media.js';

export default function PublisherServices() {
  const { t } = useLanguage();
  const { dt, language } = useDashboardText();
  const token = getToken();
  const user = getUser();
  const isAdmin = hasRole(user, 'admin');
  const isLibrarian = hasRole(user, 'librarian');
  const isPublisher = hasRole(user, 'publisher');
  const isMember = hasRole(user, 'member') && !isPublisher && !isAdmin && !isLibrarian;
  const [request, setRequest] = useState(null);
  const [requestForm, setRequestForm] = useState({
    display_name: user?.name || '',
    nationality: user?.country || '',
    birth_date: '',
    photo: user?.photo_url || user?.photo || '',
    bio: user?.bio || '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(false);

  const services = [
    { icon: UploadCloud, title: t('publisherService1Title'), text: t('publisherService1Text') },
    { icon: ClipboardCheck, title: t('publisherService2Title'), text: t('publisherService2Text') },
    { icon: BookCheck, title: t('publisherService3Title'), text: t('publisherService3Text') },
  ];

  const steps = [
    t('publisherStep1'),
    t('publisherStep2'),
    t('publisherStep3'),
    t('publisherStep4'),
  ];

  const benefits = [
    t('publisherBenefit1'),
    t('publisherBenefit2'),
    t('publisherBenefit3'),
  ];

  useEffect(() => {
    if (!isMember) return;

    let ignore = false;
    setLoadingRequest(true);
    apiRequest('/publisher-request')
      .then((res) => {
        if (ignore) return;
        const item = getSingle(res);
        const validItem = isValidPublisherRequest(item) ? item : null;
        setRequest(validItem);
        if (validItem) {
          setRequestForm({
            display_name: validItem.display_name || user?.name || '',
            nationality: validItem.nationality || user?.country || '',
            birth_date: validItem.birth_date || '',
            photo: validItem.photo_url || validItem.avatar_url || validItem.photo || user?.photo_url || '',
            bio: validItem.bio || user?.bio || '',
          });
        }
      })
      .catch(() => setRequest(null))
      .finally(() => {
        if (!ignore) setLoadingRequest(false);
      });

    return () => { ignore = true; };
  }, [isMember]);

  async function submitPublisherRequest(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const hasFile = requestForm.photo instanceof File;
      const body = hasFile ? new FormData() : JSON.stringify({
        display_name: requestForm.display_name,
        nationality: requestForm.nationality,
        birth_date: requestForm.birth_date,
        bio: requestForm.bio,
      });

      if (hasFile) {
        Object.entries(requestForm).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') return;
          if (key === 'photo' && !(value instanceof File)) return;
          body.append(key, value);
        });
      }

      const res = await apiRequest('/publisher-request', {
        method: 'POST',
        body,
      });

      const item = getSingle(res);
      const nextRequest = isValidPublisherRequest(item) ? item : null;
      setRequest(nextRequest);
      setSuccess(dt('publisherRequestSent'));

      // نحافظ على الصورة المحلية مباشرة بعد الإرسال إذا اختار المستخدم ملفًا.
      if (nextRequest?.photo_url && user) {
        setSession({ user: { ...user, photo_url: nextRequest.photo_url } });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const heroTarget = getHeroTarget({ token, isAdmin, isLibrarian, isPublisher, isMember });
  const validRequest = isValidPublisherRequest(request);
  const canSubmitRequest = isMember && (!validRequest || request.status === 'rejected');

  return (
    <main className="public-main official-public-main publisher-services-page">
      <section className="publisher-services-hero">
        <div className="public-container publisher-services-hero-inner">
          <div>
            <p><FileUp size={18} /> {t('publisherPageEyebrow')}</p>
            <h1>{t('publisherPageTitle')}</h1>
            <span>{t('publisherPageText')}</span>
            <div className="hero-actions publisher-hero-actions">
              <Link className="button-link" to={heroTarget.to}>
                {heroTarget.label} <ArrowLeft size={17} />
              </Link>
              <Link className="button-link secondary-link" to="/catalog">{t('catalog')}</Link>
            </div>
          </div>

          <div className="publisher-hero-card">
            <ShieldCheck size={40} />
            <strong>{t('publisherServices')}</strong>
            <span>{t('reviewApprove')}</span>
          </div>
        </div>
      </section>

      <section className="public-container page-content-stack">
        <div className="publisher-service-grid">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article className="publisher-service-card" key={service.title}>
                <Icon size={30} />
                <h2>{service.title}</h2>
                <p>{service.text}</p>
              </article>
            );
          })}
        </div>

        {isMember && (
          <section className="process-card publisher-request-public-card">
            <h2>{dt('publisherAccountRequest')}</h2>
            <Alert type="error">{error}</Alert>
            <Alert type="success">{success}</Alert>

            {loadingRequest && <p className="muted">{dt('loading')}</p>}

            {validRequest && (
              <div className="request-status">
                <h3>{dt('lastPublisherRequest')}</h3>
                <p><b>{dt('displayName')}:</b> {request.display_name || '-'}</p>
                <p><b>{dt('nationality')}:</b> {request.nationality || '-'}</p>
                <p><b>{dt('birthDate')}:</b> {request.birth_date || '-'}</p>
                <p><b>{dt('status')}:</b> <span className={`status ${request.status}`}>{translateStatusLabel(request.status, language)}</span></p>
                {personImageUrl(request) && <img className="admin-author-thumb" src={personImageUrl(request)} alt={request.display_name || 'publisher'} />}
                {request.bio && <p><b>{dt('bio')}:</b> {request.bio}</p>}
                {request.rejection_reason && <p><b>{dt('rejectionReason')}:</b> {request.rejection_reason}</p>}
                {request.status === 'approved' && <p>{dt('approvedPublisherHint')} <Link to="/publisher">{dt('goToPublisherPortal')}</Link></p>}
                {request.status === 'pending' && <p>{dt('pendingPublisherHint')}</p>}
              </div>
            )}

            {canSubmitRequest && (
              <>
                <h3>{dt('submitPublisherRequest')}</h3>
                <ResourceForm
                  value={requestForm}
                  onChange={setRequestForm}
                  onSubmit={submitPublisherRequest}
                  onCancel={() => setRequestForm({ display_name: user?.name || '', nationality: user?.country || '', birth_date: '', photo: user?.photo_url || '', bio: user?.bio || '' })}
                  submitting={submitting}
                  fields={[
                    { name: 'display_name', label: dt('publisherAuthorName'), required: true },
                    { name: 'photo', label: dt('publisherAuthorPhoto'), type: 'file', accept: 'image/*' },
                    { name: 'nationality', label: dt('nationality') },
                    { name: 'birth_date', label: dt('birthDate'), type: 'date' },
                    { name: 'bio', label: dt('aboutYou'), type: 'textarea' },
                  ]}
                />
              </>
            )}
          </section>
        )}

        {(isAdmin || isLibrarian) && (
          <section className="process-card publisher-request-public-card">
            <h2>{dt('publisherAccountRequest')}</h2>
            <p className="muted">حسابات الإدارة وأمناء المكتبة لا ترسل طلب ناشر ولا تستخدم عمليات القرّاء من الموقع الخارجي.</p>
          </section>
        )}

        <div className="publisher-info-grid">
          <section className="process-card">
            <h2>{t('publisherStepsTitle')}</h2>
            <ol>
              {steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </section>

          <section className="process-card benefit-card">
            <h2>{t('publisherBenefitsTitle')}</h2>
            <div className="benefit-list">
              {benefits.map((benefit) => (
                <span key={benefit}><CheckCircle2 size={18} /> {benefit}</span>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function getHeroTarget({ token, isAdmin, isLibrarian, isPublisher, isMember }) {
  if (!token) return { to: '/register', label: 'ابدأ كناشر' };
  if (isPublisher) return { to: '/publisher', label: 'لوحة الناشر' };
  if (isAdmin) return { to: '/admin/publisher-requests', label: 'طلبات الناشرين' };
  if (isLibrarian) return { to: '/librarian', label: 'لوحة أمين المكتبة' };
  if (isMember) return { to: '/publisher-services', label: 'تقديم طلب ناشر' };
  return { to: '/profile', label: 'حسابي' };
}

function isValidPublisherRequest(item) {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item) && (item.id || item.status || item.display_name));
}
