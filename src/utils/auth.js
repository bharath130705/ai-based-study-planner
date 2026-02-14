const USERS_KEY = "sp_users"; // all registered users
const CURRENT_KEY = "sp_user"; // logged in user

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ---------- SIGNUP ----------
export function signup(email, password) {
  const users = getUsers();

  if (users.find((u) => u.email === email)) {
    return { ok: false, msg: "Email already registered" };
  }

  users.push({ email, password });
  saveUsers(users);
  localStorage.setItem(CURRENT_KEY, JSON.stringify({ email }));
  return { ok: true };
}

// ---------- LOGIN ----------
export function login(email, password) {
  const users = getUsers();
  const user = users.find((u) => u.email === email);

  if (!user) return { ok: false, msg: "Email not found" };
  if (user.password !== password)
    return { ok: false, msg: "Wrong password" };

  localStorage.setItem(CURRENT_KEY, JSON.stringify({ email }));
  return { ok: true };
}

// ---------- SESSION ----------
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_KEY));
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getUser()?.email;
}

export function logout() {
  localStorage.removeItem(CURRENT_KEY);
}
