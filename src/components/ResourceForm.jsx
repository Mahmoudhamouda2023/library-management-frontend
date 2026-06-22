import { assetUrl } from '../utils/media.js';
import { useDashboardText } from '../i18n/dashboardTranslations.js';

export default function ResourceForm({ fields, value, onChange, onSubmit, onCancel, submitting }) {
  const { dt } = useDashboardText();

  function setField(name, fieldValue) {
    onChange({ ...value, [name]: fieldValue });
  }

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      {fields.map((field) => {
        const currentValue = value[field.name];
        const preview = field.type === 'file' && currentValue && !(currentValue instanceof File)
          ? assetUrl(currentValue)
          : '';

        return (
          <label
            key={field.name}
            className={
              field.type === 'textarea' || field.type === 'file'
                ? 'full'
                : ''
            }
          >
            <span>{field.label}</span>

            {field.type === 'select' ? (
              <select
                value={value[field.name] ?? ''}
                onChange={(e) => setField(field.name, e.target.value)}
                required={field.required}
              >
                <option value="">{dt('choose')}</option>

                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                value={value[field.name] ?? ''}
                onChange={(e) => setField(field.name, e.target.value)}
                required={field.required}
              />
            ) : field.type === 'file' ? (
              <>
                <input
                  type="file"
                  accept={field.accept || 'image/*'}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setField(field.name, file);
                  }}
                  required={field.required && !currentValue}
                />

                {preview && (
                  <div className="upload-preview-row">
                    <img src={preview} alt="preview" />
                    <small className="muted">{dt('currentImageNote')}</small>
                  </div>
                )}

                {currentValue instanceof File && (
                  <small className="muted">
                    {dt('selectedFile')} {currentValue.name}
                  </small>
                )}
              </>
            ) : (
              <input
                type={field.type || 'text'}
                value={value[field.name] ?? ''}
                onChange={(e) => setField(field.name, e.target.value)}
                required={field.required}
              />
            )}
          </label>
        );
      })}

      <div className="form-actions full">
        <button type="button" className="secondary" onClick={onCancel}>
          {dt('cancel')}
        </button>

        <button disabled={submitting}>
          {submitting ? dt('saving') : dt('save')}
        </button>
      </div>
    </form>
  );
}
