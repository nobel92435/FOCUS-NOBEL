import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://ofysppndssyllkolxjky.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9meXNwcG5kc3N5bGxrb2x4amt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDg1MTAsImV4cCI6MjA3MjcyNDUxMH0.x6_aRXrbxSOP7I71oSooWx8x8dedczrtemoUEWiDta8';

const supabase = createClient(supabaseUrl, supabaseKey);
const auth = supabase.auth;
const storage = supabase.storage;

// Firestore compatibility layer implemented with Supabase
const db = {};

function flattenSegments(segs) {
  return segs.flatMap((s) => {
    if (!s) return [];
    if (typeof s === 'string') return s.split('/').filter(Boolean);
    if (s.path) return s.path;
    return [s];
  });
}

function doc(...args) {
  if (args.length && typeof args[0] === 'object' && !args[0].path) {
    args = args.slice(1);
  }
  if (args.length === 1 && args[0]?.path) {
    const path = [...args[0].path];
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => (
            c ^ (Math.random() * 16) >> (c / 4)
          ).toString(16));
    path.push(id);
    return { path };
  }
  const segments = flattenSegments(args);
  return { path: segments };
}

function collection(...args) {
  if (args.length && typeof args[0] === 'object' && !args[0].path) {
    args = args.slice(1);
  }
  const segments = flattenSegments(args);
  return { path: segments };
}

function stripArtifacts(segments) {
  if (segments[0] === 'artifacts') return segments.slice(2);
  return segments;
}

function stripPublic(segments) {
  if (segments[0] === 'public' && segments[1] === 'data') {
    return segments.slice(2);
  }
  return segments;
}

function parseDocPath(ref) {
  if (!ref || !ref.path || ref.path.length < 2) {
    console.error('Invalid doc reference passed to parseDocPath:', ref);
    return { table: undefined, id: undefined, parent: null };
  }
  let segments = stripArtifacts(ref.path);
  segments = stripPublic(segments);
  if (segments.length < 2) {
    console.error('Invalid doc segments after stripping:', segments);
    return { table: undefined, id: undefined, parent: null };
  }
  let table = segments[segments.length - 2];
  if (table === 'users') {
    table = 'profiles'; // Remap 'users' to 'profiles'
  }
  const id = segments[segments.length - 1];
  let parent = segments.length > 2 ? { table: segments[0], id: segments[1] } : null;
  if (parent && parent.table === 'users') {
    parent.table = 'profiles';
  }
  return { table, id, parent };
}

function parseCollectionPath(ref) {
  if (!ref || !ref.path || ref.path.length < 1) {
    console.error('Invalid collection reference passed to parseCollectionPath:', ref);
    return { table: undefined, parent: null };
  }
  let segments = stripArtifacts(ref.path);
  segments = stripPublic(segments);
  if (segments.length < 1) {
    console.error('Invalid collection segments after stripping:', segments);
    return { table: undefined, parent: null };
  }
  let table = segments[segments.length - 1];
  let parent = segments.length > 1 ? { table: segments[0], id: segments[1] } : null;
  if (parent && parent.table === 'users') {
    parent.table = 'profiles';
  }
  if (table === 'users') {
    table = 'profiles';
  }
  return { table, parent };
}

function buildForeignKey(parent) {
  if (!parent) return {};
  return { [`${parent.table.slice(0, -1)}_id`]: parent.id };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(str) {
  return typeof str === 'string' && UUID_REGEX.test(str);
}

function fromPgArray(pgString) {
  if (!pgString) return [];
  if (Array.isArray(pgString)) return pgString;
  if (typeof pgString !== 'string') return [];
  if (pgString === '{}' || pgString === '[]') return [];
  if (pgString.trim().startsWith('[')) {
    try {
      return JSON.parse(pgString)
        .map((v) => String(v))
        .filter(isValidUUID);
    } catch {
      return [];
    }
  }
  return pgString
    .slice(1, -1)
    .split(',')
    .map((v) => v.replace(/^"|"$/g, ''))
    .filter(isValidUUID);
}

function convertTimestamps(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object' && !('toDate' in value)) {
      convertTimestamps(value);
    } else if (
      typeof value === 'string' &&
      ((value.startsWith('{') && value.endsWith('}')) ||
        (value.startsWith('[') && value.endsWith(']')))
    ) {
      obj[key] = fromPgArray(value);
    } else if (typeof value === 'string' || value instanceof Date) {
      const lower = key.toLowerCase();
      if (lower.includes('time') || lower.includes('date') || lower.endsWith('at')) {
        const d = new Date(value);
        if (!isNaN(d)) {
          obj[key] = { toDate: () => d };
        }
      }
    }
  }
  return obj;
}

async function getDoc(ref) {
  const { table, id } = parseDocPath(ref);
  if (!isValidUUID(id)) {
    console.warn('getDoc called with invalid uuid', id);
    return { exists: () => false, data: () => null };
  }
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
  if (error) throw error;
  return { exists: () => !!data, data: () => convertTimestamps(data) };
}

async function setDoc(ref, data) {
  const { table, id, parent } = parseDocPath(ref);
  const payload = { id, ...buildForeignKey(parent), ...data };
  const { error } = await supabase.from(table).upsert(payload);
  if (error) throw error;
}

