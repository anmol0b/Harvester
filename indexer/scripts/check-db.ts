import { ping } from '../src/db';

ping()
  .then(() => { console.log('DB OK ✓'); process.exit(0); })
  .catch((err) => { console.error('DB FAIL:', err.message); process.exit(1); });