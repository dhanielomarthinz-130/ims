/**
 * Utility Formatters for Dates, Currency, Badges, FEFO & Expiry Calculations
 */

export const Formatters = {
  /**
   * Formats ISO or date string to readable Indonesian format (e.g. 25 Agu 2026, 14:30)
   */
  formatDateTime: function (dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Formats date only (e.g. 25/08/2026)
   */
  formatDate: function (dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  },

  /**
   * Calculates days remaining until expiration date
   * @param {string} expDateStr - e.g. "2026-12-31"
   * @returns {{ days: number, status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'GOOD', label: string, colorClass: string }}
   */
  getExpiryStatus: function (expDateStr) {
    if (!expDateStr) {
      return { days: 9999, status: 'GOOD', label: 'No Exp Date', colorClass: 'badge-gray' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expDate = new Date(expDateStr);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        days: diffDays,
        status: 'EXPIRED',
        label: `KADALUWARSA (${Math.abs(diffDays)} hari lalu)`,
        colorClass: 'badge-danger'
      };
    } else if (diffDays <= 30) {
      return {
        days: diffDays,
        status: 'CRITICAL',
        label: `Hampir Exp (${diffDays} hari lagi)`,
        colorClass: 'badge-critical'
      };
    } else if (diffDays <= 90) {
      return {
        days: diffDays,
        status: 'WARNING',
        label: `Perhatian (${diffDays} hari lagi)`,
        colorClass: 'badge-warning'
      };
    } else {
      return {
        days: diffDays,
        status: 'GOOD',
        label: `Aman (${diffDays} hari lagi)`,
        colorClass: 'badge-success'
      };
    }
  },

  /**
   * Returns HTML badge for warehouse stock status (Staging, Stored/Tersedia, Out of stock)
   */
  getLocationBadge: function (locationId) {
    if (!locationId || locationId.startsWith('STG')) {
      return `<span class="badge badge-staging"><i class="icon-clock"></i> Staging (${locationId || 'STG-01'})</span>`;
    }
    return `<span class="badge badge-rack"><i class="icon-rack"></i> Rak ${locationId}</span>`;
  },

  /**
   * Format numbers with thousand separators
   */
  formatNumber: function (num) {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('id-ID');
  }
};