async function updateDoc(ref, data) {
  const { table, id } = parseDocPath(ref);
  if (!isValidUUID(id)) {
    console.warn('updateDoc called with invalid uuid', id);
    return;
  }
  const { data: existingData } = await supabase.from(table).select('*').eq('id', id).single();
  const existing = convertTimestamps(existingData);
  const payload = {};
  for (const [k, v] of Object.entries(data)) {
    if (v && v.__op === 'increment') {
      payload[k] = (existing?.[k] || 0) + v.value;
    } else if (v && v.__op === 'arrayUnion') {
      const existingArr = Array.isArray(existing?.[k]) ? existing[k] : fromPgArray(existing?.[k]);
      const arr = new Set([...(existingArr || []), v.value]);
      payload[k] = `{${Array.from(arr).join(',')}}`;
    } else if (v && v.__op === 'arrayRemove') {
      const existingArr = Array.isArray(existing?.[k]) ? existing[k] : fromPgArray(existing?.[k]);
      const filteredArr = (existingArr || []).filter((item) => item !== v.value);
      payload[k] = `{${filteredArr.join(',')}}`;
    } else {
      payload[k] = v;
    }
  }
  const { error } = await supabase.from(table).update(payload).eq('id', id);
  if (error) throw error;
}

async function addDoc(collRef, data) {
  const { table, parent } = parseCollectionPath(collRef);
  const payload = { ...buildForeignKey(parent), ...data };
  for (const key in payload) {
    if (Array.isArray(payload[key])) {
      payload[key] = `{${payload[key].join(',')}}`;
    }
  }
  const { data: inserted, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw error;
  return { id: inserted.id };
}

function query(collectionRef, ...mods) {
  return { collectionRef, mods };
}

function orderBy(field, dir = 'asc') {
  return { type: 'orderBy', field, dir };
}

function where(field, op, value) {
  return { type: 'where', field, op, value };
}

function limit(count) {
  return { type: 'limit', count };
}

async function getDocs(q) {
  const collectionRef = q && q.collectionRef ? q.collectionRef : q;
  const mods = q && Array.isArray(q.mods) ? q.mods : [];
  const { table, parent } = parseCollectionPath(collectionRef);

  const operatorMap = {
    '==': 'eq',
    '<': 'lt',
    '<=': 'lte',
    '>': 'gt',
    '>=': 'gte',
    '!=': 'neq',
    'array-contains': 'cs',
    in: 'in',
    'array-contains-any': 'cs',
  };

  let req = supabase.from(table).select('*');
  if (parent) req = req.eq(`${parent.table.slice(0, -1)}_id`, parent.id);

  for (const mod of mods) {
    if (mod.type === 'orderBy') {
      req = req.order(mod.field, { ascending: mod.dir !== 'desc' });
    } else if (mod.type === 'where') {
      const supabaseOp = operatorMap[mod.op] || mod.op;
      let value = mod.value;
      if (value instanceof Date) {
        value = value.toISOString();
      }

      if (supabaseOp === 'in' && Array.isArray(value)) {
        value = `(${value.map((v) => (typeof v === 'string' ? `"${v}"` : v)).join(',')})`;
      }

      if ((supabaseOp === 'cs' || supabaseOp === 'cd') && !Array.isArray(value)) {
        value = `{${value}}`;
      }

      req = req.filter(mod.field, supabaseOp, value);
    } else if (mod.type === 'limit') {
      req = req.limit(mod.count);
    }
  }

  const { data, error } = await req;

  if (error) throw error;
  return { docs: data.map((d) => ({ id: d.id, data: () => convertTimestamps(d) })), empty: data.length === 0 };
}

function runTransaction(_db, fn) {
  return fn({ get: getDoc, update: updateDoc, set: setDoc });
}

function serverTimestamp() {
  return new Date().toISOString();
}

function increment(value) {
  return { __op: 'increment', value };
}

function arrayUnion(value) {
  return { __op: 'arrayUnion', value };
}

function arrayRemove(value) {
  return { __op: 'arrayRemove', value };
}

function onSnapshot(refOrQuery, callback) {
  const isQuery = !!refOrQuery.collectionRef;
  const ref = isQuery ? refOrQuery.collectionRef : refOrQuery;

  let table;
  if (isQuery) {
    ({ table } = parseCollectionPath(ref));
  } else {
    ({ table } = parseDocPath(ref));
  }

  const channel = supabase.channel(`table-changes-${table}-${Math.random()}`);

  const fetchData = async () => {
    try {
      const snapshot = await (isQuery ? getDocs(refOrQuery) : getDoc(refOrQuery));
      if (isQuery) {
        callback({
          docs: snapshot.docs,
          empty: snapshot.empty,
          forEach: (fn) => snapshot.docs.forEach((doc) => fn(doc)),
        });
      } else {
        callback(snapshot);
      }
    } catch (error) {
      console.error(`Real-time fetch error for table '${table}':`, error);
    }
  };

  channel
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      fetchData();
    })
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        fetchData();
      } else if (err) {
        console.error(`Failed to subscribe to real-time changes for table '${table}':`, err);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export {
  supabase,
  auth,
  storage,
  db,
  doc,
  collection,
  query,
  orderBy,
  where,
  limit,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  isValidUUID,
  convertTimestamps,
  parseDocPath,
  parseCollectionPath,
  buildForeignKey,
  fromPgArray,
};
