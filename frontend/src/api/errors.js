/**
 * Normalize FastAPI / network errors into a flat shape the UI can render.
 * FastAPI returns `{ detail: string | [{loc, msg, type}, ...] }`.
 */
export const extractApiError = (error) => {
  if (!error) return { message: 'Unknown error' };

  if (error.response) {
    const { status, data } = error.response;
    const detail = data?.detail;

    if (Array.isArray(detail)) {
      const fieldErrors = {};
      const messages = [];
      detail.forEach((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : null;
        if (field) fieldErrors[field] = d.msg;
        messages.push(d.msg);
      });
      return {
        status,
        message: messages.join(', ') || 'Validation error',
        fieldErrors,
      };
    }

    return {
      status,
      message: typeof detail === 'string' ? detail : data?.message || error.message,
    };
  }

  if (error.request) {
    return { message: 'Network error — could not reach the server.' };
  }

  return { message: error.message || 'Unknown error' };
};

export default extractApiError;
