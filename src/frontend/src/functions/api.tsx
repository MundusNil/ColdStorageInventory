import { t } from '@lingui/core/macro';

/**
 * Extract a sensible error message from an API error response
 * @param error The error response from the API
 * @param field The field to extract the error message from (optional)
 * @param defaultMessage A default message to use if no error message is found (optional)
 */
export function extractErrorMessage({
  error,
  field,
  defaultMessage
}: {
  error: any;
  field?: string;
  defaultMessage?: string;
}): string {
  const error_data = error.response?.data ?? error.data ?? null;

  let message = '';

  if (error_data) {
    message = error_data[field ?? 'error'] ?? error_data['non_field_errors'];
  }

  // No message? Look at the response status codes
  if (!message) {
    const status = error.status ?? error.response?.status ?? null;

    if (status) {
      switch (status) {
        case 400:
          message = t`请求内容有误`;
          break;
        case 401:
          message = t`未登录或登录已过期`;
          break;
        case 403:
          message = t`没有操作权限`;
          break;
        case 404:
          message = t`没有找到记录`;
          break;
        case 405:
          message = t`当前操作不允许`;
          break;
        case 500:
          message = t`服务器内部错误`;
          break;
        default:
          message = t`未知错误`;
          break;
      }

      message = `${status} - ${message}`;
    }
  }

  if (!message) {
    message = defaultMessage ?? t`发生错误`;
  }

  return message;
}
