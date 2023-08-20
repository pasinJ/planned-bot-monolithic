print("Start initial entrypoint");

const res = db.createUser({
  user: process.env.BACKEND_USER,
  pwd: process.env.BACKEND_PASSWORD,
  roles: [{ role: "readWrite", db: "backend" }],
});

print("Create new user", res);
