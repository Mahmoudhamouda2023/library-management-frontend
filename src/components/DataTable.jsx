import { useMemo, useState } from 'react';
import { ArrowDownUp, ChevronLeft, ChevronRight, Download, Search, Table2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function DataTable({
  title,
  columns,
  rows = [],
  actions,
  searchable = true,
  exportable = true,
  pagination = true,
  pageSize = 10,
}) {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: '', direction: 'asc' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(pageSize);

  const searchableRows = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return rows;

    return rows.filter((row) => {
      return columns.some((column) => normalize(getPlainValue(row, column)).includes(normalizedQuery));
    });
  }, [rows, columns, query]);

  const sortedRows = useMemo(() => {
    if (!sort.key) return searchableRows;

    const column = columns.find((item) => item.key === sort.key);
    if (!column) return searchableRows;

    return [...searchableRows].sort((a, b) => {
      const first = getPlainValue(a, column);
      const second = getPlainValue(b, column);
      const result = compareValues(first, second, language);
      return sort.direction === 'asc' ? result : -result;
    });
  }, [searchableRows, sort, columns, language]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = pagination
    ? sortedRows.slice((currentPage - 1) * perPage, currentPage * perPage)
    : sortedRows;

  function changeSort(column) {
    if (column.sortable === false) return;

    setSort((current) => {
      if (current.key !== column.key) return { key: column.key, direction: 'asc' };
      if (current.direction === 'asc') return { key: column.key, direction: 'desc' };
      return { key: '', direction: 'asc' };
    });
  }

  function exportCsv() {
    const header = columns.map((column) => column.label).join(',');
    const body = sortedRows.map((row) => columns.map((column) => csvValue(getPlainValue(row, column))).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'data-table'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="data-table-card">
      <div className="data-table-header">
        <div className="data-table-title">
          <Table2 size={20} />
          <div>
            <strong>{title || t('dataTable')}</strong>
            <span>{sortedRows.length} {t('records')}</span>
          </div>
        </div>

        <div className="data-table-tools">
          {searchable && (
            <label className="data-table-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                placeholder={t('searchInsideTable')}
              />
            </label>
          )}

          {exportable && rows.length > 0 && (
            <button type="button" className="secondary data-export-btn" onClick={exportCsv}>
              <Download size={16} /> {t('exportCsv')}
            </button>
          )}
        </div>
      </div>

      <div className="table-wrap professional-table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  <button
                    type="button"
                    className={column.sortable === false ? 'th-button disabled' : 'th-button'}
                    onClick={() => changeSort(column)}
                    disabled={column.sortable === false}
                  >
                    <span>{column.label}</span>
                    {column.sortable !== false && <ArrowDownUp size={14} />}
                  </button>
                </th>
              ))}
              {actions && <th>{t('actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="empty">{t('noData')}</td>
              </tr>
            )}
            {visibleRows.map((row, index) => (
              <tr key={row.id || row.uuid || `${currentPage}-${index}`}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(row) : formatCell(row[column.key])}</td>
                ))}
                {actions && <td className="actions">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && sortedRows.length > 0 && (
        <div className="data-table-footer">
          <div className="per-page-control">
            <span>{t('perPageLabel')}</span>
            <select value={perPage} onChange={(event) => { setPerPage(Number(event.target.value)); setPage(1); }}>
              {[5, 10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>

          <div className="pagination-control">
            <button className="secondary" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              <ChevronRight size={16} /> {t('previous')}
            </button>
            <span>{t('page')} {currentPage} {t('of')} {totalPages}</span>
            <button className="secondary" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
              {t('next')} <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getPlainValue(row, column) {
  if (typeof column.exportValue === 'function') return column.exportValue(row);
  if (typeof column.accessor === 'function') return column.accessor(row);

  const value = row?.[column.key];
  if (value && typeof value === 'object') {
    return value.name || value.title || value.email || JSON.stringify(value);
  }

  return value ?? '';
}

function normalize(value) {
  return String(value ?? '').toLowerCase().trim();
}

function compareValues(first, second, language = 'ar') {
  const firstNumber = Number(first);
  const secondNumber = Number(second);

  if (!Number.isNaN(firstNumber) && !Number.isNaN(secondNumber)) {
    return firstNumber - secondNumber;
  }

  return String(first ?? '').localeCompare(String(second ?? ''), language, { numeric: true, sensitivity: 'base' });
}

function csvValue(value) {
  const text = String(value ?? '').replace(/"/g, '""');
  return `"${text}"`;
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return value.name || value.title || JSON.stringify(value);
  return value;
}
