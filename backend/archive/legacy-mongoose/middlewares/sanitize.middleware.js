const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (forbiddenKeys.has(key) || key.startsWith('$') || key.includes('.')) {
        delete value[key];
        continue;
      }
      value[key] = sanitizeValue(value[key]);
    }
  }

  return value;
}

export function sanitizeInput(req, _res, next) {
  if (req.body && typeof req.body === 'object') sanitizeValue(req.body);
  if (req.params && typeof req.params === 'object') sanitizeValue(req.params);
  // Express 5 expose req.query via getter. On évite donc de réassigner req.query.
  if (req.query && typeof req.query === 'object') sanitizeValue(req.query);
  next();
}
