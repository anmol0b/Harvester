import db from '../src/db';

db.ping()
  .then(() => { console.log('DB OK ✓'); process.exit(0); })
  .catch((err: Error) => { console.error('DB FAIL:', err.message); process.exit(1); });